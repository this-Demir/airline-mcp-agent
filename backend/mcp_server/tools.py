"""MCP tool implementations: query_flight, book_flight, check_in.

Each function receives an AirlineAPIClient, validates/normalises its
arguments, calls the .NET Gateway, and returns a plain string that the
LLM can use directly in its response.
"""
import logging
from datetime import datetime

from mcp_server.api_client import AirlineAPIClient
from mcp_server.iata_codes import resolve_iata

logger = logging.getLogger(__name__)


def normalize_flight_date(date_str: str) -> str:
    """Ensure the date is in ISO 8601 date-time format (yyyy-MM-ddTHH:mm:ss).

    The LLM typically produces 'yyyy-MM-dd'; the .NET BuyTicketRequestDto
    requires 'format: date-time', so we append T00:00:00 when needed.
    """
    date_str = date_str.strip()
    if "T" not in date_str:
        return f"{date_str}T00:00:00"
    return date_str


def _format_flight_list(flights: list[dict]) -> str:
    if not flights:
        return "No flights found."
    lines = []
    for i, f in enumerate(flights, 1):
        dep = f.get("departureDate", "")[:16].replace("T", " ")
        arr = f.get("arrivalDate", "")[:16].replace("T", " ")
        lines.append(
            f"{i}. Flight {f.get('flightNumber')} | "
            f"Departs: {dep} | Arrives: {arr} | "
            f"Duration: {f.get('durationMinutes')} min | "
            f"Available seats: {f.get('availableCapacity')}"
        )
    return "\n".join(lines)


# ── Tool 1: Query Flight ───────────────────────────────────────────────────────

async def query_flight_impl(
    api_client: AirlineAPIClient,
    origin: str,
    destination: str,
    departure_date: str,
    number_of_people: int = 1,
    is_round_trip: bool = False,
) -> tuple[str, list[dict]]:
    """Core implementation. Returns (llm_text, structured_flight_list).

    The structured list is forwarded to the frontend via a tool_result SSE event
    so the UI can render a flight card independently of the LLM response text.
    """
    logger.info(
        "[TOOL] query_flight called | origin=%r destination=%r departure_date=%r "
        "number_of_people=%s is_round_trip=%s",
        origin, destination, departure_date, number_of_people, is_round_trip,
    )

    try:
        origin_code = resolve_iata(origin)
        destination_code = resolve_iata(destination)
    except ValueError as exc:
        logger.warning("[TOOL] query_flight → IATA resolution failed: %s", exc)
        return str(exc), []

    logger.info(
        "[TOOL] query_flight → IATA resolved: %r→%s, %r→%s",
        origin, origin_code, destination, destination_code,
    )

    try:
        parsed_date = datetime.strptime(departure_date, "%Y-%m-%d")
    except ValueError:
        logger.warning("[TOOL] query_flight → invalid date format: %r", departure_date)
        return f"Invalid date format '{departure_date}'. Please use yyyy-MM-dd (e.g., 2026-06-15).", []

    from datetime import timedelta
    date_to = (parsed_date + timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "AirportFrom": origin_code,
        "AirportTo": destination_code,
        "DateFrom": departure_date,
        "DateTo": date_to,
        "NumberOfPeople": number_of_people,
        "IsRoundTrip": is_round_trip,
    }

    logger.info("[TOOL] query_flight → calling API with params: %s", params)
    result = await api_client.search_flights(params)

    if result.get("error"):
        msg = result['message']
        logger.warning("[TOOL] query_flight → API returned error: %s", msg)
        return f"Flight search failed: {msg}", []

    outbound = result.get("outbound", {})
    flights = outbound.get("items", [])
    total = outbound.get("totalCount", 0)

    logger.info(
        "[TOOL] query_flight → result: totalCount=%s, items=%d, raw_outbound_keys=%s",
        total, len(flights), list(outbound.keys()),
    )

    if not flights:
        no_result_msg = (
            f"No flights found from {origin_code} to {destination_code} "
            f"on {departure_date} for {number_of_people} passenger(s)."
        )
        logger.info("[TOOL] query_flight → %s", no_result_msg)
        return no_result_msg, []

    flight_list = _format_flight_list(flights)
    header = (
        f"Found {total} flight(s) from {origin_code} to {destination_code} "
        f"on {departure_date} (showing {len(flights)}):\n"
    )
    final = header + flight_list
    logger.info("[TOOL] query_flight → returning to LLM:\n%s", final)

    structured = [
        {
            "flightNumber": f.get("flightNumber"),
            "origin": origin_code,
            "destination": destination_code,
            "departureDate": f.get("departureDate", "")[:16].replace("T", " "),
            "arrivalDate": f.get("arrivalDate", "")[:16].replace("T", " "),
            "durationMinutes": f.get("durationMinutes"),
            "availableSeats": f.get("availableCapacity"),
        }
        for f in flights
    ]

    return final, structured


async def query_flight(
    api_client: AirlineAPIClient,
    origin: str,
    destination: str,
    departure_date: str,
    number_of_people: int = 1,
    is_round_trip: bool = False,
) -> str:
    """Search for available flights between two airports on a given date."""
    text, _ = await query_flight_impl(
        api_client, origin, destination, departure_date, number_of_people, is_round_trip
    )
    return text


# ── Tool 2: Book Flight ────────────────────────────────────────────────────────

async def book_flight_impl(
    api_client: AirlineAPIClient,
    flight_number: str,
    flight_date: str,
    passenger_names: list[str] | str,
) -> tuple[str, dict | None]:
    """Core implementation. Returns (llm_text, structured_result | None)."""
    if isinstance(passenger_names, str):
        import json as _json
        try:
            passenger_names = _json.loads(passenger_names)
        except ValueError:
            passenger_names = [passenger_names]

    if not passenger_names:
        return "At least one passenger name is required to book a flight.", None

    flight_date_normalized = normalize_flight_date(flight_date)
    fn_upper = flight_number.strip().upper()

    payload = {
        "flightNumber": fn_upper,
        "flightDate": flight_date_normalized,
        "passengerNames": [name.strip() for name in passenger_names],
    }

    result = await api_client.purchase_ticket(payload)

    if result.get("error"):
        return f"Booking failed: {result['message']}", None

    status = result.get("status", "")
    pnr = result.get("pnrCode", "")
    names_str = ", ".join(passenger_names)
    date_only = flight_date[:10]

    if status == "Confirmed":
        text = (
            f"Booking confirmed! PNR Code: {pnr}. "
            f"Flight {fn_upper} on {date_only} "
            f"for passenger(s): {names_str}. "
            f"Please keep your PNR code for check-in."
        )
        data = {
            "status": "Confirmed",
            "pnrCode": pnr,
            "flightNumber": fn_upper,
            "flightDate": date_only,
            "passengerNames": list(passenger_names),
        }
        return text, data

    elif status == "SoldOut":
        text = (
            f"Sorry, flight {fn_upper} on {date_only} is sold out. "
            "Would you like me to search for alternative flights?"
        )
        data = {
            "status": "SoldOut",
            "flightNumber": fn_upper,
            "flightDate": date_only,
        }
        return text, data

    return f"Booking returned unexpected status: {status}. PNR: {pnr}", None


async def book_flight(
    api_client: AirlineAPIClient,
    flight_number: str,
    flight_date: str,
    passenger_names: list[str] | str,
) -> str:
    """Purchase tickets for a specific flight."""
    text, _ = await book_flight_impl(api_client, flight_number, flight_date, passenger_names)
    return text


# ── Tool 3: Check-In ──────────────────────────────────────────────────────────

async def check_in_impl(
    api_client: AirlineAPIClient,
    pnr_code: str,
    passenger_name: str,
) -> tuple[str, dict | None]:
    """Core implementation. Returns (llm_text, structured_result | None)."""
    pnr_code = pnr_code.strip().upper()

    if len(pnr_code) != 6 or not pnr_code.isalnum():
        return (
            f"Invalid PNR code '{pnr_code}'. A PNR code must be exactly 6 alphanumeric characters.",
            None,
        )

    payload = {
        "pnrCode": pnr_code,
        "passengerName": passenger_name.strip(),
    }

    result = await api_client.check_in(payload)

    status = result.get("status", "")
    message = result.get("message", "")
    seat_number = result.get("seatNumber")
    full_name = result.get("fullName", passenger_name)

    if status == "Success":
        text = (
            f"Check-in successful! Passenger: {full_name}, "
            f"Seat Number: {seat_number}. Have a great flight!"
        )
        data = {
            "status": "Success",
            "pnrCode": pnr_code,
            "fullName": full_name,
            "seatNumber": str(seat_number) if seat_number else None,
        }
    else:
        text = f"Check-in failed: {message or 'No ticket found for this PNR code and passenger name.'}"
        data = {
            "status": "Failed",
            "pnrCode": pnr_code,
            "fullName": full_name or passenger_name,
            "message": message or "No ticket found for this PNR code and passenger name.",
        }

    return text, data


async def check_in(
    api_client: AirlineAPIClient,
    pnr_code: str,
    passenger_name: str,
) -> str:
    """Check in a passenger using their PNR booking code."""
    text, _ = await check_in_impl(api_client, pnr_code, passenger_name)
    return text


# ── Tool Registry ─────────────────────────────────────────────────────────────

def build_tool_registry(api_client: AirlineAPIClient) -> dict:
    """Return a dict mapping tool name → async callable bound to api_client."""
    async def _query_flight(**kwargs):
        return await query_flight(api_client, **kwargs)

    async def _book_flight(**kwargs):
        return await book_flight(api_client, **kwargs)

    async def _check_in(**kwargs):
        return await check_in(api_client, **kwargs)

    return {
        "query_flight": _query_flight,
        "book_flight": _book_flight,
        "check_in": _check_in,
    }


# ── Ollama Tool Definitions ───────────────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "query_flight",
            "description": (
                "Search for available flights between two airports on a given date. "
                "Use this when the user wants to find or check flights."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {
                        "type": "string",
                        "description": "Origin airport IATA code (3 letters, e.g., IST, FRA, JFK). Convert city names to IATA codes first.",
                    },
                    "destination": {
                        "type": "string",
                        "description": "Destination airport IATA code (3 letters, e.g., IST, FRA, JFK). Convert city names to IATA codes first.",
                    },
                    "departure_date": {
                        "type": "string",
                        "description": "Departure date in yyyy-MM-dd format (e.g., 2026-06-15).",
                    },
                    "number_of_people": {
                        "type": "integer",
                        "description": "Number of passengers to search for (default: 1).",
                    },
                    "is_round_trip": {
                        "type": "boolean",
                        "description": "Whether to search for round-trip flights (default: false).",
                    },
                },
                "required": ["origin", "destination", "departure_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "book_flight",
            "description": (
                "Purchase tickets for a specific flight. "
                "Use this when the user wants to book or buy a ticket. "
                "Requires a flight number, date, and passenger name(s)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "flight_number": {
                        "type": "string",
                        "description": "The airline flight code (e.g., TK1923, LH400).",
                    },
                    "flight_date": {
                        "type": "string",
                        "description": "The departure date in yyyy-MM-dd format (e.g., 2026-06-15).",
                    },
                    "passenger_names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of full passenger names (e.g., [\"John Doe\", \"Jane Doe\"]).",
                    },
                },
                "required": ["flight_number", "flight_date", "passenger_names"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_in",
            "description": (
                "Check in a passenger for their flight using their PNR booking code. "
                "Use this when the user wants to check in. "
                "Returns the assigned seat number on success."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "pnr_code": {
                        "type": "string",
                        "description": "The 6-character alphanumeric PNR booking code (e.g., ABC123).",
                    },
                    "passenger_name": {
                        "type": "string",
                        "description": "The passenger's full name exactly as used at booking time.",
                    },
                },
                "required": ["pnr_code", "passenger_name"],
            },
        },
    },
]
