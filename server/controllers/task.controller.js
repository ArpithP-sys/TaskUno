import pool from "../config/db.js";
import { logActivity } from "../utils/activityLogger.js";
import { sendEmail } from "../utils/emailSender.js";
import { taskActivityTemplate } from "../utils/emailTemplates.js";
import { createNotification } from "../utils/notificationService.js";

import { getIO } from "../utils/socketEmitter.js";
/* =========================
   GET TASKS BY PROJECT
========================= */
export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date,
        t.assigned_to,
        u.full_name AS assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1
        AND t.is_deleted = false
      ORDER BY t.created_at DESC
      `,
      [projectId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

/* =========================
   CREATE TASK
========================= */
export const createTask = async (req, res) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;
    const { title, due_date, assigned_to, priority } = req.body;
    const clerkUserId = req.auth.userId;

    if (!title) {
      return res.status(400).json({ message: "Task title required" });
    }

    // Creator
    const creatorResult = await pool.query(
      "SELECT id, full_name FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    const creator = creatorResult.rows[0];

    // Project + workspace
    const projectResult = await pool.query(
      `
      SELECT p.name AS project_name,
             w.id AS workspace_id,
             w.name AS workspace_name
      FROM projects p
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE p.id = $1
      `,
      [projectId]
    );
    const project = projectResult.rows[0];

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];
    const finalPriority = allowedPriorities.includes(priority?.toUpperCase())
      ? priority.toUpperCase()
      : "MEDIUM";

    // Create task
    const taskResult = await pool.query(
      `
      INSERT INTO tasks (project_id, title, due_date, priority, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        projectId,
        title,
        due_date || null,
        finalPriority,
        assigned_to || null,
        creator.id,
      ]
    );

    const taskId = taskResult.rows[0].id;

    // Activity
   await logActivity({
  workspaceId: project.workspace_id,
  userId: creator.id,
  entityType: "TASK",
  entityId: taskId,
  action: "CREATED",
  metadata: {
    taskTitle: title,
    projectName: project.project_name,
  },
});

    // 📧 Email ONLY if assigned to someone else
    if (assigned_to && assigned_to !== creator.id) {
      const assigneeResult = await pool.query(
        "SELECT email, full_name FROM users WHERE id = $1",
        [assigned_to]
      );

      if (assigneeResult.rows.length > 0) {
        const assignee = assigneeResult.rows[0];

        await sendEmail({
          to: assignee.email,
          subject: `New task assigned: ${title}`,
          html: taskActivityTemplate({
            actor: creator.full_name,
            action: "assigned you a task",
            taskTitle: title,
            projectName: project.project_name,
            workspaceName: project.workspace_name,
            dueDate: due_date,
          }),
        });

     await createNotification({
  userId: assignee.id,
  type: "TASK_ASSIGNED",
  message: `${creator.full_name} assigned you "${title}"`,
  metadata: {
    taskId,
    taskTitle: title,
    projectId,
    projectName: project.project_name,
    workspaceId: project.workspace_id,
    workspaceName: project.workspace_name,
  },
});


      }
    }

    res.status(201).json({ id: taskId });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
};

/* =========================
   UPDATE TASK STATUS
========================= */
export const updateTaskStatus = async (req, res) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { taskId } = req.params;
    const { status } = req.body;

    const userResult = await pool.query(
      "SELECT id, full_name FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );
    const user = userResult.rows[0];

    const taskResult = await pool.query(
      `
      SELECT 
        t.title,
        t.status,
        p.id AS project_id,
        p.name AS project_name,
        w.id AS workspace_id,
        w.name AS workspace_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE t.id = $1 AND t.is_deleted = false
      `,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskResult.rows[0];

    if (task.status === status) {
      return res.json({ success: true });
    }

    await pool.query(
      `UPDATE tasks SET status = $1 WHERE id = $2`,
      [status, taskId]
    );

 await logActivity({
  workspaceId: task.workspace_id,
  userId: user.id,
  entityType: "TASK",
  entityId: taskId,
  action: "STATUS_UPDATED",
  metadata: {
    taskTitle: task.title,
    projectName: task.project_name,
    status,
  },
});
const io = getIO();

io.to(`workspace:${task.workspace_id}`).emit("task:updated", {
  taskId,
  type: "STATUS_UPDATED",
  status,
});
    /* 🔔 NOTIFY ADMINS WHEN DONE */
    if (status === "DONE") {
      const admins = await pool.query(
        `
        SELECT u.id
        FROM workspace_members wm
        JOIN users u ON wm.user_id = u.id
        WHERE wm.workspace_id = $1
          AND wm.role IN ('OWNER','ADMIN')
          AND u.id != $2
        `,
        [task.workspace_id, user.id]
      );

      for (const admin of admins.rows) {
        await createNotification({
          userId: admin.id,
          type: "TASK_COMPLETED",
          message: `${user.full_name} completed a task`,
          metadata: {
            task_title: task.title,
            project_name: task.project_name,
            workspace_name: task.workspace_name,
          },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};
/* =========================
   SOFT DELETE TASK
========================= */
export const softDeleteTask = async (req, res) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { taskId } = req.params;

    const userResult = await pool.query(
      "SELECT id, full_name FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );
    const user = userResult.rows[0];

    const taskInfo = await pool.query(
      `
      SELECT t.title, t.assigned_to, p.workspace_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND t.is_deleted = false
      `,
      [taskId]
    );

    if (taskInfo.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskInfo.rows[0];

    await pool.query(
      `UPDATE tasks SET is_deleted = true WHERE id = $1`,
      [taskId]
    );

   await logActivity({
  workspaceId: task.workspace_id,
  userId: user.id,
  entityType: "TASK",
  entityId: taskId,
  action: "DELETED",
  metadata: {
    taskTitle: task.title,
    projectName: task.project_name,
  },
});


    // 🔔 Notify assignee ONLY if exists
    if (task.assigned_to && task.assigned_to !== user.id) {
      await createNotification({
        userId: task.assigned_to,
        type: "TASK_DELETED",
        message: `Task "${task.title}" was deleted`,
        metadata: { taskId },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Soft delete task error:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

/* =========================
   ASSIGN TASK
========================= */
export const assignTask = async (req, res) => {
  try {
    // ✅ AUTH CHECK (MISSING)
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { taskId } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({ message: "assigned_to is required" });
    }

    // 🔹 Actor
    const actorResult = await pool.query(
      "SELECT id, full_name FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );

    if (actorResult.rows.length === 0) {
      return res.status(404).json({ message: "Actor not found" });
    }

    const actor = actorResult.rows[0];

    // 🔹 Assignee
    const assigneeResult = await pool.query(
      "SELECT id, full_name, email FROM users WHERE id = $1",
      [assigned_to]
    );

    if (assigneeResult.rows.length === 0) {
      return res.status(404).json({ message: "Assignee not found" });
    }

    const assignee = assigneeResult.rows[0];

    // 🔹 Task
   const taskResult = await pool.query(
  `
  SELECT
    t.title,
    p.id AS project_id,
    p.name AS project_name,
    w.id AS workspace_id,
    w.name AS workspace_name
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  JOIN workspaces w ON p.workspace_id = w.id
  WHERE t.id = $1 AND t.is_deleted = false
  `,
  [taskId]
);


    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskResult.rows[0];

    // 🔹 Assign task
    await pool.query(
      `UPDATE tasks SET assigned_to = $1 WHERE id = $2`,
      [assigned_to, taskId]
    );

    // 🔹 Activity log
  await logActivity({
  workspaceId: task.workspace_id,
  userId: actor.id,
  entityType: "TASK",
  entityId: taskId,
  action: "ASSIGNED",
  metadata: {
    taskTitle: task.title,
    projectName: task.project_name,
    assignedTo: assignee.full_name,
  },
});
const io = getIO();

io.to(`workspace:${task.workspace_id}`).emit("task:updated", {
  taskId,
  type: "ASSIGNED",
  assignedTo: assignee.full_name,
});
    // ❌ DO NOT notify self (VERY IMPORTANT)
    if (assignee.id === actor.id) {
      return res.json({ success: true });
    }

    // 🔔 Notification
 await createNotification({
  userId: assignee.id,
  type: "TASK_ASSIGNED",
  message: `${actor.full_name} assigned you "${task.title}"`,
  metadata: {
    taskId,
    taskTitle: task.title,
    projectId: task.project_id,
    projectName: task.project_name,
    workspaceId: task.workspace_id,
    workspaceName: task.workspace_name,
  },
});

    // 📧 Email (ONLY if email exists)
    if (assignee.email) {
      await sendEmail({
        to: assignee.email,
        subject: `Task Assigned: ${task.title}`,
        html: taskActivityTemplate({
          actor: actor.full_name,
          action: "assigned you a task",
          taskTitle: task.title,
        }),
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({ message: "Failed to assign task" });
  }
};
/* =========================
   UPDATE TASK DUE DATE
========================= */
export const updateTaskDueDate = async (req, res) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { taskId } = req.params;
    const { due_date } = req.body;

    const userResult = await pool.query(
      "SELECT id, full_name FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );
    const user = userResult.rows[0];

    const taskResult = await pool.query(
      `
      SELECT 
        t.title,
        p.workspace_id,
        p.name AS project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND t.is_deleted = false
      `,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskResult.rows[0];

    await pool.query(
      `UPDATE tasks SET due_date = $1 WHERE id = $2`,
      [due_date || null, taskId]
    );

    await logActivity({
      workspaceId: task.workspace_id,
      userId: user.id,
      entityType: "TASK",
      entityId: taskId,
      action: "DUE_DATE_UPDATED",
      metadata: {
        taskTitle: task.title,
        projectName: task.project_name,
        dueDate: due_date,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Update due date error:", error);
    res.status(500).json({ message: "Failed to update due date" });
  }
};
