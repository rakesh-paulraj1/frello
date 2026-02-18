"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastToBoard = broadcastToBoard;
exports.createWsServer = createWsServer;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = require("cookie");
const boardRooms = new Map();
function extractTokenFromCookie(req) {
    var _a;
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader)
        return null;
    const cookies = (0, cookie_1.parse)(cookieHeader);
    return (_a = cookies["token"]) !== null && _a !== void 0 ? _a : null;
}
function verifyJwt(token) {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("[WS] JWT_SECRET is not set");
            return null;
        }
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (!(payload === null || payload === void 0 ? void 0 : payload.id) || !(payload === null || payload === void 0 ? void 0 : payload.email))
            return null;
        return { id: payload.id, email: payload.email, name: payload.name };
    }
    catch (err) {
        console.warn("[WS] JWT verification failed:", err.message);
        return null;
    }
}
function joinBoard(socket, boardId) {
    if (!boardRooms.has(boardId)) {
        boardRooms.set(boardId, new Set());
    }
    boardRooms.get(boardId).add(socket);
    socket.boardRooms.add(boardId);
    console.log(`[WS] User ${socket.userId} joined board ${boardId} (room size: ${boardRooms.get(boardId).size})`);
}
function leaveAllBoards(socket) {
    for (const boardId of socket.boardRooms) {
        const room = boardRooms.get(boardId);
        if (room) {
            room.delete(socket);
            if (room.size === 0)
                boardRooms.delete(boardId);
        }
    }
    socket.boardRooms.clear();
}
function broadcastToBoard(boardId, event, excludeSocket) {
    const room = boardRooms.get(boardId);
    if (!room || room.size === 0)
        return;
    const message = JSON.stringify(event);
    for (const client of room) {
        if (client === excludeSocket)
            continue;
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    }
}
function createWsServer(server) {
    const wss = new ws_1.WebSocketServer({ server });
    wss.on("connection", (rawSocket, req) => {
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
        const socket = rawSocket;
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
                    socket.send(JSON.stringify({ type: "JOINED_BOARD", boardId: msg.boardId }));
                }
                else if (msg.type === "LEAVE_BOARD" &&
                    typeof msg.boardId === "string") {
                    const room = boardRooms.get(msg.boardId);
                    if (room) {
                        room.delete(socket);
                        if (room.size === 0)
                            boardRooms.delete(msg.boardId);
                    }
                    socket.boardRooms.delete(msg.boardId);
                    socket.send(JSON.stringify({ type: "LEFT_BOARD", boardId: msg.boardId }));
                }
                else if (msg.type === "PING") {
                    socket.send(JSON.stringify({ type: "PONG" }));
                }
            }
            catch (_a) {
                // ignore malformed / non-JSON messages
            }
        });
        // ── Cleanup ───────────────────────────────────────────────────────────────
        socket.on("close", () => {
            leaveAllBoards(socket);
            console.log(`[WS] User ${socket.userId} disconnected`);
        });
        socket.on("error", (err) => {
            console.error(`[WS] Socket error for user ${socket.userId}:`, err.message);
            leaveAllBoards(socket);
        });
    });
    console.log("[WS] WebSocket server attached to HTTP server");
    return wss;
}
