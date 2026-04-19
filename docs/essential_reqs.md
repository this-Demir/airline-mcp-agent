# Essential Requirements: Airline AI Agent

## 1. Project Overview
Build an AI Agent Chat Application that allows users to interact with an existing .NET 8 Airline Ticketing API using natural language. The system translates natural language into precise API calls (Query, Book, Check-in) via the Model Context Protocol (MCP).

## 2. Tech Stack & Environment
* **Frontend:** React + Vite (TypeScript preferred). TailwindCSS for minimal, clean chat UI.
* **Agent Backend & Orchestrator:** Python (FastAPI). Responsible for chat memory, LLM orchestration, and streaming responses to the frontend.
* **MCP Server:** Python (running alongside or within the FastAPI backend). Registers tools for the LLM.
* **LLM Engine:** Local execution via `Ollama`. Primary target model: `gemma2` (or `qwen2.5-coder:7b` / `llama3.1:8b` for superior tool-calling stability).
* **Target API:** Existing .NET 8 API Gateway running on `http://localhost:5000`.

## 3. Strict Constraints & Guidelines
* **Hardware:** Running locally on a MateBook 16s (i9). Keep orchestration lightweight; avoid heavy background polling.
* **Authentication:** Per assignment specifications, the chat UI should NOT have a login screen. The FastAPI backend must use a constant, hardcoded user email/password (stored in `.env`), automatically fetch a JWT from the .NET backend, and append it as a Bearer token to protected MCP tool calls.
* **Streaming:** The FastAPI backend MUST stream the LLM's response back to the React frontend using Server-Sent Events (SSE) or WebSockets for a real-time typing effect.
* **System Design Focus:** Maintain strict separation of concerns. The React frontend handles UI/UX. FastAPI handles LLM context and routing. The MCP server handles API schema mapping.