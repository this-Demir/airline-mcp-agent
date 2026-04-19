import { useRef, useState, useEffect, type KeyboardEvent } from 'react';
import { Square, Plus, ChevronRight } from 'lucide-react';

interface Suggestion {
  label: string;
  message: string;
}

interface Props {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  suggestions?: Suggestion[];
  prefillValue?: string;
  onPrefillClear?: () => void;
}

export function ChatInput({ onSend, onStop, isStreaming, suggestions = [], prefillValue, onPrefillClear }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When a prefill arrives (from welcome buttons or suggestion chips), populate the textarea
  useEffect(() => {
    if (!prefillValue) return;
    setValue(prefillValue);
    onPrefillClear?.();
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      // Let DOM update first so scrollHeight is correct
      setTimeout(() => {
        if (ta) ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }, 0);
    }
  }, [prefillValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  const handleSuggestion = (msg: string) => {
    setValue(msg);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      setTimeout(() => {
        if (ta) ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }, 0);
    }
  };

  const isActive = !!value.trim();

  return (
    <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 pt-3 pb-4">
      {/* Contextual suggestion chips */}
      {suggestions.length > 0 && !isStreaming && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {suggestions.map((s, i) => (
            <button
              key={s.label}
              onClick={() => handleSuggestion(s.message)}
              className="chip-in flex items-center gap-1.5 text-[12px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Plus className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Plus prefix button (new conversation / attach) */}
        <button
          onClick={() => {}}
          className="flex-shrink-0 w-9 h-9 mb-0.5 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer"
          title="New topic"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Textarea */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Want can I assist you…"
            rows={1}
            className="
              w-full resize-none rounded-2xl border border-slate-200 bg-slate-50
              px-4 py-2.5 text-[13.5px] font-medium text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400
              transition-all leading-relaxed
            "
            style={{ minHeight: '44px', maxHeight: '160px' }}
          />
        </div>

        {/* Send / Stop button — blue circle */}
        <button
          onClick={isStreaming ? onStop : handleSend}
          disabled={!isStreaming && !isActive}
          className={`
            flex-shrink-0 mb-0.5 w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-150
            ${isStreaming
              ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer shadow-md shadow-red-200'
              : isActive
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer shadow-md shadow-blue-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
          title={isStreaming ? 'Stop' : 'Send'}
        >
          {isStreaming ? (
            <Square className="w-3.5 h-3.5" fill="currentColor" />
          ) : (
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-400 font-medium mt-1.5">
        <kbd className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-500">Enter</kbd>
        {' '}to send ·{' '}
        <kbd className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-500">Shift+Enter</kbd>
        {' '}for new line
      </p>
    </div>
  );
}
