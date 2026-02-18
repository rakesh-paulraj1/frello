"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const Userrouter_1 = __importDefault(require("./routes/Userrouter"));
const boards_router_1 = __importDefault(require("./routes/boards.router"));
const lists_router_1 = __importDefault(require("./routes/lists.router"));
const tasks_router_1 = __importDefault(require("./routes/tasks.router"));
const activity_router_1 = __importDefault(require("./routes/activity.router"));
const wsServer_1 = require("./ws/wsServer");
require("./config/passport");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3001;
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use((0, cors_1.default)({
    credentials: true,
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Authorization"],
}));
app.options("*", (0, cors_1.default)({ origin: FRONTEND_URL, credentials: true }));
app.use("/api", Userrouter_1.default);
app.use("/api", boards_router_1.default);
app.use("/api", lists_router_1.default);
app.use("/api", tasks_router_1.default);
app.use("/api", activity_router_1.default);
app.use((err, req, res, next) => {
    console.error("Unhandled error:", (err === null || err === void 0 ? void 0 : err.stack) || err);
    const status = (err === null || err === void 0 ? void 0 : err.status) || 500;
    res.status(status).json({ error: (err === null || err === void 0 ? void 0 : err.message) || "Internal Server Error" });
});
const server = http_1.default.createServer(app);
(0, wsServer_1.createWsServer)(server);
server.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
    console.log(`WebSocket server listening on ws://localhost:${port}`);
});
