function MetricCard({
  label,
  value,
  prefix = "",
  icon,
  description,
  positive,
  danger,
}) {
  const icons = {
    wallet: "▣",
    "arrow-up": "↗",
    "arrow-down": "↘",
    warning: "!",
  };

  return (
    <div className={`metric-card ${danger ? "metric-danger" : ""}`}>

      <div className="metric-top">
        <span className="metric-label">
          {label}
        </span>

        <div className={`metric-icon ${icon}`}>
          {icons[icon]}
        </div>
      </div>

      <div className="metric-value">
        {prefix}
        {Number(value || 0).toLocaleString("en-IN")}
      </div>

      <div className={`metric-description ${positive ? "positive" : ""}`}>
        {description}
      </div>

    </div>
  );
}

export default MetricCard;