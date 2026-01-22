import pool from "../config/db.js";

export const getCalendarTasks = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `
      SELECT
        t.id AS task_id,
        t.title,
        t.due_date,
        t.status,
        p.id AS project_id,
        p.name AS project_name,
        w.id AS workspace_id,
        w.slug AS workspace_slug,
        w.name AS workspace_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = $1
        AND t.due_date IS NOT NULL
        AND t.is_deleted = false
      ORDER BY t.due_date ASC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Calendar fetch error:", err);
    res.status(500).json({ message: "Failed to fetch calendar tasks" });
  }
};

// import pool from "../config/db.js";

// export const getCalendarTasks = async (req, res) => {
//   try {
//     const { start, end } = req.query;

//     if (!start || !end) {
//       return res.status(400).json({
//         message: "start and end dates are required",
//       });
//     }

//     // ✅ Clerk user
//     const clerkUserId = req.auth?.userId;

//     if (!clerkUserId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const userResult = await pool.query(
//       "SELECT id FROM users WHERE clerk_user_id = $1",
//       [clerkUserId]
//     );

//     const userId = userResult.rows[0]?.id;
//     if (!userId) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     // ✅ FIXED QUERY
//     const result = await pool.query(
//       `
//       SELECT
//         t.id,
//         t.title,
//         t.status,
//         t.priority,
//         t.due_date,
//         p.id AS project_id,
//         p.name AS project_name
//       FROM tasks t
//       JOIN projects p ON p.id = t.project_id
//       JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
//       WHERE wm.user_id = $1
//         AND t.due_date BETWEEN $2 AND $3
//       ORDER BY t.due_date ASC
//       `,
//       [userId, start, end]
//     );

//     res.json(result.rows);
//   } catch (error) {
//     console.error("Calendar fetch error:", error);
//     res.status(500).json({ message: "Failed to fetch calendar tasks" });
//   }
// };
