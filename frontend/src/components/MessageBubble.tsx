import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plane, User } from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { ToolCallIndicator } from './ToolCallIndicator';
import { FlightResultCard } from './FlightResultCard';
import { BookingResultCard } from './BookingResultCard';
import { CheckInResultCard } from './CheckInResultCard';

interface Props {
  message: ChatMessage;
  index: number;
  onPrefill: (text: string) => void;
}

export function MessageBubble({ message, index, onPrefill }: Props) {
  const isUser = message.role === 'user';
  const delay = Math.min(index * 25, 100);

  return (
    <div
      className={`flex gap-2.5 msg-in ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-slate-500" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-100">
          <Plane className="w-3 h-3 text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool call indicators */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallIndicator toolCalls={message.toolCalls} />
        )}

        {/* Bubble */}
        {(message.content || message.isStreaming) && (
          <div
            className={`
              px-4 py-3 text-[13.5px] leading-relaxed
              ${isUser
                ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-blue-200/60'
                : 'bg-white text-slate-800 rounded-2xl rounded-bl-sm border border-slate-100 shadow-sm'
              }
            `}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap font-medium">{message.content}</span>
            ) : (
              <div className="prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content || ''}
                </ReactMarkdown>
                {message.isStreaming && !message.content && (
                  <span className="inline-flex gap-1 items-end h-4">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full dot-1" />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full dot-2" />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full dot-3" />
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result cards — shown below the bubble for assistant messages */}
        {!isUser && message.flightResults && message.flightResults.length > 0 && (
          <FlightResultCard flights={message.flightResults} onPrefill={onPrefill} />
        )}
        {!isUser && message.bookingResult && (
          <BookingResultCard booking={message.bookingResult} onPrefill={onPrefill} />
        )}
        {!isUser && message.checkInResult && (
          <CheckInResultCard result={message.checkInResult} onPrefill={onPrefill} />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 font-medium px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
