# Hintro Backend API Documentation (verified)

Base path: `/api`

Authentication
- Primary: cookie named `token` (HTTP-only) set on login/signup. Passport extracts JWT from cookie first.
- The server also accepts `Authorization: Bearer <token>` but cookie is the primary method; clients (browser) should use `credentials: 'include'`.

Notes
- All REST endpoints are protected by the JWT passport strategy in the router files (see `src/routes/*`).
- Search for tasks supports header `x-search-query` or query param `q` (case-insensitive match against `title` and `description`).
- WebSocket expects cookie `token` in the `Cookie` header when connecting.

---

## Authentication / User

- POST `/api/auth/signup`
  - Body: `{ name: string, email: string, password: string }`
  - Response: `201` `{ user: { id, name, email } }` and sets `Set-Cookie: token=...` (httpOnly)

- POST `/api/auth/login`
  - Body: `{ email: string, password: string }`
  - Response: `200` `{ token, user: { id, name, email } }` and sets cookie `token`.

- POST `/api/auth/logout`
  - Clears cookie `token` and returns `200` `{ message: "Logged out successfully" }`.

- GET `/api/auth/me`
  - Auth required (cookie)
  - Response: `200` `{ id, name, email }`

- GET `/api/members`
  - Auth required
  - Response: `200` `{ data: [ { id, name, email }, ... ] }`

---

## Boards

- GET `/api/boards`
  - Auth required
  - Response: `200` `{ data: [ { id, title, isPublic, ownerId }, ... ] }`

- POST `/api/boards`
  - Auth required
  - Body: `{ title: string, isPublic?: boolean }` (controller defaults isPublic:true)
  - Response: `201` board object

- GET `/api/boards/:id`
  - Auth required
  - Response: `200` `{ board: { id, title, isPublic, lists: [...] } }`

- PUT `/api/boards/:id`
  - Auth required (owner only)
  - Body: `{ title: string }`
  - Response: `200` updated board

---

## Lists

- GET `/api/boards/:boardId/lists`
  - Auth required
  - Response: `200` `{ data: [ { id, title, position, boardId }, ... ] }`

- POST `/api/boards/:boardId/lists`
  - Auth required (board owner)
  - Body: `{ title: string }`
  - Response: `201` created list

- PUT `/api/lists/:id`
  - Auth required (board owner)
  - Body: `{ title: string }`
  - Response: `200` updated list

- DELETE `/api/lists/:id`
  - Auth required (board owner)
  - Response: `204` (no content)

- PUT `/api/lists/:id/reorder`
  - Auth required (board owner)
  - Body: `{ position: number }` (0-based)
  - Response: `200` `{ message: "Reordered" }` or `200` `{ message: "No change" }`

---

## Tasks

- GET `/api/lists/:listId/tasks`
  - Auth required
  - Optional search: header `x-search-query` or query `q` — filters by `title` or `description` (insensitive)
  - Response: `200` `{ data: [ tasks ] }`

- GET `/api/boards/:boardId/tasks`
  - Auth required / visibility check
  - Optional search: header `x-search-query` or query `q` — board-wide search
  - Response: `200` `{ data: [ tasks ] }`

- POST `/api/lists/:listId/tasks`
  - Auth required (board owner)
  - Body: `{ title: string, description?: string }`
  - Response: `201` created task

- GET `/api/tasks/:id`
  - Auth required
  - Response: `200` `{ data: task }` (includes `list` → `board`, `assignments`, `creator`)

- PUT `/api/tasks/:id`
  - Auth required (board owner)
  - Body: `{ title: string, description?: string }`
  - Response: `200` updated task

- DELETE `/api/tasks/:id`
  - Auth required (board owner)
  - Response: `204`

- PUT `/api/tasks/:id/move`
  - Auth required
  - Body: `{ toListId: string, position: number }`
  - Response: `200` `{ message: "Moved" }`

- POST `/api/tasks/:id/assign`
  - Auth required (board owner)
  - Body: `{ userId: string }`
  - Response: `201` `{ message: "Assigned" }`

- DELETE `/api/tasks/:id/assign/:userId`
  - Auth required (board owner)
  - Response: `204`

---

## Activity

- GET `/api/boards/:boardId/activity`
  - Auth required
  - Query: `page` (default 0), `per` (default 50, max 100)
  - Response: `200` `{ data: [activityLogs] }` (enriched with list/task titles when available)

---

## WebSocket (Realtime)

- URL (dev): `ws://<host>:<port>` — server logs `ws://localhost:3001` by default.
- Auth: send `Cookie: token=<JWT>` header on connect (server extracts cookie). Passport config also accepts Authorization header as fallback.
- Client messages:
  - `{ type: "JOIN_BOARD", boardId: "<id>" }` → server replies `{ type: "JOINED_BOARD", boardId }`
  - `{ type: "LEAVE_BOARD", boardId }` → server replies `{ type: "LEFT_BOARD", boardId }`
  - `{ type: "PING" }` → server replies `{ type: "PONG" }`
- Server broadcasts events to board rooms via `broadcastToBoard` (examples): `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `TASK_MOVED`, `TASK_ASSIGNED`, `TASK_UNASSIGNED`, `BOARD_UPDATED`, `LIST_*` events.

---

## Errors
- Responses use JSON `{ error: "message" }` and appropriate status codes (400, 401, 403, 404, 500).

---

## Examples

- Browser login (sets cookie):
  ```js
  await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  // subsequent requests should include cookie automatically
  await fetch('/api/boards', { credentials: 'include' });
  ```

- curl login and reuse cookie:
  ```bash
  curl -c cookie.txt -H "Content-Type: application/json" -d '{"email":"x","password":"y"}' http://localhost:3001/api/auth/login
  curl -b cookie.txt http://localhost:3001/api/boards
  ```

If you want, I can also:
- Generate an OpenAPI spec (yaml) from these verified endpoints.
- Add `API.md` to the repo (already added) and/or serve Swagger UI.
