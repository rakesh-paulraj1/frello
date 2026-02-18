"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardsController = void 0;
const prisma_1 = require("../config/prisma");
const activity_service_1 = require("../services/activity.service");
const wsServer_1 = require("../ws/wsServer");
class BoardsController {
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userAny = req.user;
            try {
                const where = userAny
                    ? { OR: [{ isPublic: true }, { ownerId: userAny.id }] }
                    : { isPublic: true };
                const boards = yield prisma_1.prisma.board.findMany({
                    where,
                    select: { id: true, title: true, isPublic: true, ownerId: true },
                });
                if (!boards || boards.length === 0)
                    return res.json({ data: [], message: "no boards available" });
                res.json({ data: boards });
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userAny = req.user;
            if (!userAny)
                return res.status(401).json({ error: "Unauthorized" });
            const { title } = req.body;
            if (!title)
                return res.status(400).json({ error: "Title is required." });
            try {
                const existing = yield prisma_1.prisma.board.findFirst({
                    where: { title, ownerId: userAny.id },
                });
                if (existing) {
                    return res.status(409).json({ error: "Board title already exists." });
                }
                const board = yield prisma_1.prisma.board.create({
                    data: { title, ownerId: userAny.id, isPublic: true },
                });
                try {
                    yield (0, activity_service_1.logActivity)({
                        boardId: board.id,
                        userId: userAny.id,
                        actionType: "CREATED",
                        entityType: "BOARD",
                        entityId: board.id,
                        metadata: { title },
                    });
                }
                catch (e) {
                    console.error("Failed to log activity for board.create", e);
                }
                res.status(201).json(board);
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    get(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userAny = req.user;
            if (!userAny)
                return res.status(401).json({ error: "Unauthorized" });
            const boardId = req.params.id;
            try {
                const board = yield prisma_1.prisma.board.findUnique({
                    where: { id: boardId },
                    include: { lists: { orderBy: { position: "asc" } } },
                });
                if (!board)
                    return res.status(404).json({ error: "Board not found." });
                if (!board.isPublic && board.ownerId !== userAny.id)
                    return res.status(403).json({ error: "Forbidden." });
                res.json({
                    board: {
                        id: board.id,
                        title: board.title,
                        isPublic: board.isPublic,
                        lists: board.lists,
                    },
                });
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userAny = req.user;
            if (!userAny)
                return res.status(401).json({ error: "Unauthorized" });
            const boardId = req.params.id;
            const { title } = req.body;
            if (!title)
                return res.status(400).json({ error: "Title is required." });
            try {
                const board = yield prisma_1.prisma.board.findUnique({ where: { id: boardId } });
                if (!board)
                    return res.status(404).json({ error: "Board not found." });
                if (board.ownerId !== userAny.id)
                    return res.status(403).json({ error: "Forbidden." });
                const updated = yield prisma_1.prisma.board.update({
                    where: { id: boardId },
                    data: { title },
                });
                // Broadcast
                (0, wsServer_1.broadcastToBoard)(boardId, {
                    type: "BOARD_UPDATED",
                    boardId,
                    actorId: userAny.id,
                    payload: updated,
                });
                try {
                    yield (0, activity_service_1.logActivity)({
                        boardId: updated.id,
                        userId: userAny.id,
                        actionType: "UPDATED",
                        entityType: "BOARD",
                        entityId: updated.id,
                        metadata: { title },
                    });
                }
                catch (e) {
                    console.error("Failed to log activity for board.update", e);
                }
                res.json(updated);
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
}
exports.BoardsController = BoardsController;
