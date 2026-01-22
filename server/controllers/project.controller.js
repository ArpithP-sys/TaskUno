import pool from "../config/db.js";

/* =========================
   GET PROJECTS BY WORKSPACE SLUG
========================= */
export const getProjectsByWorkspaceSlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const workspaceResult = await pool.query(
      "SELECT * FROM workspaces WHERE slug = $1",
      [slug]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const workspace = workspaceResult.rows[0];

    const projectsResult = await pool.query(
      "SELECT * FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC",
      [workspace.id]
    );

    res.json({
      workspace,
      projects: projectsResult.rows,
    });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

/* =========================
   CREATE PROJECT (USING SLUG)
========================= */
export const createProject = async (req, res) => {
  try {
    // 🔐 AUTH GUARD (IMPORTANT)
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { slug } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name required" });
    }

    // 🔹 Get user
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // 🔹 Get workspace by slug
    const workspaceResult = await pool.query(
      "SELECT id FROM workspaces WHERE slug = $1",
      [slug]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const workspaceId = workspaceResult.rows[0].id;

    // 🔹 Create project
    const projectResult = await pool.query(
      `
      INSERT INTO projects (workspace_id, name, description, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [workspaceId, name, description || null, userId]
    );

    res.status(201).json(projectResult.rows[0]);

  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
};
export const getProjectsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const result = await pool.query(
      `
      SELECT id, name
      FROM projects
      WHERE workspace_id = $1
      ORDER BY created_at DESC
      `,
      [workspaceId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};
