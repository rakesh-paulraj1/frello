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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usercontroller = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const prisma_1 = require("../config/prisma");
function cookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    };
}
class Usercontroller {
    signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({ error: "All fields are required." });
                return;
            }
            try {
                const existingUser = yield prisma_1.prisma.user.findUnique({ where: { email } });
                if (existingUser) {
                    res.status(409).json({ error: "Email already registered." });
                    return;
                }
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const user = yield prisma_1.prisma.user.create({
                    data: { name, email, password: hashedPassword },
                });
                const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
                res.cookie("token", token, cookieOptions());
                res
                    .status(201)
                    .json({ user: { id: user.id, name: user.name, email: user.email } });
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            passport_1.default.authenticate("local", { session: false }, (err, user, info) => {
                if (err) {
                    console.error("Passport.authenticate error:", err);
                    return res
                        .status(500)
                        .json({ error: (err === null || err === void 0 ? void 0 : err.message) || "Authentication error." });
                }
                if (!user)
                    return res
                        .status(401)
                        .json({ error: (info === null || info === void 0 ? void 0 : info.message) || "Invalid credentials." });
                try {
                    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
                    res.cookie("token", token, cookieOptions());
                    res
                        .status(200)
                        .json({
                        token,
                        user: { id: user.id, name: user.name, email: user.email },
                    });
                }
                catch (err) {
                    res.status(500).json({ error: "Internal server error." });
                }
            })(req, res);
        });
    }
    me(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userAny = req.user;
            if (!userAny) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            res.json({ id: userAny.id, name: userAny.name, email: userAny.email });
        });
    }
    members(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield prisma_1.prisma.user.findMany({
                    select: { id: true, name: true, email: true },
                });
                res.json({ data: users });
            }
            catch (err) {
                res.status(500).json({ error: "Internal server error." });
            }
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.clearCookie("token", cookieOptions());
            res.status(200).json({ message: "Logged out successfully" });
        });
    }
}
exports.Usercontroller = Usercontroller;
