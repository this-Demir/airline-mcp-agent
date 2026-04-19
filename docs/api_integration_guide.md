# API Integration & OpenAPI Guide

## The Source of Truth
The exact schemas, HTTP methods, and routing paths for the .NET 8 backend are defined in the provided `airline-api-openapi.json` file. 

## MCP Tool Generation Rules
When building the MCP Server tools (`query_flight`, `book_flight`, `check_in`), you MUST:
1. Read the `airline-api-openapi.json` to understand the exact JSON payload expected by the .NET API.
2. Ensure the Python MCP Server validates the LLM's arguments against these OpenAPI schemas before making the HTTP request to the Gateway (`http://localhost:5000`).
3. **Error Handling:** Map the HTTP status codes defined in the OpenAPI spec (e.g., 400 Bad Request, 404 Not Found, 409 Conflict) to user-friendly chat responses. Do not crash the MCP server if the .NET API returns a business error like "SoldOut" or "Passenger has already checked in."

## Authentication Flow Details
* Refer to the `/api/v1/auth/login` path in the OpenAPI spec to format the login payload correctly on startup.
* For the `book_flight` tool, look at the security requirements in the OpenAPI spec to ensure the JWT Bearer token is attached correctly in the Python `httpx` or `requests` call.