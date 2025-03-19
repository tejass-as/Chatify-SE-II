import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getGroupMessages, getUserGroups, sendGroupMessage } from "../controllers/groupMessage.Controller.js";

const router = express.Router();

router.get("/getGroups", protectRoute, getUserGroups);
router.get("/:id", protectRoute, getGroupMessages)
router.post("/send/:id", protectRoute, sendGroupMessage)    

export default router;
