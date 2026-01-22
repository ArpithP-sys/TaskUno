
const FeaturePill = ({ icon: Icon, text }) => {
  return (
    <div className="feature-pill">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
};

export default FeaturePill;
