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
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("./prisma");
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies)
        token = req.cookies['token'];
    return token;
};
if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set. Ensure dotenv.config() runs before importing passport config.');
}
passport_1.default.use(new passport_jwt_1.Strategy({
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([cookieExtractor, passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()]),
    secretOrKey: process.env.JWT_SECRET,
}, (payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!payload || !payload.id || !payload.email)
            return done(null, false);
        const userFromToken = { id: payload.id, email: payload.email, name: payload.name };
        return done(null, userFromToken);
    }
    catch (err) {
        return done(err, false);
    }
})));
passport_1.default.use(new passport_local_1.Strategy({ usernameField: 'email', passwordField: 'password' }, (email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return done(null, false, { message: 'Incorrect email or password.' });
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match)
            return done(null, false, { message: 'Incorrect email or password.' });
        return done(null, user);
    }
    catch (err) {
        console.error('LocalStrategy error:', err);
        return done(err);
    }
})));
exports.default = passport_1.default;
