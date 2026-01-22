// import pool from "../config/db.js";
// import { getIO } from "../socket.js";

// export const createNotification = async ({
//   userId,
//   type,
//   message,
//   metadata = {},
// }) => {
//   const result = await pool.query(
//     `
//     INSERT INTO notifications (user_id, type, message, metadata)
//     VALUES ($1, $2, $3, $4)
//     RETURNING *
//     `,
//     [userId, type, message, metadata]
//   );

//   // 🔔 REALTIME EMIT
//   const io = getIO();
//   io.to(`user:${userId}`).emit("notification:new", result.rows[0]);

//   return result.rows[0];
// };


import pool from "../config/db.js";
import { getIO } from "./socketEmitter.js";

export const createNotification = async ({
  userId,
  type,
  message,
  metadata = {},
}) => {

    console.log("🔔 createNotification called with:", {
    userId,
    type,
    message,
    metadata,
  });

  if (!userId) {
    console.error("❌ Notification skipped: userId is missing");
    return null;
  }
  const result = await pool.query(
    `
    INSERT INTO notifications (user_id, type, message, metadata)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [userId, type, message, metadata]
  );

  const notification = result.rows[0];
  console.log("✅ Notification saved:", notification);
  // 🔔 REALTIME EMIT
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:new", notification);
  } catch (err) {
    console.error("Socket emit failed", err.message);
  }
console.log("📡 Emitted realtime notification to:", `user:${userId}`);
  return notification;
};
