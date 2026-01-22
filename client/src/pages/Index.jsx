import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  Users,
  Plus,
  Calendar,
  BarChart3,
  Search,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import StatCard from "../components/StatCard";
import WorkspaceCard from "../components/WorkspaceCard";
import CreateWorkspaceCard from "../components/CreateWorkspaceCard";
import QuickActionCard from "../components/QuickActionCard";
import SectionHeader from "../components/SectionHeader";

const Index = () => {
const { getToken, isLoaded, isSignedIn } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [stats, setStats] = useState({
    total_tasks: 0,
    completed: 0,
    in_progress: 0,
    team_members: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  /* =========================
     FETCH WORKSPACES
  ========================= */
  const fetchWorkspaces = async () => {
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:5000/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
      setWorkspaces([]);
    }
  };

  /* =========================
     FETCH GLOBAL STATS
  ========================= */
  const fetchStats = async () => {
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:5000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data?.stats) {
        setStats({
          total_tasks: data.stats.total_tasks ?? 0,
          completed: data.stats.completed ?? 0,
          in_progress:
            (data.stats.total_tasks ?? 0) -
            (data.stats.completed ?? 0),
          team_members: data.stats.team_members ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  /* =========================
     CREATE WORKSPACE
  ========================= */
  const createWorkspace = async () => {
    const name = prompt("Enter workspace name");
    if (!name) return;

    try {
      setCreating(true);
      const token = await getToken();

      await fetch("http://localhost:5000/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      await fetchWorkspaces();
    } catch (err) {
      console.error("Create workspace failed", err);
    } finally {
      setCreating(false);
    }
  };

  /* =========================
     INIT LOAD (FIXED)
  ========================= */
  useEffect(() => {
  if (!isLoaded || !isSignedIn) return;

  const load = async () => {
    setLoading(true);

    await fetchStats();
    await fetchWorkspaces();

    setLoading(false);
  };

  load();
}, [isLoaded, isSignedIn]);


  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 md:px-6 py-8">
        {/* Hero */}
        <HeroSection />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Target} value={stats.total_tasks} label="Total Tasks" />
          <StatCard icon={CheckCircle} value={stats.completed} label="Completed" />
          <StatCard icon={Clock} value={stats.in_progress} label="In Progress" />
          <StatCard icon={Users} value={stats.team_members} label="Team Members" />
        </div>

        {/* Workspaces */}
        <section className="mb-10">
          <SectionHeader
            icon={Users}
            title="My Workspaces"
            action={
              <button
                onClick={createWorkspace}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {creating ? "Creating..." : "Create Workspace"}
              </button>
            }
          />

          {loading ? (
            <p className="text-muted-foreground">Loading workspaces...</p>
          ) : workspaces.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first workspace to get started
              </p>
              <button onClick={createWorkspace} className="btn-glow">
                + Create Workspace
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((ws, index) => (
                <WorkspaceCard
                  key={ws.workspace_id}
                  workspace={ws}
                  delay={index * 100}
                />
              ))}
              <CreateWorkspaceCard
                onClick={createWorkspace}
                delay={workspaces.length * 100}
              />
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <SectionHeader icon={Sparkles} title="Quick Actions" />
          <div className="grid md:grid-cols-3 gap-6">
            <QuickActionCard
              to="/calendar"
              icon={Calendar}
              title="Calendar"
              description="View tasks by date"
            />
            <QuickActionCard
              to="/dashboard"
              icon={BarChart3}
              title="Global Dashboard"
              description="Analytics & insights"
            />
            <QuickActionCard
              to="/search"
              icon={Search}
              title="Search"
              description="Find anything fast"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
