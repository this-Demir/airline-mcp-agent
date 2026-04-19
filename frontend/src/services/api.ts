import type { SSEEvent } from '../types/chat';

export async function* streamChat(
  message: string,
  sessionId: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const raw = trimmed.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const event: SSEEvent = JSON.parse(raw);
            yield event;
          } catch {
            // Ignore malformed lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
