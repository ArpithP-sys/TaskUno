import pool from "../config/db.js";

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const clerkUserId = req.auth.userId;

    // get user id
    const userRes = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    const userId = userRes.rows[0].id;

    // search ONLY inside user's workspaces
    const result = await pool.query(
      `
      SELECT 
        'task' AS type,
        t.id,
        t.title AS name,
        w.name AS workspace
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = $1
        AND t.title ILIKE $2
        AND t.is_deleted = false

      UNION

      SELECT
        'project' AS type,
        p.id,
        p.name,
        w.name
      FROM projects p
      JOIN workspaces w ON p.workspace_id = w.id
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = $1
        AND p.name ILIKE $2
      `,
      [userId, `%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};
