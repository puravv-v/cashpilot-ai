function RiskCard({
  risk,
  currentCash,
  projectedLowestBalance,
}) {
  const percentage =
    currentCash > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (projectedLowestBalance / currentCash) * 100
          )
        )
      : 0;

  return (
    <section className="risk-banner">

      <div className="risk-main">

        <div className="risk-status">
          <div className="risk-symbol">!</div>

          <div>
            <div className="risk-title-row">
              <h2>Critical cash-flow pressure</h2>

              <span className="severity-badge">
                {risk.severity}
              </span>
            </div>

            <p>{risk.message}</p>
          </div>
        </div>

        <div className="risk-date">
          <span>Risk date</span>
          <strong>{risk.riskDate}</strong>
        </div>

      </div>

      <div className="risk-bottom">

        <div className="risk-stat">
          <span>Projected balance</span>
          <strong>
            ₹{Number(projectedLowestBalance).toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="risk-stat">
          <span>Primary cause</span>
          <strong>{risk.primaryCause}</strong>
        </div>

        <div className="risk-meter">
          <div className="meter-label">
            <span>Remaining cash buffer</span>
            <strong>{percentage.toFixed(0)}%</strong>
          </div>

          <div className="meter-track">
            <div
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

      </div>

    </section>
  );
}

export default RiskCard;