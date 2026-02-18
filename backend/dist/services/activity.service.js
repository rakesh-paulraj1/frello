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
exports.logActivity = logActivity;
const prisma_1 = require("../config/prisma");
function logActivity(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const repo = (_a = opts.tx) !== null && _a !== void 0 ? _a : prisma_1.prisma;
        return repo.activityLog.create({
            data: {
                boardId: opts.boardId,
                userId: opts.userId,
                actionType: opts.actionType,
                entityType: opts.entityType,
                entityId: opts.entityId,
                metadata: (_b = opts.metadata) !== null && _b !== void 0 ? _b : {},
            },
        });
    });
}
exports.default = { logActivity };
