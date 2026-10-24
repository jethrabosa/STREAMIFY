import express from "express";
import { getTurnCredentials } from "../controllers/turn.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/credentials", protectRoute, getTurnCredentials);

export default router;
