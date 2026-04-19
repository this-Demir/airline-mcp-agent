"""Thin httpx wrapper for all .NET Gateway API calls."""
import logging

import httpx

from auth_manager import AuthManager
from config import settings

logger = logging.getLogger(__name__)


class AirlineAPIClient:
    def __init__(
        self,
        http_client: httpx.AsyncClient,
        auth_manager: AuthManager,
        base_url: str,
    ):
        self.client = http_client
        self.auth = auth_manager
        self.base_url = base_url

    # ── Flight Search ─────────────────────────────────────────────────────────

    async def search_flights(self, params: dict) -> dict:
        """GET /api/v1/flights/search — no auth required."""
        url = f"{self.base_url}/api/v1/flights/search"
        logger.info("[API] search_flights → GET %s | params=%s", url, params)

        try:
            resp = await self.client.get(url, params=params)
        except Exception as exc:
            logger.error("[API] search_flights → network error: %s", exc)
            return {"error": True, "message": f"Network error: {exc}"}

        logger.info(
            "[API] search_flights ← HTTP %d | body=%.500s",
            resp.status_code,
            resp.text,
        )

        if resp.status_code == 400:
            try:
                detail = resp.json().get("detail", "Invalid request.")
            except Exception:
                detail = resp.text
            logger.warning("[API] search_flights → 400 Bad Request: %s", detail)
            return {"error": True, "message": f"Invalid search parameters: {detail}"}

        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.error("[API] search_flights → unexpected HTTP error: %s", exc)
            return {"error": True, "message": f"HTTP error {resp.status_code}: {resp.text}"}

        try:
            data = resp.json()
        except Exception as exc:
            logger.error("[API] search_flights → failed to parse JSON: %s | body=%.500s", exc, resp.text)
            return {"error": True, "message": "Server returned non-JSON response."}

        # Log summary of what was parsed
        outbound = data.get("outbound", {})
        total = outbound.get("totalCount", "?")
        items_count = len(outbound.get("items", []))
        logger.info(
            "[API] search_flights → parsed OK | totalCount=%s items_in_page=%d",
            total,
            items_count,
        )
        return data

    # ── Purchase Ticket ───────────────────────────────────────────────────────

    async def purchase_ticket(self, payload: dict) -> dict:
        """POST /api/v1/tickets/purchase — requires Bearer JWT."""
        try:
            headers = self.auth.get_auth_header()
        except RuntimeError:
            return {"error": True, "message": "Authentication unavailable. Cannot book flights at this time."}

        resp = await self.client.post(
            f"{self.base_url}/api/v1/tickets/purchase",
            json=payload,
            headers=headers,
        )

        if resp.status_code == 401:
            # Token may have expired — refresh once and retry
            logger.info("Received 401 on purchase; refreshing token.")
            await self.auth.refresh_if_needed(self.client)
            try:
                headers = self.auth.get_auth_header()
            except RuntimeError:
                return {"error": True, "message": "Re-authentication failed. Please try again later."}
            resp = await self.client.post(
                f"{self.base_url}/api/v1/tickets/purchase",
                json=payload,
                headers=headers,
            )

        if resp.status_code == 400:
            detail = resp.json().get("detail", "Invalid booking request.")
            return {"error": True, "message": detail}
        if resp.status_code == 404:
            return {"error": True, "message": "No flight found for the given flight number and date."}
        if resp.status_code == 401:
            return {"error": True, "message": "Authentication failed. Please try again later."}

        resp.raise_for_status()
        return resp.json()

    # ── Check-In ──────────────────────────────────────────────────────────────

    async def check_in(self, payload: dict) -> dict:
        """POST /api/v1/checkin — no auth required.

        The endpoint always returns HTTP 200; business failures are indicated
        by Status == "Failed" in the response body.
        """
        resp = await self.client.post(
            f"{self.base_url}/api/v1/checkin", json=payload
        )
        resp.raise_for_status()
        return resp.json()
