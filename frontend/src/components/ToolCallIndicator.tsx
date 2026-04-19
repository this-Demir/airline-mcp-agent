import { Loader2, Search, Ticket, CheckCircle2, Check } from 'lucide-react';
import type { ToolCallInfo } from '../types/chat';

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  query_flight: Search,
  book_flight: Ticket,
  check_in: CheckCircle2,
};

interface Props {
  toolCalls: ToolCallInfo[];
}

export function ToolCallIndicator({ toolCalls }: Props) {
  if (!toolCalls.length) return null;

  return (
    <div className="flex flex-col gap-1 mb-2">
      {toolCalls.map((tc, i) => {
        const Icon = TOOL_ICONS[tc.tool] ?? Loader2;
        const isDone = tc.status === 'completed';
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-full w-fit transition-all
              ${isDone
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
          >
            {isDone ? (
              <Check className="w-3 h-3 flex-shrink-0" />
            ) : (
              <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
            )}
            {isDone ? (
              <Icon className="w-3 h-3 flex-shrink-0" />
            ) : (
              <Icon className="w-3 h-3 flex-shrink-0" />
            )}
            <span className="font-medium">{tc.label}...</span>
          </div>
        );
      })}
    </div>
  );
}
