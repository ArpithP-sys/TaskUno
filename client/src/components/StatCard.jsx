const StatCard = ({ icon: Icon, value, label }) => {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between">
        <Icon className="w-6 h-6 text-primary" />
      </div>

      <div className="stat-card-value">
        {value}
      </div>

      <div className="stat-card-label">
        {label}
      </div>
    </div>
  );
};

export default StatCard;
