import { Link } from "react-router-dom";

const QuickActionCard = ({ to, icon: Icon, title, description, variant = "primary", delay = 0 }) => {
  const iconStyles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning"
  };

  return (
    <Link 
      to={to}
      className="block animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-card border border-border rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 group cursor-pointer">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${iconStyles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default QuickActionCard;
