import type { InstrumentStats } from '../types/marketData';

type StatsPanelProps = {
  stats: InstrumentStats[] | null;
  loading: boolean;
};

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function StatsPanel({ stats, loading }: StatsPanelProps) {
  if (loading) {
      return (
        <div className="stats-table-wrap">
          <div className="stats-headers">
            <div className="col name-col">Name</div>
            <div className="col">Total return</div>
            <div className="col">Daily volatility</div>
            <div className="col">Max drawdown</div>
          </div>

          {[0, 1, 2].map((i) => (
            <div className="stats-row-card" key={i}>
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ))}
        </div>
      );
  }
  if (!stats || stats.length === 0) return 'No instrument selected';

  return (
      <div className="stats-table-wrap">
        <div className="stats-headers">
          <div className="col name-col">Name</div>
          <div className="col">Total return</div>
          <div className="col">Daily volatility</div>
          <div className="col">Max drawdown</div>
        </div>

        {stats.slice(0, 3).map((s) => (
          <div className="stats-row-card" key={s.ticker}>
            <div className="name-col name-value"><strong>{s.ticker}</strong></div>

            <div className={`stat-value ${s.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(s.totalReturnPercent)}
            </div>

            <div className="stat-value">
              {formatPercent(s.dailyVolatilityPercent)}
            </div>

            <div className="stat-value negative">
              {formatPercent(s.maxDrawdownPercent)}
            </div>
          </div>
        ))}
      </div>
    );
}
