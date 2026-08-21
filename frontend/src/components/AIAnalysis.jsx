function AIAnalysis({ analysis }) {
  return (
    <section className="ai-section">

      <div className="ai-header">

        <div className="ai-brand">
          <div className="ai-mark">✦</div>

          <div>
            <span>CASHPILOT AI</span>
            <h2>Financial analysis</h2>
          </div>
        </div>

        <span className="ai-badge">
          AI INSIGHT
        </span>

      </div>

      <div className="ai-summary">
        <span>EXECUTIVE SUMMARY</span>
        <p>{analysis.summary}</p>
      </div>

      <div className="ai-grid">

        <div className="ai-item">
          <span>WHY THIS MATTERS</span>
          <p>{analysis.riskExplanation}</p>
        </div>

        <div className="ai-item priority">
          <span>PRIORITY ACTION</span>
          <p>{analysis.priorityAction}</p>
        </div>

        <div className="ai-item">
          <span>OUTLOOK</span>
          <p>{analysis.outlook}</p>
        </div>

      </div>

    </section>
  );
}

export default AIAnalysis;