import pool from "../config/db.js";

export const requireWorkspaceMember = async (req, res, next) => {
  try {
    const clerkUserId = req.auth.userId;
    const { workspaceId } = req.params;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    const memberCheck = await pool.query(
      `
      SELECT 1
      FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
      `,
      [workspaceId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.userId = userId;
    next();
  } catch (err) {
    console.error("Workspace access error:", err);
    res.status(500).json({ message: "Access check failed" });
  }
};
