import { Loader2, Search, Ticket, CheckCircle2, CheckCheck } from 'lucide-react';
import type { ToolCallInfo } from '../types/chat';

const TOOL_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  query_flight: { icon: Search,        label: 'Searching flights'  },
  book_flight:  { icon: Ticket,        label: 'Booking flight'     },
  check_in:     { icon: CheckCircle2,  label: 'Checking in'        },
};

interface Props {
  toolCalls: ToolCallInfo[];
}

export function ToolCallIndicator({ toolCalls }: Props) {
  if (!toolCalls.length) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-1.5">
      {toolCalls.map((tc, i) => {
        const meta = TOOL_META[tc.tool];
        const Icon = meta?.icon ?? Loader2;
        const isDone = tc.status === 'completed';

        return (
          <div
            key={i}
            className={`
              chip-in inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold w-fit
              transition-all duration-200
              ${isDone
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
              }
            `}
          >
            {isDone ? (
              <CheckCheck className="w-3 h-3 flex-shrink-0 text-emerald-600" />
            ) : (
              <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
            )}
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span>{tc.label}</span>
          </div>
        );
      })}
    </div>
  );
}
