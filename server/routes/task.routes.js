import express from "express";
import {
    updateTaskStatus,
    softDeleteTask,
    assignTask,
    updateTaskDueDate,
} from "../controllers/task.controller.js";
import { createTask } from "../controllers/task.controller.js";
import { requireWorkspaceRole } from "../middleware/requireRole.js";
const router = express.Router();

router.patch("/:taskId/status", updateTaskStatus);
router.patch("/:taskId/delete", softDeleteTask);
router.patch("/:taskId/assign", assignTask);
router.post(
  "/projects/:projectId/tasks",
  requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"]),
  createTask
);
router.patch("/:taskId/due-date", updateTaskDueDate);

export default router;
