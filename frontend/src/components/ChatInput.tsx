import { useRef, useState, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask about flights, book a ticket, or check in…"
            rows={1}
            className="
              w-full resize-none rounded-xl border border-slate-300 bg-slate-50
              px-4 py-2.5 pr-4 text-sm text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all leading-relaxed
            "
            style={{ minHeight: '42px', maxHeight: '160px' }}
          />
        </div>

        <button
          onClick={isStreaming ? onStop : handleSend}
          disabled={!isStreaming && !value.trim()}
          className={`
            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
            transition-all shadow-sm
            ${isStreaming
              ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
              : value.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
          title={isStreaming ? 'Stop' : 'Send'}
        >
          {isStreaming ? (
            <Square className="w-4 h-4" fill="currentColor" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-400 mt-1.5">
        Press <kbd className="font-mono bg-slate-100 px-1 rounded">Enter</kbd> to send &middot; <kbd className="font-mono bg-slate-100 px-1 rounded">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
