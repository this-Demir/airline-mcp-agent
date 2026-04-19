import { useEffect, useRef } from 'react';
import { Plane } from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';

const SUGGESTIONS = [
  'Show me flights from Istanbul to Frankfurt on June 20th',
  'Book flight TK1923 for John Doe on 2026-06-20',
  'Check in with PNR ABC123 for John Doe',
];

interface Props {
  messages: ChatMessage[];
  onSuggestion: (text: string) => void;
}

export function ChatWindow({ messages, onSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto chat-scroll bg-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {messages.length === 0 ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 mb-2">Airline AI Assistant</h1>
              <p className="text-slate-500 text-sm max-w-sm">
                I can help you search for flights, book tickets, and check in for your journey.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  className="
                    text-left px-4 py-3 rounded-xl border border-slate-200 bg-white
                    text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50
                    hover:text-blue-700 transition-all shadow-sm
                  "
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
