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
exports.ListsController = void 0;
const prisma_1 = require("../config/prisma");
const activity_service_1 = require("../services/activity.service");
const wsServer_1 = require("../ws/wsServer");
class ListsController {
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const boardId = req.params.boardId;
            if (!boardId)
                return res.status(400).json({ error: "boardId is required" });
            try {
                const lists = yield prisma_1.prisma.list.findMany({
                    where: { boardId },
                    orderBy: { position: "asc" },
                });
                res.json({ data: lists });
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userAny = req.user;
            if (!userAny)
                return res.status(401).json({ error: "Unauthorized" });
            const boardId = req.params.boardId;
            const { title } = req.body;
            if (!boardId)
                return res.status(400).json({ error: "boardId is required" });
            if (!title)
                return res.status(400).json({ error: "Title is required." });
            try {
                const board = yield prisma_1.prisma.board.findUnique({ where: { id: boardId } });
                if (!board)
                    return res.status(404).json({ error: "Board not found." });
                if (board.ownerId !== userAny.id)
                    return res.status(403).json({ error: "Forbidden." });
                const maxPos = yield prisma_1.prisma.list.aggregate({
                    where: { boardId },
                    _max: { position: true },
                });
                const nextPos = ((_a = maxPos._max.position) !== null && _a !== void 0 ? _a : -1) + 1;
                const list = yield prisma_1.prisma.list.create({
                    data: { title, boardId, position: nextPos },
                });
                // Broadcast
                (0, wsServer_1.broadcastToBoard)(boardId, {
                    type: "LIST_CREATED",
                    boardId,
                    actorId: userAny.id,
                    payload: list,
                });
                try {
                    yield (0, activity_service_1.logActivity)({
                        boardId: board.id,
                        userId: userAny.id,
                        actionType: "CREATED",
                        entityType: "LIST",
                        entityId: list.id,
                        metadata: { title, position: nextPos },
                    });
                }
                catch (e) {
                    console.error("Failed to log activity for list.create", e);
                }
                res.status(201).json(list);
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
            const id = req.params.id;
            const { title } = req.body;
            if (!id)
                return res.status(400).json({ error: "id is required" });
            if (!title)
                return res.status(400).json({ error: "Title is required." });
            try {
                const list = yield prisma_1.prisma.list.findUnique({
                    where: { id },
                    include: { board: true },
                });
                if (!list)
                    return res.status(404).json({ error: "List not found." });
                if (list.board.ownerId !== userAny.id)
                    return res.status(403).json({ error: "Forbidden." });
                const updated = yield prisma_1.prisma.list.update({
                    where: { id },
                    data: { title },
                });
                // Broadcast
                (0, wsServer_1.broadcastToBoard)(list.boardId, {
                    type: "LIST_UPDATED",
                    boardId: list.boardId,
                    actorId: userAny.id,
                    payload: updated,
                });
                try {
                    yield (0, activity_service_1.logActivity)({
                        boardId: list.boardId,
                        userId: userAny.id,
                        actionType: "UPDATED",
                        entityType: "LIST",
                        entityId: updated.id,
                        metadata: { title },
                    });
                }
                catch (e) {
                    console.error("Failed to log activity for list.update", e);
                }
                res.json(updated);
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    remove(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userAny = req.user;
            if (!userAny)
                return res.status(401).json({ error: "Unauthorized" });
            const id = req.params.id;
            if (!id)
                return res.status(400).json({ error: "id is required" });
            try {
                const list = yield prisma_1.prisma.list.findUnique({
                    where: { id },
                    include: { board: true },
                });
                if (!list)
                    return res.status(404).json({ error: "List not found." });
                if (list.board.ownerId !== userAny.id)
                    return res.status(403).json({ error: "Forbidden." });
                yield prisma_1.prisma.list.delete({ where: { id } });
                // Broadcast
                (0, wsServer_1.broadcastToBoard)(list.boardId, {
                    type: "LIST_DELETED",
                    boardId: list.boardId,
                    actorId: userAny.id,
                    payload: { id, boardId: list.boardId },
                });
                try {
                    yield (0, activity_service_1.logActivity)({
                        boardId: list.boardId,
                        userId: userAny.id,
                        actionType: "DELETED",
                        entityType: "LIST",
                        entityId: id,
                        metadata: { title: list.title },
                    });
                }
                catch (e) {
                    console.error("Failed to log activity for list.delete", e);
                }
                res.status(204).send();
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    reorder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userAny = req.user;
            if (!userAny)
                return res.status(401).json({ error: "Unauthorized" });
            const id = req.params.id;
            const { position } = req.body;
            if (position === undefined || position === null)
                return res.status(400).json({ error: "position is required" });
            try {
                const list = yield prisma_1.prisma.list.findUnique({
                    where: { id },
                    include: { board: true },
                });
                if (!list)
                    return res.status(404).json({ error: "List not found." });
                if (list.board.ownerId !== userAny.id)
                    return res.status(403).json({ error: "Forbidden." });
                const listsCount = yield prisma_1.prisma.list.count({
                    where: { boardId: list.boardId },
                });
                const newPos = Math.max(0, Math.min(position, listsCount - 1));
                const oldPos = list.position;
                if (newPos === oldPos)
                    return res.json({ message: "No change" });
                if (newPos < oldPos) {
                    yield prisma_1.prisma.$transaction([
                        prisma_1.prisma.list.updateMany({
                            where: {
                                boardId: list.boardId,
                                position: { gte: newPos, lt: oldPos },
                            },
                            data: { position: { increment: 1 } },
                        }),
                        prisma_1.prisma.list.update({ where: { id }, data: { position: newPos } }),
                    ]);
                }
                else {
                    yield prisma_1.prisma.$transaction([
                        prisma_1.prisma.list.updateMany({
                            where: {
                                boardId: list.boardId,
                                position: { gt: oldPos, lte: newPos },
                            },
                            data: { position: { decrement: 1 } },
                        }),
                        prisma_1.prisma.list.update({ where: { id }, data: { position: newPos } }),
                    ]);
                }
                // Broadcast
                (0, wsServer_1.broadcastToBoard)(list.boardId, {
                    type: "LIST_REORDERED",
                    boardId: list.boardId,
                    actorId: userAny.id,
                    payload: { id, boardId: list.boardId, position: newPos },
                });
                try {
                    yield (0, activity_service_1.logActivity)({
                        boardId: list.boardId,
                        userId: userAny.id,
                        actionType: "MOVED",
                        entityType: "LIST",
                        entityId: id,
                        metadata: { from: oldPos, to: newPos, listTitle: list.title },
                    });
                }
                catch (e) {
                    console.error("Failed to log activity for list.reorder", e);
                }
                res.json({ message: "Reordered" });
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
}
exports.ListsController = ListsController;
