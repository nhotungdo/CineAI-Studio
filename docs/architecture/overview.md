# Architecture Overview - CineAI Studio

## System Design Principle

CineAI Studio follows **Clean Architecture** (Onion Architecture) principles combined with a **Microservices-ready Modular Monolith** structure for backend services:

1. **Separation of Concerns**: Core domain rules (`Domain`) are completely independent of UI, database, or external APIs (Gemini/Veo).
2. **Asynchronous Generation Pipeline**: Video creation via Veo 3.1 is inherently long-running. The Web API returns an HTTP 202 Accepted status immediately with a `JobId` / `OperationId`, delegating polling and processing to `CineAI.Worker` via Hangfire.
3. **Event-driven Realtime Feedback**: Status updates flow from `CineAI.Worker` to `CineAI.API`'s SignalR Hub (`VideoGenerationHub`), pushing progress events directly to the Next.js client.

```
[ Next.js Web UI ] <--- (WebSocket/SignalR) ---> [ SignalR Hub ]
        |                                             ^
    (REST API)                                        |
        v                                             |
[ CineAI.API ] ---> [ Hangfire Queue ] ---> [ CineAI.Worker ]
        |                                             |
        v                                             v
[ CineAI.AI / Video ] <------------------- [ Veo 3.1 / Supabase ]
```
