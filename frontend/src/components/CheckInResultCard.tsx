import { CheckCircle2, XCircle, User, Hash } from 'lucide-react';
import type { CheckInResult } from '../types/chat';

interface Props {
  result: CheckInResult;
  onPrefill: (text: string) => void;
}

export function CheckInResultCard({ result, onPrefill }: Props) {
  const isSuccess = result.status === 'Success';

  return (
    <div
      className="mt-2 rounded-2xl border overflow-hidden shadow-sm msg-in"
      style={{ borderColor: isSuccess ? '#D1FAE5' : '#FEE2E2' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: isSuccess ? '#059669' : '#DC2626' }}
      >
        {isSuccess
          ? <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
          : <XCircle className="w-4 h-4 text-white flex-shrink-0" />
        }
        <span className="text-[13px] font-bold text-white">
          {isSuccess ? 'Check-In Successful!' : 'Check-In Failed'}
        </span>
      </div>

      <div className="bg-white px-4 py-3 flex flex-col gap-3">
        {isSuccess && result.seatNumber ? (
          <>
            {/* Boarding pass style seat block */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Seat Number</p>
                <p className="text-[32px] font-black text-blue-700 tracking-wider leading-none">
                  {result.seatNumber}
                </p>
              </div>
              {/* Boarding pass tear-off decoration */}
              <div className="flex flex-col gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-200" />
                ))}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Status</p>
                <p className="text-[13px] font-bold text-emerald-600">Boarded</p>
              </div>
            </div>

            {/* Passenger + PNR */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Passenger</p>
                  <p className="text-[13px] font-semibold text-slate-700">{result.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">PNR Code</p>
                  <p className="text-[13px] font-bold text-slate-700 font-mono tracking-widest">{result.pnrCode}</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-1">
              Have a great flight! ✈
            </p>
          </>
        ) : (
          <>
            {/* Failed state */}
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-[12px] font-semibold text-red-700">
                {result.message || 'No ticket found for this PNR code and passenger name.'}
              </p>
              {result.fullName && (
                <p className="text-[11px] text-red-500 mt-1">
                  Passenger: {result.fullName} · PNR: {result.pnrCode}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Make sure the passenger name matches exactly what was used at booking time.
            </p>
            <button
              onClick={() => onPrefill(`I want to check in for my flight with PNR ${result.pnrCode} for `)}
              className="text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
