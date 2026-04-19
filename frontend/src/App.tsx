import './index.css';
import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { Plane } from 'lucide-react';

const TOOL_LABELS: Record<string, string> = {
  query_flight: 'Query Flight',
  book_flight: 'Book Flight',
  check_in: 'Check In',
};

const POST_TOOL_SUGGESTIONS: Record<string, { label: string; message: string }[]> = {
  query_flight: [
    { label: 'Book Flight', message: 'I would like to book a flight from IST to FRA on 18 June for one person' },
    { label: 'Query Flight', message: 'Find a flight from IST to FRA on 18 June for one person' },
  ],
  book_flight: [
    { label: 'Check In', message: 'I want to check in for my flight with PNR ' },
    { label: 'Query Flight', message: 'Find a flight from IST to FRA on 18 June for one person' },
  ],
  check_in: [
    { label: 'Query Flight', message: 'Find a flight from IST to FRA on 18 June for one person' },
  ],
};

function App() {
  const { messages, sendMessage, isStreaming, stopStreaming } = useChat();
  const [prefill, setPrefill] = useState('');

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  const lastTool = lastAssistant?.toolCalls?.at(-1)?.tool ?? null;

  const activeLabel = lastTool ? TOOL_LABELS[lastTool] : null;
  const suggestions = lastTool ? (POST_TOOL_SUGGESTIONS[lastTool] ?? []) : [];

  return (
    <div className="app-card">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
            <Plane className="w-[17px] h-[17px] text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[14px] font-bold text-slate-800 tracking-tight leading-none">
                AI Agent – Flight Actions
              </h1>
              {activeLabel && (
                <span className="flex-shrink-0 text-[11px] font-semibold bg-blue-600 text-white px-2.5 py-0.5 rounded-full leading-none chip-in">
                  {activeLabel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-none">
              Powered by Ollama · MCP
            </p>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-1.5 text-[12px] text-blue-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 think-pulse" />
              Thinking
            </div>
          )}
        </div>
      </header>

      <ChatWindow messages={messages} onPrefill={setPrefill} />

      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        suggestions={suggestions}
        prefillValue={prefill}
        onPrefillClear={() => setPrefill('')}
      />
    </div>
  );
}

export default App;
