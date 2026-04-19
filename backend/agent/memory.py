"""Per-session in-memory conversation history."""
from collections import defaultdict


class ConversationMemory:
    """Stores message history for each session with a sliding-window cap.

    The system prompt is always at index 0 and is never evicted.
    """

    def __init__(self, max_turns: int = 20):
        self._sessions: dict[str, list[dict]] = defaultdict(list)
        self._max_turns = max_turns

    def set_system_prompt(self, session_id: str, content: str) -> None:
        """Insert system prompt as the first message (idempotent)."""
        messages = self._sessions[session_id]
        if not messages or messages[0].get("role") != "system":
            self._sessions[session_id].insert(0, {"role": "system", "content": content})

    def add_message(self, session_id: str, role: str, content: str) -> None:
        self._sessions[session_id].append({"role": role, "content": content})
        self._trim(session_id)

    def add_raw(self, session_id: str, message: dict) -> None:
        """Add a pre-built message dict (e.g., a tool_call assistant message)."""
        self._sessions[session_id].append(message)
        self._trim(session_id)

    def get_messages(self, session_id: str) -> list[dict]:
        return list(self._sessions[session_id])

    def _trim(self, session_id: str) -> None:
        messages = self._sessions[session_id]
        # Keep system prompt (index 0) + last (max_turns - 1) messages
        if len(messages) > self._max_turns:
            system = messages[0] if messages[0].get("role") == "system" else None
            tail = messages[-(self._max_turns - 1):]
            self._sessions[session_id] = ([system] if system else []) + tail

    def clear(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
