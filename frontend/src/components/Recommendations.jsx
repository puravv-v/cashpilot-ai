function Recommendations({ recommendations }) {
  return (
    <section className="recommendations-section">

      <div className="section-title">
        <div>
          <p className="card-label">NEXT STEPS</p>
          <h2>Recommended actions</h2>
        </div>

        <p>
          Prioritized actions based on your cash position
        </p>
      </div>

      <div className="recommendation-grid">

        {recommendations.map((item, index) => (
          <div
            className="recommendation-card"
            key={index}
          >

            <div className="recommendation-top">

              <span
                className={`priority-badge ${item.priority?.toLowerCase()}`}
              >
                {item.priority}
              </span>

              <span className="recommendation-number">
                0{index + 1}
              </span>

            </div>

            <h3>{item.title}</h3>

            <p className="recommendation-reason">
              {item.reason}
            </p>

            <div className="recommendation-action">
              <span>→</span>
              <p>{item.action}</p>
            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default Recommendations;