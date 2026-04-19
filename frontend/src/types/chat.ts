export type MessageRole = 'user' | 'assistant';

export interface ToolCallInfo {
  tool: string;
  label: string;
  status: 'running' | 'completed';
}

export interface FlightResult {
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;   // "2026-06-18 04:45"
  arrivalDate: string;     // "2026-06-18 07:55"
  durationMinutes: number;
  availableSeats: number;
}

export interface BookingResult {
  status: 'Confirmed' | 'SoldOut';
  pnrCode?: string;
  flightNumber: string;
  flightDate: string;
  passengerNames?: string[];
}

export interface CheckInResult {
  status: 'Success' | 'Failed';
  pnrCode: string;
  fullName: string;
  seatNumber?: string | null;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
  flightResults?: FlightResult[];
  bookingResult?: BookingResult;
  checkInResult?: CheckInResult;
}

export interface SSEEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  tool?: string;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}
