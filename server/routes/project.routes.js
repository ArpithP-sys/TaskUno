import express from "express";
import {
  getTasksByProject,
  createTask,
} from "../controllers/task.controller.js";
import { createProject } from "../controllers/project.controller.js";
import { requireWorkspaceRole } from "../middleware/requireRole.js";

const router = express.Router();

// Project → Tasks
router.get("/:projectId/tasks", getTasksByProject);
router.post("/:projectId/tasks", createTask);
router.post(
  "/workspaces/:workspaceId/projects",
  requireWorkspaceRole("ADMIN"),
  createProject
);
export default router;
