"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lists_controller_1 = require("../controllers/lists.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
const ctrl = new lists_controller_1.ListsController();
router.get('/boards/:boardId/lists', passport_1.default.authenticate('jwt', { session: false }), ctrl.list.bind(ctrl));
router.post('/boards/:boardId/lists', passport_1.default.authenticate('jwt', { session: false }), ctrl.create.bind(ctrl));
router.put('/lists/:id', passport_1.default.authenticate('jwt', { session: false }), ctrl.update.bind(ctrl));
router.delete('/lists/:id', passport_1.default.authenticate('jwt', { session: false }), ctrl.remove.bind(ctrl));
router.put('/lists/:id/reorder', passport_1.default.authenticate('jwt', { session: false }), ctrl.reorder.bind(ctrl));
exports.default = router;
