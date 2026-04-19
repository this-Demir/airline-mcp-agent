import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)


class AuthManager:
    def __init__(self):
        self._token: str | None = None

    async def login(self, client: httpx.AsyncClient) -> bool:
        """Fetch JWT from the .NET Gateway on startup. Returns True on success."""
        try:
            response = await client.post(
                f"{settings.GATEWAY_URL}/api/v1/auth/login",
                json={
                    "email": settings.AIRLINE_USER_EMAIL,
                    "password": settings.AIRLINE_USER_PASSWORD,
                },
            )
            if response.status_code == 200:
                self._token = response.json()["token"]
                logger.info("Auth Manager: login successful.")
                return True
            else:
                logger.critical(
                    "Auth Manager: login failed (HTTP %s): %s",
                    response.status_code,
                    response.text,
                )
                return False
        except Exception as exc:
            logger.critical("Auth Manager: login error — %s", exc)
            return False

    def get_auth_header(self) -> dict[str, str]:
        if not self._token:
            raise RuntimeError("Not authenticated — JWT token unavailable.")
        return {"Authorization": f"Bearer {self._token}"}

    async def refresh_if_needed(self, client: httpx.AsyncClient) -> None:
        """Called reactively when a protected call receives 401."""
        logger.info("Auth Manager: refreshing token.")
        await self.login(client)

    @property
    def is_authenticated(self) -> bool:
        return self._token is not None
