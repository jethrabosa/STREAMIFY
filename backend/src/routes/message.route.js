import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	deleteUserAccount,
	getMessages,
	getUsersForSidebar,
	sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.delete("/users/:id", protectRoute, deleteUserAccount);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

export default router;
