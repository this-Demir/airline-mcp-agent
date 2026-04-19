# Tech Stack & Dependencies

This document outlines the strict technology stack and required libraries for the Airline AI Agent project. Do not deviate from these core technologies without explicit permission.

## 1. Frontend (Client)
* **Framework:** React 18+
* **Build Tool:** Vite
* **Language:** TypeScript
* **Styling:** Tailwind CSS (for rapid, minimal UI development)
* **Key Libraries:**
  * `lucide-react` (for UI icons)
  * `react-markdown` (optional, for rendering structured LLM responses)
* **Communication:** Native `fetch` or `EventSource` for Server-Sent Events (SSE) streaming from the FastAPI backend.

## 2. Agent Backend & MCP Server
* **Language:** Python 3.10+
* **Framework:** FastAPI
* **Server:** Uvicorn
* **Key Libraries:**
  * `mcp` (Official Anthropic Model Context Protocol Python SDK)
  * `httpx` (for making asynchronous REST HTTP calls to the .NET Gateway)
  * `sse-starlette` (for streaming Server-Sent Events back to the React frontend)
  * `ollama` (Official Python client for Ollama, or standard LangChain Ollama wrappers if preferred for orchestration)
  * `python-dotenv` (for managing the hardcoded authentication credentials securely)

## 3. Local LLM Engine
* **Host:** Ollama (running locally on i9 hardware)
* **Primary Model:** `gemma2` (or explicitly switch to `qwen2.5-coder:7b` / `llama3.1:8b` if tool calling requires more rigid JSON formatting).

## 4. Existing Infrastructure (Target)
* **API:** .NET 8 Web API (Clean Architecture)
* **Gateway:** Ocelot API Gateway (running on `http://localhost:5000`)
* **Database:** MySQL 8.0
* **Note:** The existing infrastructure is already containerized and running. The Agent Backend only needs to communicate with the Gateway on port 5000.