import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#6366f1"];

const DashboardPage = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH DASHBOARD DATA
  ========================= */
  const fetchDashboard = async () => {
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:5000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);
 
  /* =========================
     LOADING / EMPTY STATES
  ========================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <p className="empty-state-text">No dashboard data available</p>
      </div>
    );
  }

  const { stats, priorityBreakdown, statusBreakdown } = data;

  const priorityData = priorityBreakdown.map((p) => ({
    name: p.priority,
    value: Number(p.count),
  }));

  const statusData = statusBreakdown.map((s) => ({
    status: s.status,
    count: Number(s.count),
  }));

  const statCards = [
    { label: "Total Tasks", value: stats.total_tasks, icon: "📋" },
    { label: "Due Today", value: stats.due_today, icon: "📅" },
    { label: "Overdue", value: stats.overdue, icon: "⚠️" },
    { label: "Completed", value: stats.completed, icon: "✅" },
    { label: "Assigned to Me", value: stats.assigned_to_me, icon: "👤" },
  ];

  return (
    <div className="animate-fade-in">
      {/* PAGE HEADER */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <span className="text-3xl">📊</span>
          Global Dashboard
        </h1>
        <p className="page-subtitle">
          Overview of all your tasks across workspaces
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger-children">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="glass-card-hover p-5 cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRIORITY PIE */}
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            🔥 Tasks by Priority
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={4}
                >
                  {priorityData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            📌 Tasks by Status
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-8 glass-card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h3>

        <div className="flex flex-wrap gap-3">
          <Link to="/calendar" className="btn-secondary">
            📅 View Calendar
          </Link>
          <Link to="/search" className="btn-secondary">
            🔍 Search Tasks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
