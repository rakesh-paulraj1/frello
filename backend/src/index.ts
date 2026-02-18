import "dotenv/config";
import http from "http";
import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import UserRouter from "./routes/Userrouter";
import BoardsRouter from "./routes/boards.router";
import ListsRouter from "./routes/lists.router";
import TasksRouter from "./routes/tasks.router";
import ActivityRouter from "./routes/activity.router";
import { createWsServer } from "./ws/wsServer";

import "./config/passport";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app: Express = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(
  cors({
    credentials: true,
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Authorization"],
  }),
);

app.options("*", cors({ origin: FRONTEND_URL, credentials: true }));

app.use("/api", UserRouter);
app.use("/api", BoardsRouter);
app.use("/api", ListsRouter);
app.use("/api", TasksRouter);
app.use("/api", ActivityRouter);

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err?.stack || err);
  const status = err?.status || 500;
  res.status(status).json({ error: err?.message || "Internal Server Error" });
});

const server = http.createServer(app);
createWsServer(server);

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`WebSocket server listening on ws://localhost:${port}`);
});
