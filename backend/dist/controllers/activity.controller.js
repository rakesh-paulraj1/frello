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
exports.ActivityController = void 0;
const prisma_1 = require("../config/prisma");
class ActivityController {
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const boardId = req.query.boardId || req.params.boardId;
            if (!boardId)
                return res.status(400).json({ error: 'boardId is required' });
            const page = Number(req.query.page || 0);
            const per = Math.min(100, Number(req.query.per || 50));
            try {
                const logs = yield prisma_1.prisma.activityLog.findMany({
                    where: { boardId },
                    include: { user: { select: { id: true, name: true, email: true } } },
                    orderBy: { createdAt: 'desc' },
                    skip: page * per,
                    take: per,
                });
                const listIds = new Set();
                const taskIds = new Set();
                for (const l of logs) {
                    const md = (_a = l.metadata) !== null && _a !== void 0 ? _a : {};
                    if ((md === null || md === void 0 ? void 0 : md.fromListId) && !(md === null || md === void 0 ? void 0 : md.fromListTitle))
                        listIds.add(md.fromListId);
                    if ((md === null || md === void 0 ? void 0 : md.toListId) && !(md === null || md === void 0 ? void 0 : md.toListTitle))
                        listIds.add(md.toListId);
                    if ((md === null || md === void 0 ? void 0 : md.listTitle) && !(md === null || md === void 0 ? void 0 : md.listTitle))
                        listIds.add(md.listTitle);
                    if (l.entityType === 'LIST' && !(md === null || md === void 0 ? void 0 : md.listTitle))
                        listIds.add(l.entityId);
                    if (l.entityType === 'TASK' && !(md === null || md === void 0 ? void 0 : md.taskTitle))
                        taskIds.add(l.entityId);
                }
                const [lists, tasks] = yield Promise.all([
                    listIds.size ? prisma_1.prisma.list.findMany({ where: { id: { in: Array.from(listIds) } }, select: { id: true, title: true } }) : Promise.resolve([]),
                    taskIds.size ? prisma_1.prisma.task.findMany({ where: { id: { in: Array.from(taskIds) } }, select: { id: true, title: true } }) : Promise.resolve([]),
                ]);
                const listMap = new Map(lists.map((x) => [x.id, x.title]));
                const taskMap = new Map(tasks.map((x) => [x.id, x.title]));
                const enriched = logs.map((l) => {
                    var _a;
                    const md = (_a = l.metadata) !== null && _a !== void 0 ? _a : {};
                    try {
                        if (md.fromListId && !md.fromListTitle && listMap.has(md.fromListId))
                            md.fromListTitle = listMap.get(md.fromListId);
                        if (md.toListId && !md.toListTitle && listMap.has(md.toListId))
                            md.toListTitle = listMap.get(md.toListId);
                        if (l.entityType === 'LIST' && !md.listTitle && listMap.has(l.entityId))
                            md.listTitle = listMap.get(l.entityId);
                        if (l.entityType === 'TASK' && !md.taskTitle && taskMap.has(l.entityId))
                            md.taskTitle = taskMap.get(l.entityId);
                    }
                    catch (e) {
                    }
                    return Object.assign(Object.assign({}, l), { metadata: md });
                });
                res.json({ data: enriched });
            }
            catch (err) {
                res.status(500).json({ error: 'Internal server error.' });
            }
        });
    }
}
exports.ActivityController = ActivityController;
