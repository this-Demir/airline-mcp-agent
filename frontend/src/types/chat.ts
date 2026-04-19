export type MessageRole = 'user' | 'assistant';

export interface ToolCallInfo {
  tool: string;
  label: string;
  status: 'running' | 'completed';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

export interface SSEEvent {
  type: 'token' | 'tool_call' | 'done' | 'error';
  content?: string;
  tool?: string;
  label?: string;
}
