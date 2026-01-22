import cron from "node-cron";
import pool from "../config/db.js";
import { sendEmail } from "../utils/emailSender.js";
import { taskActivityTemplate } from "../utils/emailTemplates.js";

// Runs every day at 9 AM
// cron.schedule("* * * *", async () => {
//   console.log("⏰ Running task reminder cron...");

//   try {
//     const result = await pool.query(`
//       SELECT
//         t.id,
//         t.title,
//         t.due_date,
//         t.status,
//         u.email,
//         u.full_name,
//         p.name AS project_name,
//         w.name AS workspace_name
//       FROM tasks t
//       JOIN users u ON t.assigned_to = u.id
//       JOIN projects p ON t.project_id = p.id
//       JOIN workspaces w ON p.workspace_id = w.id
//       WHERE
//         t.is_deleted = false
//         AND t.status != 'DONE'
//         AND t.due_date IS NOT NULL
//         AND t.due_date <= CURRENT_DATE + INTERVAL '1 day'
//     `);

//     for (const task of result.rows) {
//       await sendEmail({
//         to: task.email,
//         subject: `⏰ Task Reminder: ${task.title}`,
//         html: taskActivityTemplate({
//           actor: "TaskUno Bot 🤖",
//           action: "reminds you about a task",
//           taskTitle: task.title,
//           projectName: task.project_name,
//           workspaceName: task.workspace_name,
//           dueDate: task.due_date,
//         }),
//       });
//     }

//     console.log(`✅ ${result.rows.length} reminder emails sent`);
//   } catch (err) {
//     console.error("❌ Reminder cron failed:", err);
//   }
// });
