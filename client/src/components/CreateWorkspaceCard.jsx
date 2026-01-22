import { Plus } from "lucide-react";

const CreateWorkspaceCard = ({ onClick, delay = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="w-full h-full min-h-[200px] bg-card/50 border-2 border-dashed border-border hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
        Create new workspace
      </span>
    </button>
  );
};

export default CreateWorkspaceCard;
