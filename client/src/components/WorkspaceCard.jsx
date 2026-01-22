import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";

const WorkspaceCard = ({ workspace, delay = 0 }) => {
  if (!workspace) return null;

  const {
    name = "Untitled Workspace",
    slug,
    role = "MEMBER",
  } = workspace;

  if (!slug) return null;

  const initial = name.charAt(0).toUpperCase();

  // ✅ UI ROLE (OWNER → ADMIN)
  const displayRole = role === "OWNER" ? "ADMIN" : role;

  const roleStyles = {
    ADMIN: "bg-primary/20 text-primary border border-primary/30",
    MEMBER: "bg-accent/20 text-accent border border-accent/30",
  };

  return (
    <Link
      to={`/workspace/${slug}`}
      className="block animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-card border border-border rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 group h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {initial}
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              roleStyles[displayRole] || roleStyles.MEMBER
            }`}
          >
            {displayRole}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>

        <div className="flex items-center gap-2 mt-3 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm">Workspace</span>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Open workspace
          </span>
          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
};

export default WorkspaceCard;
