import './index.css';
import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { Plane } from 'lucide-react';

function App() {
  const { messages, sendMessage, isStreaming, stopStreaming } = useChat();

  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 leading-tight">Airline AI Assistant</h1>
            <p className="text-[11px] text-slate-400">Powered by Ollama · MCP</p>
          </div>
          {isStreaming && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-blue-600">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Thinking…
            </div>
          )}
        </div>
      </header>

      {/* Chat area */}
      <ChatWindow messages={messages} onSuggestion={sendMessage} />

      {/* Input */}
      <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
    </div>
  );
}

export default App;
