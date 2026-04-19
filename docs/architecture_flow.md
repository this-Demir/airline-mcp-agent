# Architecture & Logic Flow

The system employs a Gateway pattern and Model Context Protocol to cleanly separate the LLM reasoning from the backend business logic.

## System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client [Frontend App]
        UI[React + Vite Chat UI]
    end

    subgraph Orchestrator [Python FastAPI Backend]
        Agent[Agent Orchestrator / Memory]
        Auth[Auth Manager]
        MCPServer[MCP Server]
    end

    subgraph LLM [Local LLM Engine]
        Ollama[Ollama: Gemma2 / Qwen]
    end

    subgraph Backend [Existing .NET 8 Infrastructure]
        Gateway[Ocelot API Gateway :5000]
        CoreAPI[.NET Core API]
        DB[(MySQL)]
    end

    UI -- "1. Chat Message (WebSockets/SSE)" --> Agent
    Agent -- "2. Prompt + Tools Context" --> Ollama
    Ollama -- "3. Tool Call Decision" --> Agent
    Agent -- "4. Execute Tool" --> MCPServer
    
    Auth -- "Appends JWT" --> MCPServer
    MCPServer -- "5. REST HTTP Request" --> Gateway
    Gateway --> CoreAPI
    CoreAPI --> DB
    
    CoreAPI -- "6. JSON Response" --> Gateway
    Gateway --> MCPServer
    MCPServer --> Agent
    Agent -- "7. Feed result back to LLM" --> Ollama
    Ollama -- "8. Stream natural text" --> UI