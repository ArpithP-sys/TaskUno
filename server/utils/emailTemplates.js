export const taskActivityTemplate = ({
  actor,
  action,
  taskTitle,
  projectName,
  workspaceName,
  status,
  dueDate,
}) => `
  <div style="font-family: Arial;">
    <h2>📌 Task Update in ${workspaceName}</h2>
    <p><strong>${actor}</strong> ${action}</p>

    <ul>
      <li><b>Task:</b> ${taskTitle}</li>
      <li><b>Project:</b> ${projectName}</li>
      ${status ? `<li><b>Status:</b> ${status}</li>` : ""}
      ${dueDate ? `<li><b>Due Date:</b> ${dueDate}</li>` : ""}
    </ul>

    <p style="color: gray;">
      — TaskUno Notification
    </p>
  </div>
`;
