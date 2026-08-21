function InsightsPanel({
  risk,
  largestExpense,
  incomeItems,
  projectedLowestBalance,
  currentCash,
}) {
  const incoming = incomeItems[0];

  return (
    <section className="insights-section">

      <div className="section-title">
        <div>
          <p className="card-label">WHAT MATTERS</p>
          <h2>Financial insights</h2>
        </div>

        <p>
          Key signals from your current cash position
        </p>
      </div>

      <div className="insights-grid">

        <div className="insight-card critical">

          <div className="insight-icon">!</div>

          <div>
            <span className="insight-type">
              CASH PRESSURE
            </span>

            <h3>
              Your cash buffer is getting tight
            </h3>

            <p>
              Cash is projected to fall to{" "}
              <strong>
                ₹{projectedLowestBalance.toLocaleString("en-IN")}
              </strong>{" "}
              from your current{" "}
              <strong>
                ₹{currentCash.toLocaleString("en-IN")}
              </strong>.
            </p>
          </div>

        </div>

        {largestExpense && (
          <div className="insight-card">

            <div className="insight-icon purple">
              ↘
            </div>

            <div>
              <span className="insight-type">
                LARGEST OUTFLOW
              </span>

              <h3>
                {largestExpense.name}
              </h3>

              <p>
                Your largest upcoming expense is{" "}
                <strong>
                  ₹{largestExpense.value.toLocaleString("en-IN")}
                </strong>.
                Make sure the cash is available before the due date.
              </p>
            </div>

          </div>
        )}

        {incoming && (
          <div className="insight-card">

            <div className="insight-icon green">
              ↗
            </div>

            <div>
              <span className="insight-type">
                EXPECTED INFLOW
              </span>

              <h3>
                {incoming.name}
              </h3>

              <p>
                An incoming payment of{" "}
                <strong>
                  ₹{incoming.value.toLocaleString("en-IN")}
                </strong>{" "}
                can materially improve short-term liquidity.
              </p>
            </div>

          </div>
        )}

        {risk && (
          <div className="insight-card">

            <div className="insight-icon orange">
              ◷
            </div>

            <div>
              <span className="insight-type">
                WATCH CLOSELY
              </span>

              <h3>
                {risk.riskDate}
              </h3>

              <p>
                This is the point where the current projection
                reaches its lowest cash balance.
              </p>
            </div>

          </div>
        )}

      </div>

    </section>
  );
}

export default InsightsPanel;