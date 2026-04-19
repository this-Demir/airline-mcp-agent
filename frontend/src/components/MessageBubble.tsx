import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plane } from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { ToolCallIndicator } from './ToolCallIndicator';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
          <Plane className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool call indicators — only for assistant */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallIndicator toolCalls={message.toolCalls} />
        )}

        {/* Message bubble */}
        {(message.content || message.isStreaming) && (
          <div
            className={`
              px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
              ${isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
              }
            `}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <div className="prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content || ''}
                </ReactMarkdown>
                {message.isStreaming && !message.content && (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[11px] text-slate-400 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
