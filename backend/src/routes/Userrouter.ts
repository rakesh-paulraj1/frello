import { Router } from "express";
import { Usercontroller } from "../controllers/user.controller";

import passport from "passport";

const router = Router();

const userController = new Usercontroller();

router.post("/auth/signup", userController.signup.bind(userController));
router.post("/auth/login", userController.login.bind(userController));
router.post("/auth/logout", userController.logout.bind(userController)); // Added

router.get(
  "/auth/me",
  passport.authenticate("jwt", { session: false }),
  userController.me.bind(userController),
);
router.get(
  "/members",
  passport.authenticate("jwt", { session: false }),
  userController.members.bind(userController),
);
export default router;
