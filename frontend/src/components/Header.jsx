function Header({ onRefresh, refreshing }) {
  return (
    <header className="topbar">

      <div className="brand">
        <div className="brand-mark">CP</div>

        <div>
          <div className="brand-name">CashPilot</div>
          <div className="brand-tagline">
            Cash flow intelligence
          </div>
        </div>
      </div>

      <div className="topbar-actions">

        <div className="connection-status">
          <span />
          Connected
        </div>

        <button
          className="refresh-button"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <span className={refreshing ? "spin" : ""}>↻</span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

    </header>
  );
}

export default Header;