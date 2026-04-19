# Business Specifications & Tool Mapping

The AI Agent must be equipped with tools that map exactly to the underlying .NET 8 Midterm API.

## Tool 1: Query Flight
* **User Intent:** Finding available flights based on route and date.
* **MCP Tool Name:** `query_flight`
* **Target Endpoint:** `GET http://localhost:5000/api/v1/flights/search`
* **Agent Responsibilities:**
  * Extract Origin and Destination and map them to IATA codes (e.g., "Istanbul" -> "IST", "Frankfurt" -> "FRA").
  * Extract dates and format them strictly as `yyyy-MM-dd`.
  * Pass `NumberOfPeople` (default to 1 if not specified).
* **Auth Required:** No.

## Tool 2: Book Flight (Purchase Ticket)
* **User Intent:** Buying a ticket for a specific flight.
* **MCP Tool Name:** `book_flight`
* **Target Endpoint:** `POST http://localhost:5000/api/v1/tickets/purchase`
* **Agent Responsibilities:**
  * Extract `FlightNumber`, `FlightDate`, and a list of `PassengerNames`.
  * Inject the pre-authenticated Bearer JWT into the headers.
  * Handle the "SoldOut" vs "Confirmed" status gracefully in the chat response.
* **Auth Required:** YES (Bearer JWT).

## Tool 3: Passenger Check-In
* **User Intent:** Checking in and receiving a seat number.
* **MCP Tool Name:** `check_in`
* **Target Endpoint:** `POST http://localhost:5000/api/v1/checkin`
* **Agent Responsibilities:**
  * Extract `PnrCode` (6-character ticket number) and `PassengerName`.
  * Present the assigned `SeatNumber` clearly to the user upon a "Success" status.
* **Auth Required:** No.