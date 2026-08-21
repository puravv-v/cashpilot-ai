function ObligationsTable({ projection }) {
  return (
    <section className="table-section">

      <div className="section-title">
        <div>
          <p className="card-label">UPCOMING</p>
          <h2>Cash-flow events</h2>
        </div>

        <p>
          Your upcoming income and obligations
        </p>
      </div>

      <div className="table-card">

        <div className="table-header">
          <span>Date</span>
          <span>Description</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Projected balance</span>
        </div>

        {projection.map((item, index) => {
          const amount = Number(item.change);
          const isIncome = amount > 0;

          return (
            <div
              className="table-row"
              key={`${item.date}-${index}`}
            >

              <span className="date-cell">
                {new Date(item.date).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </span>

              <span className="description-cell">
                {item.description}
              </span>

              <span>
                <span
                  className={`type-badge ${
                    isIncome ? "income" : "expense"
                  }`}
                >
                  {isIncome ? "INCOME" : "EXPENSE"}
                </span>
              </span>

              <strong
                className={
                  isIncome
                    ? "amount-income"
                    : "amount-expense"
                }
              >
                {isIncome ? "+" : "-"}₹
                {Math.abs(amount).toLocaleString("en-IN")}
              </strong>

              <strong>
                ₹
                {Number(item.cashBalance).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>
          );
        })}

      </div>

    </section>
  );
}

export default ObligationsTable;