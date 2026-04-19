import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    AIRLINE_USER_EMAIL: str = os.getenv("AIRLINE_USER_EMAIL", "")
    AIRLINE_USER_PASSWORD: str = os.getenv("AIRLINE_USER_PASSWORD", "")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")
    GATEWAY_URL: str = os.getenv("GATEWAY_URL", "http://35.170.75.61:5000")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


settings = Settings()
