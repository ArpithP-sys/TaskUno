import pool from "../config/db.js";

export const getWorkspaceDashboard = async (req, res) => {
  try {
    const { slug } = req.params;
    const clerkUserId = req.auth.userId;

    // 🔹 get user
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // 🔹 get workspace by slug
    const workspaceResult = await pool.query(
      "SELECT id FROM workspaces WHERE slug = $1",
      [slug]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const workspaceId = workspaceResult.rows[0].id;
    const today = new Date().toISOString().slice(0, 10);

    // 🔹 stats
    const statsQuery = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE t.is_deleted = false) AS total_tasks,
        COUNT(*) FILTER (WHERE t.due_date = $1 AND t.status != 'DONE' AND t.is_deleted = false) AS due_today,
        COUNT(*) FILTER (WHERE t.due_date < $1 AND t.status != 'DONE' AND t.is_deleted = false) AS overdue,
        COUNT(*) FILTER (WHERE t.status = 'DONE' AND t.is_deleted = false) AS completed,
        COUNT(*) FILTER (WHERE t.assigned_to = $2 AND t.is_deleted = false) AS assigned_to_me
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = $3
      `,
      [today, userId, workspaceId]
    );

    // 🔹 priority
    const priorityQuery = await pool.query(
      `
      SELECT t.priority, COUNT(*)
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = $1 AND t.is_deleted = false
      GROUP BY t.priority
      `,
      [workspaceId]
    );

    // 🔹 status
    const statusQuery = await pool.query(
      `
      SELECT t.status, COUNT(*)
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = $1 AND t.is_deleted = false
      GROUP BY t.status
      `,
      [workspaceId]
    );

    res.json({
      workspaceId,
      stats: statsQuery.rows[0],
      priorityBreakdown: priorityQuery.rows,
      statusBreakdown: statusQuery.rows,
    });
  } catch (error) {
    console.error("Workspace dashboard error:", error);
    res.status(500).json({ message: "Failed to load workspace dashboard" });
  }
};
