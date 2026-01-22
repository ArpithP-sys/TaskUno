import pool from "../config/db.js";

export const syncUser = async (req, res) => {
  try {
    const { clerkUserId, email, fullName, profileImage } = req.body;

    if (!clerkUserId || !email) {
      return res.status(400).json({ message: "Missing user data" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (existingUser.rows.length > 0) {
      return res.json(existingUser.rows[0]);
    }

    // Insert new user
    const newUser = await pool.query(
      `
      INSERT INTO users (clerk_user_id, email, full_name, profile_image)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [clerkUserId, email, fullName, profileImage]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "User sync failed" });
  }
};
