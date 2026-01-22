import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";

import { getWorkspaceDashboard } from "../controllers/workspaceDashboard.controller.js";

const router = express.Router();

router.get(
  "/:slug",
  requireAuth,
  getWorkspaceDashboard
);

export default router;
