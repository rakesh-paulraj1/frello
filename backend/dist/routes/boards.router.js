"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const boards_controller_1 = require("../controllers/boards.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
const ctrl = new boards_controller_1.BoardsController();
router.get('/boards', passport_1.default.authenticate('jwt', { session: false }), ctrl.list.bind(ctrl));
router.post('/boards', passport_1.default.authenticate('jwt', { session: false }), ctrl.create.bind(ctrl));
router.get('/boards/:id', passport_1.default.authenticate('jwt', { session: false }), ctrl.get.bind(ctrl));
router.put('/boards/:id', passport_1.default.authenticate('jwt', { session: false }), ctrl.update.bind(ctrl));
exports.default = router;
