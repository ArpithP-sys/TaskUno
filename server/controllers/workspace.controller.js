import pool from "../config/db.js";
import slugify from "slugify";
import crypto from "crypto";
import { sendWorkspaceInviteEmail } from "../utils/emailSender.js";
export const createWorkspace = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const clerkUserId = req.auth.userId;

    const userResult = await client.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const slugCheck = await client.query(
        "SELECT 1 FROM workspaces WHERE slug = $1",
        [slug]
      );
      if (slugCheck.rows.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    await client.query("BEGIN");

    const workspaceResult = await client.query(
      `INSERT INTO workspaces (name, slug, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, slug, userId]
    );

    const workspace = workspaceResult.rows[0];

    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'OWNER')`,
      [workspace.id, userId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Workspace created successfully",
      workspace,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create workspace error:", error);
    res.status(500).json({ message: "Failed to create workspace" });
  } finally {
    client.release();
  }
};
export const getUserWorkspaces = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    // 1️⃣ Ensure user exists
    let userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    let userId;

    if (userResult.rows.length === 0) {
      const email =
        req.auth.sessionClaims?.email ||
        req.auth.sessionClaims?.primaryEmailAddress ||
        "user@unknown.com";

      const fullName =
        req.auth.sessionClaims?.name || "New User";

      const insertUser = await pool.query(
        `
        INSERT INTO users (clerk_user_id, email, full_name)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [clerkUserId, email, fullName]
      );

      userId = insertUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // 2️⃣ Fetch workspaces
    const workspacesResult = await pool.query(
      `
      SELECT
        w.id AS workspace_id,
        w.name,
        w.slug,
        wm.role
      FROM workspace_members wm
      JOIN workspaces w ON wm.workspace_id = w.id
      WHERE wm.user_id = $1
      ORDER BY w.created_at DESC
      `,
      [userId]
    );

    res.json(workspacesResult.rows);

  } catch (error) {
    console.error("Get workspaces error:", error);
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
};

export const getWorkspaceEmails = async (workspaceId) => {
  const result = await pool.query(
    `
    SELECT u.email
    FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = $1
    `,
    [workspaceId]
  );

  return result.rows.map(r => r.email);
};
export const getWorkspaceEmailsBySlug = async (slug) => {
  const result = await pool.query(
    `
    SELECT u.email
    FROM workspace_members wm
    JOIN workspaces w ON wm.workspace_id = w.id
    JOIN users u ON wm.user_id = u.id
    WHERE w.slug = $1
    `,
    [slug]
  );

  return result.rows.map(r => r.email);
};
export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        wm.role
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = $1
      `,
      [workspaceId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get workspace members error:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
};
/* ======================
   CREATE INVITE
====================== */
export const createWorkspaceInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { role = "MEMBER" } = req.body;

    const clerkUserId = req.auth.userId;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    const userId = userResult.rows[0].id;

    const token = crypto.randomUUID();

    await pool.query(
      `
      INSERT INTO workspace_invites (workspace_id, role, token, created_by)
      VALUES ($1, $2, $3, $4)
      `,
      [workspaceId, role, token, userId]
    );

    const inviteLink = `http://localhost:5173/invite/${token}`;

    res.json({ inviteLink });
  } catch (err) {
    console.error("Invite create error:", err);
    res.status(500).json({ message: "Failed to create invite" });
  }
};


/* ======================
   LIST INVITES
====================== */
export const getWorkspaceInvites = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        role,
        token,
        expires_at,
        created_at,
        expires_at < NOW() AS is_expired
      FROM workspace_invites
      WHERE workspace_id = $1
      ORDER BY created_at DESC
      `,
      [workspaceId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get invites error:", err);
    res.status(500).json({ message: "Failed to fetch invites" });
  }
};

/* ======================
   REVOKE INVITE
====================== */
export const revokeWorkspaceInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    await pool.query(
      "DELETE FROM workspace_invites WHERE id = $1",
      [inviteId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Revoke invite error:", err);
    res.status(500).json({ message: "Failed to revoke invite" });
  }
};

/* ======================
   ACCEPT INVITE
====================== */
export const acceptWorkspaceInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const clerkUserId = req.auth.userId;

    // 1️⃣ Ensure user exists
    let userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    let userId;

    if (userResult.rows.length === 0) {
      const email =
        req.auth.sessionClaims?.email ||
        req.auth.sessionClaims?.primaryEmailAddress ||
        "invited@user.com";

      const fullName =
        req.auth.sessionClaims?.name || "Invited User";

      const newUser = await pool.query(
        `
        INSERT INTO users (clerk_user_id, email, full_name)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [clerkUserId, email, fullName]
      );

      userId = newUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // 2️⃣ Validate invite
    const inviteResult = await pool.query(
      `
      SELECT wi.workspace_id, wi.role, w.slug
      FROM workspace_invites wi
      JOIN workspaces w ON wi.workspace_id = w.id
      WHERE wi.token = $1
        AND (wi.expires_at IS NULL OR wi.expires_at > NOW())
      `,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: "Invite expired or invalid" });
    }

    const invite = inviteResult.rows[0];

    // 3️⃣ Add member
    await pool.query(
      `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      `,
      [invite.workspace_id, userId, invite.role]
    );

    // 4️⃣ Delete invite
    await pool.query(
      "DELETE FROM workspace_invites WHERE token = $1",
      [token]
    );

    // ✅ RETURN SLUG (THIS FIXES EVERYTHING)
    res.json({
      success: true,
      workspaceId: invite.workspace_id,
      workspaceSlug: invite.slug,
    });
    console.log("Invite accepted:", {
  clerkUserId,
  userId,
  workspaceId: invite.workspace_id,
  workspaceSlug: invite.slug,
});

  } catch (err) {
    console.error("Accept invite error:", err);
    res.status(500).json({ error: "Failed to join workspace" });
  }
};

/* =========================
   DELETE WORKSPACE (OWNER)
========================= */
export const deleteWorkspace = async (req, res) => {
  const {  workspaceId } = req.params;
  const clerkUserId = req.auth.userId;

  try {
    // 1️⃣ Get internal user id
    const userRes = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = userRes.rows[0].id;

    // 2️⃣ Allow OWNER OR ADMIN
    const roleRes = await pool.query(
      `
      SELECT role
      FROM workspace_members
      WHERE workspace_id = $1
        AND user_id = $2
        AND role IN ('OWNER', 'ADMIN')
      LIMIT 1
      `,
      [workspaceId, userId]
    );

    if (roleRes.rows.length === 0) {
      return res.status(403).json({
        message: "Only OWNER or ADMIN can delete workspace",
      });
    }

    // 🚨 IMPORTANT: NO MORE ROLE CHECK HERE

    await pool.query("BEGIN");

    // 3️⃣ delete tasks
    await pool.query(
      `
      DELETE FROM tasks
      WHERE project_id IN (
        SELECT id FROM projects WHERE workspace_id = $1
      )
      `,
      [workspaceId]
    );

    // 4️⃣ delete projects
    await pool.query(
      "DELETE FROM projects WHERE workspace_id = $1",
      [workspaceId]
    );

    // 5️⃣ delete members
    await pool.query(
      "DELETE FROM workspace_members WHERE workspace_id = $1",
      [workspaceId]
    );

    // 6️⃣ delete invites
    await pool.query(
      "DELETE FROM workspace_invites WHERE workspace_id = $1",
      [workspaceId]
    );

    // 7️⃣ delete activity logs
    await pool.query(
      "DELETE FROM activity_logs WHERE workspace_id = $1",
      [workspaceId]
    );

    // 8️⃣ delete workspace
    await pool.query(
      "DELETE FROM workspaces WHERE id = $1",
      [workspaceId]
    );

    await pool.query("COMMIT");

    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Delete workspace failed:", err);
    res.status(500).json({ message: "Failed to delete workspace" });
  }
};


export const inviteMember = async (req, res) => {
  res.status(501).json({
    message: "Invite feature will be implemented later",
  });
};

export const exitWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const clerkUserId = req.auth.userId;

    // get user
    const userRes = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userRes.rows[0].id;

    // check role
    const roleRes = await pool.query(
      `
      SELECT role
      FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
      `,
      [workspaceId, userId]
    );

    if (roleRes.rows.length === 0) {
      return res.status(400).json({ message: "Not a workspace member" });
    }

    const role = roleRes.rows[0].role;

    // ❌ OWNER cannot exit
    if (role === "OWNER") {
      return res.status(400).json({
        message: "Owner cannot exit workspace. Transfer ownership or delete workspace.",
      });
    }

    // delete membership
    await pool.query(
      `
      DELETE FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
      `,
      [workspaceId, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Exit workspace error:", err);
    res.status(500).json({ message: "Failed to exit workspace" });
  }
}; 

