// import pool from "../config/db.js";

// export const getDashboardStats = async (req, res) => {
//   try {
//     const clerkUserId = req.auth.userId;

//     const userResult = await pool.query(
//   "SELECT id FROM users WHERE clerk_user_id = $1",
//   [clerkUserId]
// );

// if (userResult.rows.length === 0) {
//   return res.json({
//     stats: {
//       total_tasks: 0,
//       due_today: 0,
//       overdue: 0,
//       completed: 0,
//       assigned_to_me: 0,
//     },
//     priorityBreakdown: [],
//     statusBreakdown: [],
//   });
// }

// const userId = userResult.rows[0].id;
//     const today = new Date().toISOString().slice(0, 10);

//     const statsQuery = await pool.query(
//       `
//       SELECT
//         COUNT(*) FILTER (WHERE is_deleted = false) AS total_tasks,
//         COUNT(*) FILTER (WHERE due_date = $1 AND status != 'DONE' AND is_deleted = false) AS due_today,
//         COUNT(*) FILTER (WHERE due_date < $1 AND status != 'DONE' AND is_deleted = false) AS overdue,
//         COUNT(*) FILTER (WHERE status = 'DONE' AND is_deleted = false) AS completed,
//         COUNT(*) FILTER (WHERE assigned_to = $2 AND is_deleted = false) AS assigned_to_me
//       FROM tasks
//       `,
//       [today, userId]
//     );

//     const priorityQuery = await pool.query(
//       `
//       SELECT priority, COUNT(*) 
//       FROM tasks
//       WHERE is_deleted = false
//       GROUP BY priority
//       `
//     );

//     const statusQuery = await pool.query(
//       `
//       SELECT status, COUNT(*) 
//       FROM tasks
//       WHERE is_deleted = false
//       GROUP BY status
//       `
//     );
//     // 🔥 High priority tasks (LIMIT 5)
// const highPriorityTasks = await pool.query(
//   `
//   SELECT 
//     t.id,
//     t.title,
//     t.due_date,
//     t.priority,
//     p.name AS project_name,
//     w.name AS workspace_name
//   FROM tasks t
//   JOIN projects p ON t.project_id = p.id
//   JOIN workspaces w ON p.workspace_id = w.id
//   WHERE t.priority = 'HIGH'
//     AND t.status != 'DONE'
//     AND t.is_deleted = false
//   ORDER BY t.due_date ASC NULLS LAST
//   LIMIT 5
//   `
// );

// // ⏰ Overdue tasks
// const overdueTasks = await pool.query(
//   `
//   SELECT 
//     t.id,
//     t.title,
//     t.due_date,
//     p.name AS project_name
//   FROM tasks t
//   JOIN projects p ON t.project_id = p.id
//   WHERE t.due_date < $1
//     AND t.status != 'DONE'
//     AND t.is_deleted = false
//   ORDER BY t.due_date ASC
//   LIMIT 5
//   `,
//   [today]
// );

// // 👤 Tasks assigned to me
// const myTasks = await pool.query(
//   `
//   SELECT 
//     t.id,
//     t.title,
//     t.status,
//     p.name AS project_name
//   FROM tasks t
//   JOIN projects p ON t.project_id = p.id
//   WHERE t.assigned_to = $1
//     AND t.is_deleted = false
//   ORDER BY t.created_at DESC
//   LIMIT 5
//   `,
//   [userId]
// );



//     res.json({
//   stats: statsQuery.rows[0],
//   priorityBreakdown: priorityQuery.rows,
//   statusBreakdown: statusQuery.rows,
//   highPriorityTasks: highPriorityTasks.rows,
//   overdueTasks: overdueTasks.rows,
//   myTasks: myTasks.rows,
// });
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     res.status(500).json({ message: "Failed to load dashboard" });
//   }
// };

import pool from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    // 1️⃣ Get user
    const userRes = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userRes.rows.length === 0) {
      return res.json(null);
    }

    const userId = userRes.rows[0].id;

    // 2️⃣ Get workspaces user belongs to
    const wsRes = await pool.query(
      `
      SELECT workspace_id, role
      FROM workspace_members
      WHERE user_id = $1
      `,
      [userId]
    );

    if (wsRes.rows.length === 0) {
      return res.json({
        stats: {
          total_tasks: 0,
          completed: 0,
          overdue: 0,
          due_today: 0,
          assigned_to_me: 0,
        },
        priorityBreakdown: [],
        statusBreakdown: [],
        role: "MEMBER",
      });
    }

    const workspaceIds = wsRes.rows.map(w => w.workspace_id);
    const roles = wsRes.rows.map(w => w.role);

    const isAdmin = roles.some(
      r => r === "ADMIN" || r === "OWNER"
    );

    // 3️⃣ GLOBAL STATS (AGGREGATED WORKSPACES)
    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE t.is_deleted = false) AS total_tasks,
        COUNT(*) FILTER (WHERE t.status = 'DONE' AND t.is_deleted = false) AS completed,
        COUNT(*) FILTER (
          WHERE t.due_date < CURRENT_DATE
          AND t.status != 'DONE'
          AND t.is_deleted = false
        ) AS overdue,
        COUNT(*) FILTER (
          WHERE t.due_date = CURRENT_DATE
          AND t.status != 'DONE'
          AND t.is_deleted = false
        ) AS due_today,
        COUNT(*) FILTER (
          WHERE t.assigned_to = $1
          AND t.is_deleted = false
        ) AS assigned_to_me
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = ANY($2)
    `;

    const statsRes = await pool.query(statsQuery, [
      userId,
      workspaceIds,
    ]);

    // 4️⃣ PRIORITY BREAKDOWN
    const priorityRes = await pool.query(
      `
      SELECT t.priority, COUNT(*)
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = ANY($1)
        AND t.is_deleted = false
      GROUP BY t.priority
      `,
      [workspaceIds]
    );

    // 5️⃣ STATUS BREAKDOWN
    const statusRes = await pool.query(
      `
      SELECT t.status, COUNT(*)
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = ANY($1)
        AND t.is_deleted = false
      GROUP BY t.status
      `,
      [workspaceIds]
    );

    // ✅ FINAL RESPONSE
    res.json({
      stats: statsRes.rows[0],
      priorityBreakdown: priorityRes.rows,
      statusBreakdown: statusRes.rows,
      role: isAdmin ? "ADMIN" : "MEMBER",
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Dashboard failed" });
  }
};
