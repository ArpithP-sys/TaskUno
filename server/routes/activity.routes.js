import express from "express";
import { getWorkspaceActivity } from "../controllers/activity.controller.js";

const router = express.Router();

router.get("/workspace/:workspaceId", getWorkspaceActivity);

export default router;
