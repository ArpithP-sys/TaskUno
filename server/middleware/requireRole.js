// import pool from "../config/db.js";

// export const requireWorkspaceRole = (allowedRoles = []) => {
//   return async (req, res, next) => {
//     try {
//       const clerkUserId = req.auth?.userId;
//       const { workspaceId } = req.params;

//       if (!clerkUserId) {
//         return res.status(401).json({ message: "Unauthorized" });
//       }

//       const userResult = await pool.query(
//         "SELECT id FROM users WHERE clerk_user_id = $1",
//         [clerkUserId]
//       );

//       if (userResult.rows.length === 0) {
//         return res.status(401).json({ message: "User not found" });
//       }

//       const userId = userResult.rows[0].id;

//       const memberResult = await pool.query(
//         `
//         SELECT role
//         FROM workspace_members
//         WHERE workspace_id = $1 AND user_id = $2
//         `,
//         [workspaceId, userId]
//       );

//       if (memberResult.rows.length === 0) {
//         return res.status(403).json({ message: "Not a workspace member" });
//       }

//       const role = memberResult.rows[0].role;

//       if (!allowedRoles.includes(role)) {
//         return res.status(403).json({
//           message: `Required role: ${allowedRoles.join(" or ")}`,
//         });
//       }

//       req.userId = userId;
//       req.workspaceRole = role;

//       next();
//     } catch (err) {
//       console.error("Role check error:", err);
//       res.status(500).json({ message: "Role check failed" });
//     }
//   };
// };
import pool from "../config/db.js";

export const requireWorkspaceRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const clerkUserId = req.auth?.userId;
      const { workspaceId } = req.params;

      if (!clerkUserId || !workspaceId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // get user id
      const userRes = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userRes.rows.length === 0) {
        return res.status(403).json({ message: "User not found" });
      }

      const userId = userRes.rows[0].id;

      // check role in workspace
      const roleRes = await pool.query(
        `
        SELECT role
        FROM workspace_members
        WHERE workspace_id = $1 AND user_id = $2
        `,
        [workspaceId, userId]
      );

      if (roleRes.rows.length === 0) {
        return res.status(403).json({ message: "Not a workspace member" });
      }

      const role = roleRes.rows[0].role;

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error("requireWorkspaceRole error:", err);
      res.status(500).json({ message: "Authorization failed" });
    }
  };
};
