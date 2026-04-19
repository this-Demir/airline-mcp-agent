import { useEffect, useRef } from 'react';
import { Search, Plane, CheckSquare } from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';

const WELCOME_ACTIONS = [
  {
    icon: Search,
    label: 'Query Flight',
    message: 'I want to find a flight from IST to FRA on 18 June for one person',
    active: true,
  },
  {
    icon: Plane,
    label: 'Book Flight',
    message: 'I would like to book a flight from IST to FRA on 18 June for one person',
    active: false,
  },
  {
    icon: CheckSquare,
    label: 'Check In',
    message: 'I want to check in for my flight with PNR ',
    active: false,
  },
] as const;

interface Props {
  messages: ChatMessage[];
  onPrefill: (text: string) => void;
}

export function ChatWindow({ messages, onPrefill }: Props) {

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto chat-scroll bg-slate-50 px-4 py-5">
      {messages.length === 0 ? (
        /* Welcome screen */
        <div className="flex flex-col gap-3">
          {/* AI greeting bubble */}
          <div className="flex items-end gap-3 msg-in">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-100">
              <Plane className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-[75%]">
              <p className="text-[13.5px] font-semibold text-slate-700 leading-snug">
                Hello! How can I assist you today?
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="ml-11 flex flex-col gap-2">
            {WELCOME_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onPrefill(action.message)}
                  className={`
                    msg-in flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-semibold
                    transition-all duration-150 text-left cursor-pointer
                    ${action.active
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                    }
                  `}
                  style={{ animationDelay: `${80 + i * 70}ms` }}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${action.active ? 'text-blue-600' : 'text-slate-400'}`}
                  />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Messages */
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} index={i} onPrefill={onPrefill} />
          ))}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
