import { CheckCircle2, XCircle, Plane, Calendar, Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { BookingResult } from '../types/chat';

interface Props {
  booking: BookingResult;
  onPrefill: (text: string) => void;
}

function formatDate(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function BookingResultCard({ booking, onPrefill }: Props) {
  const [copied, setCopied] = useState(false);
  const isConfirmed = booking.status === 'Confirmed';

  const copyPnr = () => {
    if (!booking.pnrCode) return;
    navigator.clipboard.writeText(booking.pnrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 rounded-2xl border overflow-hidden shadow-sm msg-in"
      style={{ borderColor: isConfirmed ? '#D1FAE5' : '#FED7AA' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: isConfirmed ? '#059669' : '#D97706' }}
      >
        {isConfirmed
          ? <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
          : <XCircle className="w-4 h-4 text-white flex-shrink-0" />
        }
        <span className="text-[13px] font-bold text-white">
          {isConfirmed ? 'Booking Confirmed!' : 'Flight Sold Out'}
        </span>
      </div>

      <div className="bg-white px-4 py-3 flex flex-col gap-3">
        {/* Flight info row */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Plane className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-800">{booking.flightNumber}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(booking.flightDate)}</span>
            </div>
          </div>
        </div>

        {/* PNR code — only shown on Confirmed */}
        {isConfirmed && booking.pnrCode && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
              Booking Reference (PNR)
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[22px] font-black text-emerald-700 tracking-[0.2em] font-mono">
                {booking.pnrCode}
              </span>
              <button
                onClick={copyPnr}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-white border border-emerald-200 rounded-lg px-2 py-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-emerald-500 mt-1">Keep this code — you'll need it to check in.</p>
          </div>
        )}

        {/* Passengers */}
        {booking.passengerNames && booking.passengerNames.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Passengers</p>
              {booking.passengerNames.map(name => (
                <p key={name} className="text-[13px] font-semibold text-slate-700">{name}</p>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {isConfirmed && booking.pnrCode ? (
            <button
              onClick={() =>
                onPrefill(`I want to check in for my flight with PNR ${booking.pnrCode} for ${booking.passengerNames?.[0] ?? ''}`)
              }
              className="flex-1 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Check In Now
            </button>
          ) : (
            <button
              onClick={() => onPrefill('Find a flight from IST to FRA on 18 June for one person')}
              className="flex-1 text-[12px] font-bold text-white bg-amber-600 hover:bg-amber-700 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Search Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
