"""Agentic loop: LLM decision → tool execution → re-feed → stream response."""
import json
import logging
from typing import AsyncGenerator

import ollama

from agent.memory import ConversationMemory
from agent.prompt import get_system_prompt
from mcp_server.api_client import AirlineAPIClient
from mcp_server.tools import (
    TOOL_DEFINITIONS,
    build_tool_registry,
    query_flight_impl,
    book_flight_impl,
    check_in_impl,
)

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5

TOOL_LABELS = {
    "query_flight": "Searching for flights",
    "book_flight": "Booking your ticket",
    "check_in": "Processing check-in",
}


def _log_messages(round_num: int, messages: list) -> None:
    """Dump the full message list being sent to the LLM."""
    logger.debug("=" * 60)
    logger.debug("[ORCH] round=%d — sending %d messages to LLM:", round_num, len(messages))
    for i, m in enumerate(messages):
        role = m.get("role", "?") if isinstance(m, dict) else getattr(m, "role", "?")
        content = m.get("content", "") if isinstance(m, dict) else getattr(m, "content", "")
        tool_calls = m.get("tool_calls") if isinstance(m, dict) else getattr(m, "tool_calls", None)
        content_preview = (content or "")[:300].replace("\n", "\\n")
        if tool_calls:
            logger.debug("  [%d] role=%-10s tool_calls=%s", i, role, tool_calls)
        else:
            logger.debug("  [%d] role=%-10s content=%r", i, role, content_preview)
    logger.debug("=" * 60)


def _log_response(round_num: int, msg) -> None:
    """Dump the raw LLM response."""
    logger.debug("-" * 60)
    logger.debug("[ORCH] round=%d — raw LLM response:", round_num)
    logger.debug("  role    : %s", getattr(msg, "role", "?"))
    logger.debug("  content : %r", (getattr(msg, "content", "") or "")[:500])
    tool_calls = getattr(msg, "tool_calls", None)
    if tool_calls:
        logger.debug("  tool_calls: %s", tool_calls)
    else:
        logger.debug("  tool_calls: None")
    logger.debug("-" * 60)


def _extract_tool_calls(msg) -> list | None:
    """Return tool calls from an ollama Message object.

    llama3.1 / newer models put tool calls in msg.tool_calls.
    qwen2.5-coder puts a raw JSON object in msg.content instead.
    This function handles both formats.
    """
    # ── Format A: native tool_calls field (llama3.1, etc.) ───────────────────
    tool_calls = getattr(msg, "tool_calls", None)
    if tool_calls:
        result = []
        for tc in tool_calls:
            fn = getattr(tc, "function", tc)
            name = getattr(fn, "name", None) or (fn.get("name", "") if isinstance(fn, dict) else "")
            args = getattr(fn, "arguments", None)
            if args is None and isinstance(fn, dict):
                args = fn.get("arguments", {})
            result.append({"function": {"name": name, "arguments": args or {}}})
        logger.debug("[ORCH] _extract_tool_calls → Format A, %d call(s): %s", len(result), result)
        return result if result else None

    # ── Format B: JSON string in content (qwen2.5-coder fallback) ────────────
    content = getattr(msg, "content", "") or ""
    content = content.strip()
    if content.startswith("{"):
        try:
            data = json.loads(content)
            if "name" in data and data["name"] in ("query_flight", "book_flight", "check_in"):
                logger.info("[ORCH] _extract_tool_calls → Format B (content JSON) for '%s'", data["name"])
                return [{"function": {"name": data["name"], "arguments": data.get("arguments", {})}}]
        except json.JSONDecodeError:
            pass

    logger.debug("[ORCH] _extract_tool_calls → no tool calls detected")
    return None


class AgentOrchestrator:
    def __init__(
        self,
        memory: ConversationMemory,
        api_client: AirlineAPIClient,
        model: str,
    ):
        self.memory = memory
        self.api_client = api_client
        self.tool_registry = build_tool_registry(api_client)
        self.model = model

    async def process_message(
        self, session_id: str, user_message: str
    ) -> AsyncGenerator[str, None]:
        self.memory.set_system_prompt(session_id, get_system_prompt())
        self.memory.add_message(session_id, "user", user_message)

        messages = self.memory.get_messages(session_id)

        for round_num in range(MAX_TOOL_ROUNDS):
            logger.info("[ORCH] ── round %d / session=%s ──────────────────────────", round_num + 1, session_id)
            _log_messages(round_num + 1, messages)

            # ── Decision call (non-streaming) ─────────────────────────────────
            try:
                response = ollama.chat(
                    model=self.model,
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    stream=False,
                )
            except Exception as exc:
                logger.exception("[ORCH] Ollama chat error on round %d", round_num + 1)
                yield json.dumps({"type": "error", "content": f"LLM error: {exc}"})
                return

            msg = response.message
            _log_response(round_num + 1, msg)
            tool_calls = _extract_tool_calls(msg)

            if tool_calls:
                # ── Execute tools ─────────────────────────────────────────────
                assistant_record = {
                    "role": "assistant",
                    "content": getattr(msg, "content", "") or "",
                }
                raw_tool_calls = getattr(msg, "tool_calls", None)
                if raw_tool_calls:
                    assistant_record["tool_calls"] = raw_tool_calls
                    logger.debug("[ORCH] assistant_record includes tool_calls: %s", raw_tool_calls)
                messages.append(assistant_record)
                self.memory.add_raw(session_id, assistant_record)

                for tc in tool_calls:
                    fn_name = tc["function"]["name"]
                    fn_args = tc["function"].get("arguments", {})

                    label = TOOL_LABELS.get(fn_name, f"Running {fn_name}")
                    yield json.dumps({"type": "tool_call", "tool": fn_name, "label": label})
                    logger.info(
                        "[ORCH] round=%d calling tool=%r args=%s",
                        round_num + 1, fn_name, json.dumps(fn_args, ensure_ascii=False),
                    )

                    tool_fn = self.tool_registry.get(fn_name)
                    if tool_fn:
                        try:
                            if fn_name == "query_flight":
                                tool_result, structured = await query_flight_impl(
                                    self.api_client, **fn_args
                                )
                                if structured:
                                    yield json.dumps({
                                        "type": "tool_result",
                                        "tool": "query_flight",
                                        "data": structured,
                                    })
                            elif fn_name == "book_flight":
                                tool_result, structured = await book_flight_impl(
                                    self.api_client, **fn_args
                                )
                                if structured:
                                    yield json.dumps({
                                        "type": "tool_result",
                                        "tool": "book_flight",
                                        "data": structured,
                                    })
                            elif fn_name == "check_in":
                                tool_result, structured = await check_in_impl(
                                    self.api_client, **fn_args
                                )
                                if structured:
                                    yield json.dumps({
                                        "type": "tool_result",
                                        "tool": "check_in",
                                        "data": structured,
                                    })
                            else:
                                tool_result = await tool_fn(**fn_args)
                        except TypeError as exc:
                            logger.error(
                                "[ORCH] tool '%s' called with bad args %s — TypeError: %s",
                                fn_name, fn_args, exc,
                            )
                            tool_result = f"Tool argument error: {exc}"
                        except Exception as exc:
                            logger.exception("[ORCH] tool '%s' raised an exception", fn_name)
                            tool_result = f"Tool error: {exc}"
                    else:
                        logger.warning("[ORCH] unknown tool requested: %r", fn_name)
                        tool_result = f"Unknown tool: {fn_name}"

                    logger.info(
                        "[ORCH] tool=%r result (%d chars):\n%s",
                        fn_name, len(tool_result), tool_result,
                    )

                    tool_msg = {"role": "tool", "content": tool_result}
                    messages.append(tool_msg)
                    self.memory.add_raw(session_id, tool_msg)
                    logger.debug("[ORCH] appended tool_msg: %s", tool_msg)

                continue  # let LLM process the tool results

            # ── Final text response ───────────────────────────────────────────
            content = getattr(msg, "content", "") or ""
            if content:
                logger.info(
                    "[ORCH] round=%d final response (%d chars):\n%s",
                    round_num + 1, len(content), content,
                )
                words = content.split(" ")
                for i, word in enumerate(words):
                    token = word if i == 0 else " " + word
                    yield json.dumps({"type": "token", "content": token})

                self.memory.add_message(session_id, "assistant", content)
                return
            else:
                logger.warning("[ORCH] round=%d — empty content, no tool calls", round_num + 1)
                yield json.dumps({"type": "error", "content": "Received an empty response. Please try again."})
                return

        yield json.dumps({
            "type": "error",
            "content": "I had trouble completing your request. Please try rephrasing.",
        })
