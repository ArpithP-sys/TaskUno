import pool from "../config/db.js";

export const logActivity = async ({
  workspaceId,
  userId,
  entityType,
  entityId,
  action,
  metadata = {},
}) => {
  await pool.query(
    `
    INSERT INTO activity_logs
    (workspace_id, user_id, entity_type, entity_id, action, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      workspaceId,
      userId,
      entityType,
      entityId,
      action,
      metadata, // ✅ now always object
    ]
  );
};
