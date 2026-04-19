import { Plane, Clock, Users } from 'lucide-react';
import type { FlightResult } from '../types/chat';

interface Props {
  flights: FlightResult[];
  onPrefill: (text: string) => void;
}

function formatTime(dt: string): string {
  return dt.split(' ')[1] ?? dt;
}

function formatDate(dt: string): string {
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function FlightResultCard({ flights, onPrefill }: Props) {
  if (!flights.length) return null;

  const { origin, destination, departureDate } = flights[0];

  return (
    <div className="mt-2 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden msg-in">
      {/* Card header */}
      <div className="px-4 py-2.5 bg-blue-600 flex items-center gap-2">
        <Plane className="w-3.5 h-3.5 text-white" />
        <span className="text-[12px] font-bold text-white tracking-wide">
          {origin} → {destination}
        </span>
        <span className="text-[11px] text-blue-200 font-medium">
          · {formatDate(departureDate)}
        </span>
        <span className="ml-auto text-[11px] font-semibold bg-blue-500/60 text-white px-2 py-0.5 rounded-full">
          {flights.length} flight{flights.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Flight rows */}
      <div className="divide-y divide-slate-50">
        {flights.map((f) => (
          <div key={f.flightNumber} className="px-4 py-3">
            {/* Top row: flight number + times */}
            <div className="flex items-center gap-3">
              {/* Flight badge */}
              <span className="flex-shrink-0 text-[12px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg w-[68px] text-center">
                {f.flightNumber}
              </span>

              {/* Route timeline */}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="text-center">
                  <p className="text-[15px] font-bold text-slate-800 leading-none">{formatTime(f.departureDate)}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{f.origin}</p>
                </div>

                <div className="flex-1 flex items-center gap-1 px-1">
                  <div className="flex-1 h-[1px] bg-slate-200" />
                  <Plane className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 h-[1px] bg-slate-200" />
                </div>

                <div className="text-center">
                  <p className="text-[15px] font-bold text-slate-800 leading-none">{formatTime(f.arrivalDate)}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{f.destination}</p>
                </div>
              </div>

              {/* Book button */}
              <button
                onClick={() =>
                  onPrefill(
                    `I would like to book flight ${f.flightNumber} on ${f.departureDate.split(' ')[0]} for `
                  )
                }
                className="
                  flex-shrink-0 text-[11px] font-bold text-white bg-blue-600
                  hover:bg-blue-700 active:bg-blue-800
                  px-3 py-1.5 rounded-xl transition-colors cursor-pointer
                "
              >
                Book
              </button>
            </div>

            {/* Bottom row: duration + seats */}
            <div className="flex items-center gap-4 mt-2 pl-[80px]">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(f.durationMinutes)}</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-semibold
                ${f.availableSeats > 20 ? 'text-emerald-600' : f.availableSeats > 5 ? 'text-amber-600' : 'text-red-500'}
              `}>
                <Users className="w-3 h-3" />
                <span>{f.availableSeats} seats left</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
