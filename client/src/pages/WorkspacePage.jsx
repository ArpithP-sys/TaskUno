import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  Folder,
  Users,
  Activity,
  BarChart3,
  Plus,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const WorkspacePage = () => {
  const { slug } = useParams();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);

  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  /* ================= FETCH PROJECTS ================= */
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `http://localhost:5000/api/workspaces/${slug}/projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setWorkspace(data.workspace);
      setProjects(data.projects || []);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH MEMBERS ================= */
  const fetchMembers = async (workspaceId) => {
    const token = await getToken();
    const res = await fetch(
      `http://localhost:5000/api/workspaces/${workspaceId}/members`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMembers(await res.json());
  };

  /* ================= FETCH ACTIVITY ================= */
  const fetchActivity = async (workspaceId) => {
    const token = await getToken();
    const res = await fetch(
      `http://localhost:5000/api/activity/workspace/${workspaceId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setActivities(await res.json());
  };

  /* ================= USER ROLE ================= */
const myRole = useMemo(() => {
  if (!user || members.length === 0) return "MEMBER";

  const me = members.find(
    (m) => m.email === user.primaryEmailAddress?.emailAddress
  );

  // ✅ UI role mapping
  if (me?.role === "OWNER") return "ADMIN";
  return me?.role || "MEMBER";
}, [members, user]);


  /* ================= CREATE PROJECT ================= */
  const createProject = async () => {
    const name = prompt("Enter project name");
    if (!name) return;

    const token = await getToken();
    await fetch(
      `http://localhost:5000/api/workspaces/${slug}/projects`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }
    );
    fetchProjects();
  };
//   const exitWorkspace = async () => {
//   if (!window.confirm("Are you sure you want to exit this workspace?")) return;

//   const token = await getToken();

//   await fetch(
//     `http://localhost:5000/api/workspaces/${workspace.id}/exit`,
//     {
//       method: "DELETE",
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );

//   // redirect to home
//   window.location.href = "/";
// };
// ✅ ADD: DELETE WORKSPACE (OWNER ONLY)
const deleteWorkspace = async () => {
  if (!window.confirm("This will permanently delete the workspace. Continue?"))
    return;

  const token = await getToken();

  await fetch(
    `http://localhost:5000/api/workspaces/${workspace.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  navigate("/", { replace: true });
};


  /* ================= INVITES ================= */
  const generateInviteLink = async () => {
    try {
      setInviteLoading(true);
      const token = await getToken();
      const res = await fetch(
        `http://localhost:5000/api/workspaces/${workspace.id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "MEMBER" }),
        }
      );
      const data = await res.json();
      setInviteLink(data.inviteLink || "");
    } finally {
      setInviteLoading(false);
    }
  };

  const fetchInvites = async () => {
    const token = await getToken();
    const res = await fetch(
      `http://localhost:5000/api/workspaces/${workspace.id}/invites`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setInvites(await res.json());
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    fetchProjects();
  }, [slug]);

  useEffect(() => {
    if (workspace?.id) {
      fetchMembers(workspace.id);
      fetchActivity(workspace.id);
    }
  }, [workspace]);

  useEffect(() => {
    if (workspace?.id && (myRole === "ADMIN" || myRole === "OWNER")) {
      fetchInvites();
    }
  }, [workspace, myRole]);

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="empty-state">
        <Activity className="w-10 h-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{workspace.name}</h1>
          <p className="page-subtitle">Role: {myRole}</p>
        </div>

        <Link
          to={`/workspace/${slug}/dashboard`}
          className="btn-secondary flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Workspace Dashboard
        </Link>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PROJECTS */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Folder className="w-5 h-5 text-primary" />
              Projects
            </h3>
              {myRole === "MEMBER" && (
  <button
    onClick={async () => {
      if (!window.confirm("Are you sure you want to leave this workspace?"))
        return;

      const token = await getToken();

      await fetch(
        `http://localhost:5000/api/workspaces/${workspace.id}/leave`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // redirect to home
    navigate("/", { replace: true });
    }}
    className="btn-danger"
  >
    Exit Workspace
  </button>
)}
{(myRole === "ADMIN" || myRole === "OWNER") && (
  <button
    onClick={deleteWorkspace}
    className="btn-danger"
  >
    Delete Workspace
  </button>
)}
            {(myRole === "ADMIN" || myRole === "OWNER") && (
              <button onClick={createProject} className="btn-glow text-sm">
                <Plus className="w-4 h-4 mr-1" />
                New Project
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <p className="text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/workspace/${slug}/project/${p.id}`}
                  state={{  workspaceId: workspace.id, members }}
                  className="list-item"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">

          {/* INVITE */}
          {(myRole === "ADMIN" || myRole === "OWNER") && (
            <div className="glass-card p-6">
              <h3 className="flex items-center gap-2 font-semibold mb-4">
                <LinkIcon className="w-5 h-5 text-primary" />
                Invite Members
              </h3>

              <button
                onClick={generateInviteLink}
                disabled={inviteLoading}
                className="btn-secondary w-full mb-3"
              >
                {inviteLoading ? "Generating..." : "Generate Invite Link"}
              </button>

              {inviteLink && (
                <div className="flex items-center gap-2">
                  <input
                    value={inviteLink}
                    readOnly
                    className="input-glass flex-1 text-sm"
                  />
                <button
  onClick={() => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }}
  className="btn-glow px-3 relative"
>
  <Copy className="w-4 h-4" />

  {copied && (
    <span className="absolute -top-7 right-0 text-xs bg-black text-white px-2 py-1 rounded">
      Copied!
    </span>
  )}
</button>

                </div>
              )}
            </div>
          )}

          {/* MEMBERS */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 font-semibold mb-4">
              <Users className="w-5 h-5 text-primary" />
              Members
            </h3>

            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    {m.full_name?.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{m.full_name}</p>
                   <p className="text-muted-foreground">
  {m.role === "OWNER" ? "ADMIN" : m.role}
</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 font-semibold mb-4">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>

            {activities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="activity-item">
                    <p className="text-sm">
                      <span className="font-medium">{a.full_name}</span>{" "}
                      <span className="text-muted-foreground">
                        {a.message} 
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
