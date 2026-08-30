type InstrumentSelectorProps = {
  instruments: string[];
  selectedTickers: string[];
  search: string;
  onSearchChange: (value: string) => void;
  onToggleTicker: (ticker: string) => void;
  loading: boolean;
};

export function InstrumentSelector({
  instruments,
  selectedTickers,
  search,
  onSearchChange,
  onToggleTicker,
  loading,
}: InstrumentSelectorProps) {
  return (
    <section className="panel instrument-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Instruments</p>
          <h5>Choose up to 3 tickers</h5>
        </div>
        <span className="selection-count">{selectedTickers.length}/3</span>
      </div>

      <label className="search-field">
        <span>Search ticker</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="e.g. TICK0001"
          aria-label="Search instruments"
        />
      </label>

      <div className="instrument-list" aria-live="polite">
        {loading ? (
          <div className="empty-state">Loading instruments…</div>
        ) : instruments.length === 0 ? (
          <div className="empty-state">No tickers match your search.</div>
        ) : (
          instruments.map((ticker) => {
            const selected = selectedTickers.includes(ticker);
            const disabled = !selected && selectedTickers.length >= 3;

            return (
              <button
                type="button"
                key={ticker}
                className={`ticker-row ${selected ? 'selected' : ''}`}
                onClick={() => onToggleTicker(ticker)}
                disabled={disabled}
                aria-pressed={selected}
              >
                <div className="ticker-left">
                  <div className="ticker-avatar"><strong>{ticker}</strong></div>
                  <div className="ticker-meta">
                    <span className="ticker-sub">Equity</span>
                  </div>
                </div>
                <span className="ticker-action">
                  {selected ? 'Selected' : disabled ? 'Limit reached' : 'Add'}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
