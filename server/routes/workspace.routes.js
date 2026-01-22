import express from "express";
import {
  createWorkspace,
  getUserWorkspaces,
} from "../controllers/workspace.controller.js";
import {
  getProjectsByWorkspaceSlug,
  createProject,
} from "../controllers/project.controller.js";
import { getWorkspaceMembers } from "../controllers/workspace.controller.js";
import { createWorkspaceInvite } from "../controllers/workspace.controller.js";
import { acceptWorkspaceInvite } from "../controllers/workspace.controller.js";
import { requireWorkspaceRole} from "../middleware/requireRole.js";
import { inviteMember } from "../controllers/workspace.controller.js";
import { deleteWorkspace } from "../controllers/workspace.controller.js";
import { requireWorkspaceMember } from "../middleware/workspaceAccess.js";
import { getProjectsByWorkspace } from "../controllers/project.controller.js";
import { getWorkspaceInvites } from "../controllers/workspace.controller.js";
import { revokeWorkspaceInvite } from "../controllers/workspace.controller.js";
import { createTask } from "../controllers/task.controller.js";
import { exitWorkspace } from "../controllers/workspace.controller.js";
// import { requireAuth } from "@clerk/express";
import { requireAuth } from "../middleware/requireAuth.js";
const router = express.Router();

router.post("/",requireAuth, createWorkspace);
router.get("/", requireAuth, getUserWorkspaces);

// Workspace → Projects (USING SLUG ✅)
router.get("/:slug/projects", getProjectsByWorkspaceSlug);
router.post("/:slug/projects", createProject);
// router.get("/:workspaceId/members", getWorkspaceMembers);
router.post(
  "/:workspaceId/invite",
  requireAuth,
    requireWorkspaceRole(["ADMIN", "OWNER"]),
  createWorkspaceInvite
);
router.post(
  "/invite/:token",
  requireAuth,
  acceptWorkspaceInvite
);
// router.post(
//   "/workspaces/:workspaceId/invite",
//   requireWorkspaceRole(["OWNER", "ADMIN"]),
//   inviteMember
// );
// router.post(
//   "/projects/:projectId/tasks",
//   requireWorkspaceRole("ADMIN"),
//   createTask
// );
router.delete(
  "/:workspaceId",
  requireAuth,
  // requireWorkspaceRole(["OWNER", "ADMIN"]),
  deleteWorkspace
);
router.get(
  "/:workspaceId/members",
  requireAuth,
  requireWorkspaceMember,
  getWorkspaceMembers
);

router.get(
  "/:workspaceId/projects",
  requireAuth,
  requireWorkspaceMember,
  getProjectsByWorkspace
);
router.get(
  "/:workspaceId/invites",
  requireAuth,
  requireWorkspaceRole(["OWNER", "ADMIN"]),
  getWorkspaceInvites
);

// Revoke invite
router.delete(
  "/:workspaceId/invite/:inviteId",
  requireAuth,
  requireWorkspaceRole(["OWNER", "ADMIN"]),
  revokeWorkspaceInvite
);
router.delete(
  "/:workspaceId/leave",
  requireAuth,
  requireWorkspaceMember,
  exitWorkspace
);

export default router;
