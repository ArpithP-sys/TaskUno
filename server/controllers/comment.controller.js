// import pool from "../config/db.js";
// import { getIO } from "../utils/socketEmitter.js";
// /* =========================
//    GET COMMENTS BY TASK
// ========================= */
// export const getCommentsByTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;

//     const result = await pool.query(
//       `
//       SELECT
//         c.id,
//         c.content,
//         c.created_at,
//         u.full_name
//       FROM task_comments c
//       JOIN users u ON c.user_id = u.id
//       WHERE c.task_id = $1
//       ORDER BY c.created_at ASC
//       `,
//       [taskId]
//     );

//     res.json(result.rows);
//   } catch (error) {
//     console.error("Get comments error:", error);
//     res.status(500).json({ message: "Failed to fetch comments" });
//   }
// };

// /* =========================
//    ADD COMMENT
// ========================= */
// export const addComment = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { content } = req.body;

//     if (!content) {
//       return res.status(400).json({ message: "Comment cannot be empty" });
//     }

//     const clerkUserId = req.auth.userId;

//     const userResult = await pool.query(
//       "SELECT id FROM users WHERE clerk_user_id = $1",
//       [clerkUserId]
//     );
//     const user = userResult.rows[0];

//     await pool.query(
//       `
//       INSERT INTO task_comments (task_id, user_id, content)
//       VALUES ($1, $2, $3)
//       `,
//       [taskId, user.id, content]
//     );

//     res.status(201).json({ success: true });
//   } catch (error) {
//     console.error("Add comment error:", error);
//     res.status(500).json({ message: "Failed to add comment" });
//   }
// };

import pool from "../config/db.js";
import { getIO } from "../utils/socketEmitter.js";

/* =========================
   GET COMMENTS BY TASK
========================= */
export const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.content,
        c.created_at,
        u.full_name
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
      `,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

/* =========================
   ADD COMMENT
========================= */
export const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );
    const user = userResult.rows[0];

    await pool.query(
      `
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES ($1, $2, $3)
      `,
      [taskId, user.id, content]
    );

    const taskInfo = await pool.query(
      `
      SELECT p.workspace_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1
      `,
      [taskId]
    );

    const workspaceId = taskInfo.rows[0]?.workspace_id;

    if (workspaceId) {
      const io = getIO();
      io.to(`workspace:${workspaceId}`).emit("task:updated", {
        taskId,
        type: "COMMENT_ADDED",
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};
