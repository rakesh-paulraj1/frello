# Frello — Real-Time Task Collaboration Platform

Frello is a kanban-style real-time task collaboration platform. Multiple users can work on shared boards simultaneously — creating lists, managing tasks with drag-and-drop, assigning teammates, and seeing every change reflected live across all connected clients via WebSockets.
## Overview

Built as a lightweight Trello/Notion hybrid using a React + TypeScript frontend (Vite), an Express.js REST API backend, PostgreSQL via Prisma ORM, and a native WebSocket layer for real-time sync.

---

## Tech Stack

### Frontend

|Technology|Purpose|
|---|---|
|**React 18**|UI framework (SPA)|
|**Vite**|Build tool & dev server|
|**TypeScript**|Type safety across the entire frontend|
|**Zustand (with Immer)**|Global state management|
|**@dnd-kit/core**|Accessible drag-and-drop|
|**Native WebSocket API**|Real-time connection to backend via `useBoardSocket`|
|**React Router DOM v6**|Client-side routing|
|**Axios**|HTTP client with auth interceptors|
|**Tailwind CSS**|Utility-first styling|

### Backend

|Technology|Purpose|
|---|---|
|**Node.js + Express**|REST API server|
|**TypeScript**|Type safety across the entire backend|
|**Prisma ORM**|Type-safe database queries & migrations|
|**PostgreSQL**|Primary relational database|
|**ws**|Native WebSocket server for real-time broadcasting|
|**JWT (jsonwebtoken)**|Stateless authentication tokens|
|**bcryptjs**|Password hashing|
|**Passport**|Auth middleware (Local + JWT strategies)|
|**cookie-parser**|HTTP-only cookie parsing|
|**CORS**|Cross-origin request handling|

---

## Project Structure

```
frello/
├── frontend/                        # React + Vite + TypeScript SPA
│   ├── public/
│   └── src/
│       ├── components/              # Reusable UI components (Button, Input, Modal...)
│       ├── hooks/
│       │   ├── useBoardSocket.ts    # Native WebSocket connection + event dispatching
│       │   └── useDebounce.ts       # Input debounce for search
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Dashboard.tsx
│       │   └── BoardPage.tsx        # Initializes WebSocket, renders board
│       ├── services/                # Pure Axios API calls — no state, no side effects
│       │   ├── auth.service.ts
│       │   ├── board.service.ts
│       │   ├── list.service.ts
│       │   └── task.service.ts
│       ├── store/                   # Zustand stores (one per domain)
│       │   ├── boardStore.ts        # Board list, active board, UI dialogs
│       │   ├── listStore.ts         # Lists + drag-and-drop state
│       │   └── taskStore.ts         # Tasks normalized by listId + task detail
│       ├── types/                   # TypeScript interfaces (mirrors backend schema)
│       │   ├── board.types.ts
│       │   ├── task.types.ts
│       │   └── user.types.ts
│       ├── utils/                   # Helper functions
│       ├── App.tsx                  # Routing + auth guards + global providers
│       └── main.tsx
│
├── backend/                         # Express REST API (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma            # Full DB schema
│   │   ├── migrations/              # Auto-generated Prisma migrations
│   │   └── seed.ts                  # Demo data seeder
│   ├── src/
│   │   ├── index.ts                 # Server bootstrap — Express, CORS, cookies, Passport, WS attach
│   │   ├── passport.ts              # LocalStrategy + JwtStrategy (cookie-first extraction)
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── wsServer.ts              # ws WebSocket server — auth, board rooms, broadcast
│   │   ├── routes/
│   │   │   ├── users.router.ts
│   │   │   ├── boards.router.ts
│   │   │   ├── lists.router.ts
│   │   │   ├── tasks.router.ts
│   │   │   └── activity.router.ts
│   │   ├── controllers/             # Request validation, auth checks, Prisma queries, logging, broadcast
│   │   │   ├── user.controller.ts
│   │   │   ├── board.controller.ts
│   │   │   ├── list.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   └── activity.controller.ts
│   │   └── services/
│   │       └── activity.service.ts  # Centralised activity log creation
│   ├── tsconfig.json
│   └── package.json
```

---

## Getting Started

### Prerequisites

```
Node.js    >= 18.x
npm        >= 9.x
PostgreSQL >= 14.x
Git
```

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/frello.git
cd frello
```

### 2. Backend Setup

```bash
cd backend

npm install

cp .env.example .env
```

Edit `.env` with your database credentials and JWT secret (see [Environment Variables](https://claude.ai/chat/5c714d15-872b-472b-9c7f-1a1810703e5d#environment-variables)).

```bash
# Generate Prisma client
npx prisma generate

npx prisma db seed
# Run database migrations
npx prisma migrate dev

# Start dev server (ts-node + nodemon, hot reload)
npm start
```

The API will be running at: **http://localhost:3001**

### 3. Frontend Setup

```bash
cd ../frontend

npm install

cp .env.example .env
```

Edit `.env` with your API and WebSocket URLs (see [Environment Variables](https://claude.ai/chat/5c714d15-872b-472b-9c7f-1a1810703e5d#environment-variables)).

```bash
npm run dev
```

The app will be running at: **http://localhost:5173**

you can sign in with these values
```
email: alice@example.com     password : password123
email: bob@example.com       password : password123
```

### 4. Verify Setup

Open `http://localhost:5173` and signup and login 

Check the API health endpoint at: `http://localhost:3001/health`

---

## Environment Variables

### Backend — `backend/.env`

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/frello"

JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

PORT=3001

FRONTEND_URL="http://localhost:5173"
```

### Frontend — `frontend/.env`

```env
VITE_API_URL="http://localhost:3001/api"

VITE_WS_URL="http://localhost:3001"
```

---

## Database Schema

### Entity Relationship Overview
<img width="3386" height="7494" alt="DATABASEDIAGRAM" src="https://github.com/user-attachments/assets/c6c508ea-8b43-47fb-b3a1-dd13985c037e" />



### Models

#### `User`

|Column|Type|Notes|
|---|---|---|
|`id`|String (cuid)|PK|
|`email`|String|Unique, indexed|
|`name`|String||
|`password`|String|bcrypt hashed|
|`avatar`|String?|URL|
|`createdAt`|DateTime||
|`updatedAt`|DateTime|Auto-updated|

#### `Board`

|Column|Type|Notes|
|---|---|---|
|`id`|String (cuid)|PK|
|`title`|String||
|`description`|String?||
|`color`|String|Hex color, default `#6366f1`|
|`isArchived`|Boolean|Soft delete|
|`ownerId`|String|FK → User|

#### `List`

|Column|Type|Notes|
|---|---|---|
|`id`|String (cuid)|PK|
|`title`|String||
|`position`|Float|Float midpoint ordering|
|`boardId`|String|FK → Board|

#### `Task`

|Column|Type|Notes|
|---|---|---|
|`id`|String (cuid)|PK|
|`title`|String||
|`description`|String?||
|`position`|Float|For ordering within list|
|`priority`|Enum|`LOW / MEDIUM / HIGH / URGENT`|
|`status`|Enum|`TODO / IN_PROGRESS / REVIEW / DONE`|
|`dueDate`|DateTime?||
|`labels`|String[]|Array of label strings|
|`isArchived`|Boolean|Soft delete|
|`listId`|String|FK → List|

#### `BoardMember`

|Column|Type|Notes|
|---|---|---|
|`id`|String (cuid)|PK|
|`role`|Enum|`OWNER / ADMIN / MEMBER / VIEWER`|
|`boardId`|String|FK → Board|
|`userId`|String|FK → User|
|Composite unique||`(boardId, userId)`|

#### `Activity`

|Column|Type|Notes|
|---|---|---|
|`id`|String (cuid)|PK|
|`action`|Enum|`CREATED / UPDATED / DELETED / MOVED / ASSIGNED` etc.|
|`entityType`|String|e.g. `"task"`, `"list"`|
|`entityId`|String|ID of the affected entity|
|`meta`|Json?|Diff or extra context|
|`userId`|String|FK → User|
|`boardId`|String?|FK → Board|
|`taskId`|String?|FK → Task|

### Key Indexes

```sql
-- Fast board member lookup
CREATE INDEX ON "BoardMember"("boardId");
CREATE INDEX ON "BoardMember"("userId");

-- Task ordering within lists
CREATE INDEX ON "Task"("listId");
CREATE INDEX ON "Task"("position");

-- Activity feed queries
CREATE INDEX ON "Activity"("boardId");
CREATE INDEX ON "Activity"("createdAt" DESC);

-- Full-text search on task titles
CREATE INDEX ON "Task" USING gin(to_tsvector('english', title));
```

---

## API Documentation
Follow this file https://docs.google.com/document/d/1ROJ2515DV-nQcK5uU_LmGEF_5erpgPxCQf_YwjvocBg/edit?usp=sharing
## Frontend Architecture

Frello's frontend is a TypeScript-first React SPA built with Vite. Concerns are cleanly separated into four layers — **UI components**, **Zustand state stores**, **Axios service functions**, and the **native WebSocket real-time layer** — each with a single well-defined responsibility.

### Architecture Overview

```
User Interaction
      │
      ▼
React Components
      │
      ▼
Zustand Stores  ◀──────────────── useBoardSocket (WebSocket events)
      │
      ▼
src/services/ (Axios)
      │
      ▼
REST API ──── Backend ──── Socket.IO Server ──▶ Other Clients
                  │
                  ▼
              PostgreSQL
```

### Directory Structure

```
src/
├── components/          # Reusable UI components (Button, Input, Modal, etc.)
├── hooks/
│   ├── useBoardSocket.ts    # Native WebSocket lifecycle + event routing to stores
│   └── useDebounce.ts       # Input debounce for search
├── pages/
│   ├── Home.tsx
│   ├── Dashboard.tsx        # Board list
│   └── BoardPage.tsx        # Kanban view — initializes WebSocket, owns DndContext
├── services/            # Pure Axios API calls — no state, no side effects
│   ├── auth.service.ts
│   ├── board.service.ts
│   ├── list.service.ts
│   └── task.service.ts
├── store/               # Zustand stores — one per domain
│   ├── boardStore.ts    # Board list, active board, create/delete dialogs
│   ├── listStore.ts     # Lists + drag-and-drop position state
│   └── taskStore.ts     # Tasks normalized by listId + task detail state
├── types/               # TypeScript interfaces (mirrors Prisma schema exactly)
│   ├── board.types.ts
│   ├── task.types.ts
│   └── user.types.ts
├── utils/
└── App.tsx              # Routing, ProtectedRoute auth guard, global providers
```

### Routing & Auth Guards

```
/                        → Redirect → /dashboard or /login
├── /login               → Public
├── /signup              → Public
└── /* (ProtectedRoute)  → Redirects to /login if unauthenticated
    ├── /dashboard       → Board list (Dashboard.tsx)
    └── /board/:id       → Kanban board (BoardPage.tsx)
```

`App.tsx` wraps the entire tree in `ProtectedRoute` and also mounts global Toast notifications and Confirm dialogs — any store action or component can trigger them without prop drilling.

### Component Hierarchy

```
App.tsx  (ProtectedRoute, global Toast, global ConfirmDialog)
└── BoardPage.tsx  [Smart — initializes useBoardSocket, owns DndContext]
    ├── BoardHeader.tsx       (board title, member avatars, actions)
    ├── DndContext            (@dnd-kit drag-and-drop provider)
    │   └── List.tsx[]        (Sortable — horizontal list reordering)
    │       └── TaskCard.tsx[] (Sortable — vertical task reordering)
    └── [Task detail modal — rendered globally via portal]
```

### State Management — Zustand with Immer

Three domain-focused stores manage all application state. Immer middleware means mutations are written as direct state assignments rather than spread-heavy reducers.

```typescript
// boardStore.ts — board list & active board metadata
{
  boards: Board[],
  activeBoard: Board | null,
  isCreateDialogOpen: boolean,
  // Actions
  setBoards(boards),
  setActiveBoard(board),
  addBoard(board),
  updateBoard(id, changes),
  deleteBoard(id),
}

// listStore.ts — columns & drag-and-drop state
{
  lists: List[],
  dragState: { draggingTaskId: string | null, overListId: string | null },
  // Actions
  setLists(lists),
  addList(list),
  updateList(id, changes),
  deleteList(id),
  reorderLists(orderedIds),
  applyWsEvent(event)       // ← called by useBoardSocket
}

// taskStore.ts — tasks normalized by listId
{
  tasksByList: Record<string, Task[]>,
  activeTaskId: string | null,
  // Actions
  setTasksForList(listId, tasks),
  addTask(listId, task),
  updateTask(taskId, changes),
  deleteTask(listId, taskId),
  moveTask(taskId, fromListId, toListId, position),
  applyWsEvent(event)       // ← called by useBoardSocket
}
```

### Optimistic Updates

All stores implement optimistic UI updates. When a user performs an action (e.g. moves a task), the store updates local state **immediately** before the API call completes. If the request fails, the store rolls back to its previous state and a toast is shown.

```
User drags task
      │
      ├─▶ taskStore.moveTask()       (UI updates instantly — optimistic)
      │
      └─▶ task.service.moveTask()    (API call, async)
              │
              ├── Success → no-op (store already correct)
              └── Failure → rollback + error toast
```

### Drag & Drop (`@dnd-kit`)

`BoardPage` wraps the board in a single `DndContext`. `handleDragOver` and `handleDragEnd` logic lives in `listStore` and `taskStore` respectively, keeping component files lean.

```
DndContext  (BoardPage.tsx)
└── List.tsx[]           — SortableContext, horizontal list reordering
    └── TaskCard.tsx[]   — SortableContext, vertical task reordering within list
```

On drag end: detect source/destination → `taskStore.moveTask()` (optimistic) → `PATCH /tasks/:id/move` → server broadcasts `TASK_MOVED` to all other clients.

### Real-Time Layer — `useBoardSocket.ts`

This hook owns the full WebSocket lifecycle using the **native browser WebSocket API** (no Socket.IO client library). It connects on board mount and tears down on unmount.

```typescript
export const useBoardSocket = (boardId: string) => {
  useEffect(() => {
    const ws = new WebSocket(`${VITE_WS_URL}/boards/${boardId}?token=${token}`);

    ws.onmessage = ({ data }) => {
      const { type, payload } = JSON.parse(data);
      switch (type) {
        case 'TASK_CREATED':
        case 'TASK_UPDATED':
        case 'TASK_DELETED':
        case 'TASK_MOVED':
          useTaskStore.getState().applyWsEvent({ type, payload });
          break;
        case 'LIST_CREATED':
        case 'LIST_UPDATED':
        case 'LIST_DELETED':
          useListStore.getState().applyWsEvent({ type, payload });
          break;
      }
    };

    ws.onclose = () => scheduleReconnect();
    return () => ws.close();
  }, [boardId]);
};
```

Key decisions:

- Initialized **once** in `BoardPage.tsx` — not per card or column
- Uses `getState()` (Zustand's non-hook API) — safe inside `useEffect` with no stale closure issues
- WebSocket closes cleanly when navigating away from the board

### Services Layer — `src/services/`

All HTTP calls are isolated in pure service functions. No component or store imports Axios directly, making services independently testable and easy to swap out.

```typescript
// task.service.ts
export const moveTask = (taskId: string, body: MoveTaskDto) =>
  axios.patch<Task>(`/tasks/${taskId}/move`, body).then(r => r.data);

export const updateTask = (taskId: string, body: UpdateTaskDto) =>
  axios.patch<Task>(`/tasks/${taskId}`, body).then(r => r.data);
```

### TypeScript Types — `src/types/`

All interfaces mirror the Prisma schema exactly, enforcing the API contract at compile time.

```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  position: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string;
  labels: string[];
  listId: string;
  assignees: User[];
}

export interface MoveTaskDto {
  listId: string;
  position: number;
}
```

---

## Backend Architecture

The backend is a TypeScript Express API following a **controller-per-resource** pattern. Controllers own all business logic — validation, authorization, Prisma queries, activity logging, and WebSocket broadcasting. Routes are thin wires that attach Passport middleware and delegate to controllers.

### Key Files

|File|Responsibility|
|---|---|
|`src/index.ts`|Express bootstrap — CORS, cookie-parser, Passport init, HTTP server creation, WebSocket attachment|
|`src/passport.ts`|LocalStrategy (email/password login) + JwtStrategy (cookie-first JWT extraction with Authorization header fallback)|
|`src/prisma.ts`|Prisma client singleton shared across all controllers|
|`src/wsServer.ts`|WebSocket server auth, board room management, `broadcastToBoard()`|
|`src/services/activity.service.ts`|Centralised activity log creation — called by controllers after every DB change|
|`src/controllers/*.ts`|Request handling: validation → auth check → Prisma query → log activity → broadcast → respond|
|`src/routes/*.ts`|Endpoint wiring — attaches `passport.authenticate('jwt')` to protected routes|

### Request Lifecycle

```
HTTP Request
    │
    ▼
Express Router
    │
    ├── CORS
    ├── cookie-parser
    ├── Passport init
    │
    ▼
Route Handler
    │
    ├── passport.authenticate('jwt', { session: false })
    │     └── JwtStrategy: reads JWT from cookie first, Authorization header fallback
    ├── Board ownership / membership check (controller-level)
    │
    ▼
Controller Logic
    │
    ├── Prisma query (findUnique / findMany / create / update / transaction)
    ├── activity.service.ts → persist activity log
    ├── broadcastToBoard(boardId, event) → ws broadcast
    │
    ▼
JSON Response
```

### Authentication — Cookie-First JWT

Login sets an **HTTP-only cookie** (`token`) 
```
POST /api/auth/login
→ Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Secure
→ { user: {...}}
```

Subsequent requests automatically send the cookie. Passport's `JwtStrategy` reads it via a `cookieExtractor` function, falling back to the `Authorization: Bearer` header if no cookie is present. WebSocket connections are authenticated the same way — the JWT is validated from the cookie during the HTTP upgrade handshake.

### WebSocket Server (`wsServer.ts` — `ws` library)

The `ws` WebSocketServer is attached to the same HTTP server as Express. It maintains a `boardRooms` map (`boardId → Set<WebSocket>`).

```typescript
// Supported client → server messages
JOIN_BOARD   // add socket to board room
LEAVE_BOARD  // remove socket from board room
PING         // keepalive

// Server → all room members
broadcastToBoard(boardId, { type: 'TASK_MOVED', payload: {...} })
```

JWT validation happens at the HTTP upgrade step (before the WebSocket handshake completes), so unauthenticated connections are rejected before any room logic runs.

### Reordering & Position Algorithm

Task and list reordering uses **Prisma transactions** to atomically update multiple position values. Position is stored as a `Float` using the midpoint formula:

```
newPosition = (positionBefore + positionAfter) / 2
```

This allows unlimited insertions without renumbering the entire column. If floating-point precision degrades at very high reorder volumes, a rebalance pass reassigns clean integer positions.

### Search

Task search reads from `x-search-query` request header or the `q` query parameter and performs a case-insensitive `contains` query on `title` and `description` via Prisma.

---

## Real-Time Sync Strategy

The backend uses the **`ws` library** (native Node.js WebSocket) — not Socket.IO. The frontend connects using the **native browser WebSocket API** via `useBoardSocket`. Both ends use the same technology, keeping the stack simple and the bundle lean.

```
Client A                                          Client B
   │  WS upgrade (cookie: token=<jwt>)             │  WS upgrade (cookie: token=<jwt>)
   │──────────────────── wsServer.ts ─────────────▶│
   │                          │                    │
   │  JOIN_BOARD { boardId }  │                    │
   │─────────────────────────▶│                    │
   │                    boardRooms[boardId].add()  │
   │                          │                    │
   │  User drags task         │                    │
   │  1. taskStore.moveTask() │                    │  (optimistic — instant)
   │  2. PATCH /tasks/:id/move▶ REST API           │
   │  ◀── 200 OK ─────────────┘                    │
   │               broadcastToBoard(boardId, ...)  │
   │                    TASK_MOVED ───────────────▶│
   │                                               │  applyWsEvent → taskStore
   │                                               │  UI updates — no reload
```

### WebSocket Events — Server → All Clients in Board Room

|Event|Payload|Triggered by|
|---|---|---|
|`TASK_CREATED`|Full task object|`POST /tasks`|
|`TASK_UPDATED`|`{ id, changes }`|`PATCH /tasks/:id`|
|`TASK_DELETED`|`{ id, listId }`|`DELETE /tasks/:id`|
|`TASK_MOVED`|`{ id, fromListId, toListId, position }`|`PATCH /tasks/:id/move`|
|`LIST_CREATED`|Full list object|`POST /lists`|
|`LIST_UPDATED`|`{ id, changes }`|`PATCH /lists/:id`|
|`LIST_DELETED`|`{ id }`|`DELETE /lists/:id`|
|`MEMBER_ADDED`|Member object|`POST /boards/:id/members`|
|`ACTIVITY_NEW`|Activity object|Any write operation|

### Client → Server Messages

|Message|Description|
|---|---|
|`JOIN_BOARD`|Add this socket to the board room|
|`LEAVE_BOARD`|Remove from board room|
|`PING`|Keepalive|

### Conflict Resolution

- **Last Write Wins** — concurrent edits to the same field resolve by server timestamp
- **Optimistic updates** on the initiating client; rolled back on API failure
- **Drag conflicts** — server's final state wins; the `TASK_MOVED` event auto-corrects the losing client


## Assumptions & Trade-offs

### Assumptions

1. **Single workspace model** — Boards are not scoped to an organization. Workspace model like Trello woulr be better
2. **Cookie-based JWT auth** — The JWT is stored in an HTTP-only cookie set by the server, making it inaccessible to JavaScript and resistant to XSS. We can add Oautth support
3. **Client-side search filtering** — Task filtering is done client-side for zero-latency feel. The server also supports `x-search-query` / `q` param for filtered queries when needed.

### Trade-offs

| Decision              | Chose                   | Alternative       | Reason                                                                                                  |
| --------------------- | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| Auth middleware       | Passport (Local + JWT)  | Custom middleware | Battle-tested strategies; cookie extraction + header fallback in one config                             |
| State management      | Zustand + Immer         | Redux Toolkit     | Less boilerplate; `getState()` works cleanly in WebSocket handlers outside the React tree               |
