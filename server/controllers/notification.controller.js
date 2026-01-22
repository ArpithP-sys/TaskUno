import pool from "../config/db.js";

/* =========================
   GET USER NOTIFICATIONS
========================= */
export const getNotifications = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    if (!clerkUserId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/* =========================
   MARK AS READ
========================= */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

/* =========================
   UNREAD COUNT
========================= */
export const getUnreadCount = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `
      SELECT COUNT(*) 
      FROM notifications
      WHERE user_id = $1 AND is_read = false
      `,
      [userId]
    );

    res.json({ count: Number(result.rows[0].count) });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ message: "Failed to fetch count" });
  }
};
