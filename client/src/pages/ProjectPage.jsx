import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  ClipboardList,
  Plus,
  Calendar,
  User,
  MessageCircle,
  Trash2,
  Send,
} from "lucide-react";
import { connectSocket } from "../utils/socket";
const ProjectPage = () => {
  const { projectId } = useParams();
  const location = useLocation();

  // 🔹 ADDITION 1: highlight task id
  const highlightTaskId = location.state?.highlightTaskId;
    const workspaceId = location.state?.workspaceId;
  // const members = location.state?.members || [];
  const [members, setMembers] = useState([]);
  const { getToken } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  /* ================= FETCH TASKS ================= */
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `http://localhost:5000/api/projects/${projectId}/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(await res.json());
    } finally {
      setLoading(false);
    }
  };

  /* ================= COMMENTS ================= */
  const fetchComments = async (taskId) => {
    const token = await getToken();
    const res = await fetch(
      `http://localhost:5000/api/comments/task/${taskId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setComments(await res.json());
    setActiveTaskId(taskId);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const token = await getToken();

    await fetch(
      `http://localhost:5000/api/comments/task/${activeTaskId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      }
    );

    setNewComment("");
    fetchComments(activeTaskId);
  };

  /* ================= TASK ACTIONS ================= */
  const createTask = async () => {
    const title = prompt("Enter task title");
    if (!title) return;

    const token = await getToken();
    await fetch(
      `http://localhost:5000/api/projects/${projectId}/tasks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      }
    );

    fetchTasks();
  };

  const updateStatus = async (taskId, status) => {
    const token = await getToken();
    await fetch(
      `http://localhost:5000/api/tasks/${taskId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  const updateDueDate = async (taskId, dueDate) => {
    const token = await getToken();
    await fetch(
      `http://localhost:5000/api/tasks/${taskId}/due-date`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ due_date: dueDate || null }),
      }
    );
    fetchTasks();
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    const token = await getToken();

    await fetch(
      `http://localhost:5000/api/tasks/${taskId}/delete`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
    );

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const assignTask = async (taskId, userId) => {
    if (!userId) return;
    const token = await getToken();

    await fetch(
      `http://localhost:5000/api/tasks/${taskId}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assigned_to: userId }),
      }
    );

    fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // 🔹 ADDITION 2: auto-scroll to highlighted task
  useEffect(() => {
    if (highlightTaskId && tasks.length > 0) {
      setTimeout(() => {
        document
          .getElementById(`task-${highlightTaskId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightTaskId, tasks]);

useEffect(() => {
  if (!workspaceId) return;

  const fetchMembers = async () => {
    const token = await getToken();

    const res = await fetch(
      `http://localhost:5000/api/workspaces/${workspaceId}/members`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    console.log("👥 Workspace members:", data);
    setMembers(data);
  };

  fetchMembers();
}, [workspaceId]);

/* =====================================================
     🔥 REALTIME SOCKET — ONLY ADDITION STARTS HERE
  ===================================================== */
useEffect(() => {
  if (!workspaceId) return;

  const socket = connectSocket();

  console.log("📡 Joining workspace room:", workspaceId);
  socket.emit("join-workspace", { workspaceId });

  socket.on("task:updated", ({ taskId, type }) => {
    console.log("🔄 Realtime update:", type, taskId);

    fetchTasks();

    if (activeTaskId === taskId) {
      fetchComments(taskId);
    }
  });

  return () => {
    socket.off("task:updated");
  };
}, [workspaceId, activeTaskId]);

    /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Project Tasks
          </h1>
          <p className="page-subtitle">Manage and track project tasks</p>
        </div>

        <button onClick={createTask} className="btn-glow flex items-center gap-1">
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* TASK LIST */}
      <div className="glass-card p-6 space-y-4">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <ClipboardList className="w-10 h-10 opacity-50 mb-2" />
            <p className="text-muted-foreground">No tasks yet</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}

              // 🔹 ADDITION 3: id + highlight UI
              id={`task-${t.id}`}
              className={`glass-card-hover p-5 ${
                highlightTaskId === t.id
                  ? "ring-2 ring-primary animate-pulse"
                  : ""
              }`}
            >

              {/* TASK HEADER */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {t.title}
                  </h3>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <input
                        type="date"
                        className="input-glass text-sm"
                        value={t.due_date ? t.due_date.split("T")[0] : ""}
                        onChange={(e) =>
                          updateDueDate(t.id, e.target.value)
                        }
                      />
                    </span>

                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {t.assignee_name || "Unassigned"}
                    </span>
                  </div>
                </div>

                <span className={`status-${t.status?.toLowerCase()}`}>
                  {t.status}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/30">
                <select
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value)}
                  className="select-glass text-sm"
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>

                <select
                  value={t.assigned_to || ""}
                  onChange={(e) => assignTask(t.id, e.target.value)}
                  className="select-glass text-sm"
                >
                  <option value="">Assign user</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => fetchComments(t.id)}
                  className="btn-ghost flex items-center gap-1 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Comments
                </button>

                <button
                  onClick={() => deleteTask(t.id)}
                  className="btn-danger ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* COMMENTS */}
              {activeTaskId === t.id && (
                <div className="mt-4 pt-4 border-t border-border/30 space-y-3 animate-fade-in">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex gap-3 bg-secondary/30 p-3 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                          {c.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {c.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="input-glass flex-1 text-sm"
                      onKeyDown={(e) =>
                        e.key === "Enter" && addComment()
                      }
                    />
                    <button onClick={addComment} className="btn-glow px-4">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
