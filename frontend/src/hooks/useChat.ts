import { useCallback, useRef, useState } from 'react';
import { streamChat } from '../services/api';
import type { ChatMessage, ToolCallInfo } from '../types/chat';

function uuid() {
  return crypto.randomUUID();
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionId = useRef(uuid());
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming || !content.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Add placeholder assistant message
    const assistantId = uuid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      toolCalls: [],
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const stream = streamChat(content.trim(), sessionId.current, controller.signal);

      for await (const event of stream) {
        if (event.type === 'tool_call' && event.tool) {
          const toolCall: ToolCallInfo = {
            tool: event.tool,
            label: event.label ?? event.tool,
            status: 'running',
          };
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCall] }
                : m
            )
          );
        } else if (event.type === 'token' && event.content) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? {
                    ...m,
                    content: m.content + event.content,
                    // Mark the last tool call as completed when tokens start arriving
                    toolCalls: (m.toolCalls ?? []).map((tc, i, arr) =>
                      i === arr.length - 1 ? { ...tc, status: 'completed' } : tc
                    ),
                  }
                : m
            )
          );
        } else if (event.type === 'error' && event.content) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: `Error: ${event.content}`, isStreaming: false }
                : m
            )
          );
          setIsStreaming(false);
          return;
        } else if (event.type === 'done') {
          break;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'Connection error. Please try again.', isStreaming: false }
              : m
          )
        );
      }
    } finally {
      // Finalise the assistant message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                isStreaming: false,
                toolCalls: (m.toolCalls ?? []).map(tc => ({ ...tc, status: 'completed' })),
              }
            : m
        )
      );
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, sendMessage, isStreaming, stopStreaming };
}
