import type { InstrumentStats } from '../types/marketData';

type StatsPanelProps = {
  stats: InstrumentStats | null;
  loading: boolean;
};

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function StatsPanel({ stats, loading }: StatsPanelProps) {
  if (loading) {
    return (
      <section className="stats-grid" aria-label="Loading statistics">
        {[0, 1, 2].map((item) => (
          <div className="stat-card skeleton" key={item} />
        ))}
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="stats-grid" aria-label={`${stats.ticker} statistics`}>
      <article className="stat-card">
        <span>Total return</span>
        <strong className={stats.totalReturnPercent >= 0 ? 'positive' : 'negative'}>
          {formatPercent(stats.totalReturnPercent)}
        </strong>
      </article>
      <article className="stat-card">
        <span>Daily volatility</span>
        <strong>{formatPercent(stats.dailyVolatilityPercent)}</strong>
      </article>
      <article className="stat-card">
        <span>Max drawdown</span>
        <strong className="negative">{formatPercent(stats.maxDrawdownPercent)}</strong>
      </article>
    </section>
  );
}
