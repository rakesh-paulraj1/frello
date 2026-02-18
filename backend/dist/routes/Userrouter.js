"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
const userController = new user_controller_1.Usercontroller();
router.post("/auth/signup", userController.signup.bind(userController));
router.post("/auth/login", userController.login.bind(userController));
router.post("/auth/logout", userController.logout.bind(userController)); // Added
router.get("/auth/me", passport_1.default.authenticate("jwt", { session: false }), userController.me.bind(userController));
router.get("/members", passport_1.default.authenticate("jwt", { session: false }), userController.members.bind(userController));
exports.default = router;
