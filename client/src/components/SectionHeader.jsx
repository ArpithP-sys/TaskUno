const SectionHeader = ({ icon: Icon, title, action }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-6 h-6 text-primary" />}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
};

export default SectionHeader;
