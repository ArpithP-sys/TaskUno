import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dot,
  ListTodo,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CalendarPage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  /* ================= FETCH TASKS ================= */
  const fetchCalendarTasks = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      const res = await fetch(
        `http://localhost:5000/api/calendar?start=${start
          .toISOString()
          .slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, [currentDate]);

  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return tasks.filter(t => t.due_date?.startsWith(dateStr));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const priorityColor = (p) =>
    p === "HIGH" ? "bg-destructive"
    : p === "MEDIUM" ? "bg-amber-500"
    : "bg-emerald-500";

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
            <CalendarDays className="w-6 h-6 text-primary" />
            Calendar
          </h1>
          <p className="page-subtitle">Track tasks by due date</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="btn-secondary px-3"
          >
            <ChevronLeft />
          </button>

          <div className="glass-card px-4 py-2 min-w-[170px] text-center font-semibold">
            {monthNames[month]} {year}
          </div>

          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="btn-secondary px-3"
          >
            <ChevronRight />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-glow px-4"
          >
            Today
          </button>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {dayNames.map(d => (
            <div key={d} className="text-center text-sm text-muted-foreground font-medium">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} />;

            const dayTasks = getTasksForDay(day);
            const today = isToday(day);

            return (
              <div
                key={day}
                className={`rounded-xl border p-2 min-h-[110px]
                  ${dayTasks.length ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-border/30"}
                  ${today ? "ring-2 ring-primary" : ""}
                `}
              >
                <span className={`text-sm font-semibold ${today ? "text-primary" : ""}`}>
                  {day}
                </span>

                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 3).map(t => (
                    <div
                      key={t.task_id}
                      onClick={() =>
                        navigate(
                          `/workspace/${t.workspace_slug}/project/${t.project_id}`,
                          { state: { highlightTaskId: t.task_id } }
                        )
                      }
                      className="cursor-pointer hover:bg-primary/10 rounded px-1 py-[2px]"
                    >
                      <div className="flex items-center gap-1">
                        <Dot className={`w-5 h-5 ${priorityColor(t.priority)}`} />
                        <span className="text-xs truncate font-medium">
                          {t.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-5">
                        {t.workspace_name} → {t.project_name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TASK LIST */}
      <div className="glass-card p-6">
        <h3 className="flex items-center gap-2 font-semibold mb-4">
          <ListTodo className="w-5 h-5 text-primary" />
          Tasks This Month
          <span className="badge-primary ml-2">{tasks.length}</span>
        </h3>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {tasks.map(t => (
            <div
              key={t.task_id}
              onClick={() =>
                navigate(
                  `/workspace/${t.workspace_slug}/project/${t.project_id}`,
                  { state: { highlightTaskId: t.task_id } }
                )
              }
              className="list-item cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${priorityColor(t.priority)}`} />
                <span className="font-medium">{t.title}</span>
                <span className="text-sm text-muted-foreground">
                  — {t.workspace_name} → {t.project_name}
                </span>
              </div>

              <span className={`status-${t.status?.toLowerCase()}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
