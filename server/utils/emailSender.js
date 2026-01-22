import nodemailer from "nodemailer";

console.log("📨 Email config loaded:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  passLength: process.env.SMTP_PASS?.length,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Gmail uses STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // 🔥 THIS FIXES THE ERROR
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  console.log("📤 Sending email to:", to);

  const info = await transporter.sendMail({
    from: `"TaskUno 🚀" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log("✅ Email sent:", info.messageId);
};
export const sendWorkspaceInviteEmail = async (to, inviteLink, workspaceName) => {
  await transporter.sendMail({
    from: `"TaskUno" <${process.env.EMAIL_USER}>`,
    to,
    subject: `You're invited to join ${workspaceName}`,
    html: `
      <h3>Workspace Invitation</h3>
      <p>You have been invited to join <b>${workspaceName}</b></p>
      <a href="${inviteLink}">Join Workspace</a>
      <p>This link may expire.</p>
    `
  });
};
