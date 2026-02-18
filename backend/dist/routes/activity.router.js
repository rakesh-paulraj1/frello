"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
const ctrl = new activity_controller_1.ActivityController();
router.get('/boards/:boardId/activity', passport_1.default.authenticate('jwt', { session: false }), ctrl.list.bind(ctrl));
exports.default = router;
