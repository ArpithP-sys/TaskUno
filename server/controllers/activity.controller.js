import pool from "../config/db.js";

export const getWorkspaceActivity = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const result = await pool.query(
      `
      SELECT
        al.id,
        al.action,
        al.metadata,
        al.created_at,
        u.full_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.workspace_id = $1
      ORDER BY al.created_at DESC
      LIMIT 50
      `,
      [workspaceId]
    );

    // ✅ Build readable messages
    const activities = result.rows.map((a) => {
      let message = a.action;

      const taskTitle = a.metadata?.title || a.metadata?.taskTitle;
      const projectName = a.metadata?.projectName;

      if (taskTitle && projectName) {
        message = `${a.action.toLowerCase()} task "${taskTitle}" in project "${projectName}"`;
      } else if (taskTitle) {
        message = `${a.action.toLowerCase()} task "${taskTitle}"`;
      }

      return {
        id: a.id,
        full_name: a.full_name,
        message,
        created_at: a.created_at,
      };
    });

    res.json(activities);
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};
