"""Pydantic models mirroring the .NET API DTOs for request/response validation."""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    role: str


class FlightSearchParams(BaseModel):
    airport_from: str | None = None
    airport_to: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    number_of_people: int = 1
    is_round_trip: bool = False
    page_number: int = 1


class BuyTicketRequest(BaseModel):
    flight_number: str
    flight_date: str  # ISO 8601 datetime string
    passenger_names: list[str]


class TicketResponse(BaseModel):
    status: str | None = None
    pnr_code: str | None = None


class CheckInRequest(BaseModel):
    pnr_code: str
    passenger_name: str


class CheckInResponse(BaseModel):
    status: str | None = None
    message: str | None = None
    seat_number: int | None = None
    full_name: str | None = None
