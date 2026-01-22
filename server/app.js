import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import workspaceDashboardRoutes from "./routes/workspaceDashboard.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import searchRoutes from "./routes/search.routes.js";

import "./cron/taskReminder.cron.js";
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Clerk middleware FIRST
app.use(clerkMiddleware());

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/workspace-dashboard", workspaceDashboardRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/search", searchRoutes);
// Health check endpoint

app.get("/health", (req, res) => {
  res.json({ status: "API running" });
});

export default app;
