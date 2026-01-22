import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const CreateTaskModal = ({ open, onClose, onCreated }) => {
  const { getToken } = useAuth();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      const token = await getToken();
      const res = await fetch("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(await res.json());
    };

    fetchProjects();
  }, [open]);

  if (!open) return null;

  const createTask = async () => {
    if (!title.trim() || !projectId) return;

    try {
      setLoading(true);
      const token = await getToken();

      await fetch(
        `http://localhost:5000/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            priority,
            due_date: dueDate || null,
          }),
        }
      );

      onCreated();
      onClose();

      setTitle("");
      setPriority("MEDIUM");
      setProjectId("");
      setDueDate("");
    } catch (err) {
      console.error("Create task error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="glass-card w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X />
        </button>

        <h2 className="text-lg font-semibold mb-4">Create Task</h2>

        <div className="space-y-4">
          <input
            className="input-glass w-full"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* ✅ DUE DATE INPUT */}
          <input
            type="date"
            className="input-glass w-full"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <select
            className="input-glass w-full"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.workspace_name} → {p.name}
              </option>
            ))}
          </select>

          <select
            className="input-glass w-full"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <button
            onClick={createTask}
            disabled={loading}
            className="btn-glow w-full"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
