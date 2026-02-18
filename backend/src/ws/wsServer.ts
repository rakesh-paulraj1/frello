import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { parse as parseCookie } from "cookie";
import type { WsEvent } from "./wsEvents";

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  email: string;
  name?: string;
  boardRooms: Set<string>;
}


const boardRooms = new Map<string, Set<AuthenticatedSocket>>();


function extractTokenFromCookie(req: IncomingMessage): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = parseCookie(cookieHeader);
  return cookies["token"] ?? null;
}

function verifyJwt(
  token: string,
): { id: string; email: string; name?: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[WS] JWT_SECRET is not set");
      return null;
    }
    const payload = jwt.verify(token, secret) as any;
    if (!payload?.id || !payload?.email) return null;
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch (err: any) {
    console.warn("[WS] JWT verification failed:", err.message);
    return null;
  }
}


function joinBoard(socket: AuthenticatedSocket, boardId: string) {
  if (!boardRooms.has(boardId)) {
    boardRooms.set(boardId, new Set());
  }
  boardRooms.get(boardId)!.add(socket);
  socket.boardRooms.add(boardId);
  console.log(
    `[WS] User ${socket.userId} joined board ${boardId} (room size: ${boardRooms.get(boardId)!.size})`,
  );
}

function leaveAllBoards(socket: AuthenticatedSocket) {
  for (const boardId of socket.boardRooms) {
    const room = boardRooms.get(boardId);
    if (room) {
      room.delete(socket);
      if (room.size === 0) boardRooms.delete(boardId);
    }
  }
  socket.boardRooms.clear();
}


export function broadcastToBoard(
  boardId: string,
  event: WsEvent,
  excludeSocket?: WebSocket,
) {
  const room = boardRooms.get(boardId);
  if (!room || room.size === 0) return;

  const message = JSON.stringify(event);
  for (const client of room) {
    if (client === excludeSocket) continue;
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function createWsServer(server: import("http").Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (rawSocket: WebSocket, req: IncomingMessage) => {
    const token = extractTokenFromCookie(req);
    if (!token) {
      console.warn("[WS] Connection rejected: no token cookie");
      rawSocket.close(4001, "Unauthorized: missing token cookie");
      return;
    }

    const user = verifyJwt(token);
    if (!user) {
      console.warn("[WS] Connection rejected: invalid/expired token");
      rawSocket.close(4001, "Unauthorized: invalid or expired token");
      return;
    }


    const socket = rawSocket as AuthenticatedSocket;
    socket.userId = user.id;
    socket.email = user.email;
    socket.name = user.name;
    socket.boardRooms = new Set();

    console.log(`[WS] User ${user.id} (${user.email}) connected`);

    socket.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "JOIN_BOARD" && typeof msg.boardId === "string") {
          joinBoard(socket, msg.boardId);
          socket.send(
            JSON.stringify({ type: "JOINED_BOARD", boardId: msg.boardId }),
          );
        } else if (
          msg.type === "LEAVE_BOARD" &&
          typeof msg.boardId === "string"
        ) {
          const room = boardRooms.get(msg.boardId);
          if (room) {
            room.delete(socket);
            if (room.size === 0) boardRooms.delete(msg.boardId);
          }
          socket.boardRooms.delete(msg.boardId);
          socket.send(
            JSON.stringify({ type: "LEFT_BOARD", boardId: msg.boardId }),
          );
        } else if (msg.type === "PING") {
          socket.send(JSON.stringify({ type: "PONG" }));
        }
      } catch {
        // ignore malformed / non-JSON messages
      }
    });

    // ── Cleanup ───────────────────────────────────────────────────────────────
    socket.on("close", () => {
      leaveAllBoards(socket);
      console.log(`[WS] User ${socket.userId} disconnected`);
    });

    socket.on("error", (err) => {
      console.error(
        `[WS] Socket error for user ${socket.userId}:`,
        err.message,
      );
      leaveAllBoards(socket);
    });
  });

  console.log("[WS] WebSocket server attached to HTTP server");
  return wss;
}
