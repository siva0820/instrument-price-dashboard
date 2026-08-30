import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeProvider, useTheme } from './theme';
import { getInstruments, getPrices, getStats } from './api/marketDataApi';
import { InstrumentSelector } from './components/InstrumentSelector';
import { PriceChart } from './components/PriceChart';
import { StatsPanel } from './components/StatsPanel';
import type {
  InstrumentStats,
  PriceSeriesResponse,
} from './types/marketData';
import './styles.css';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function AppContent() {
  const [instruments, setInstruments] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [priceSeries, setPriceSeries] = useState<PriceSeriesResponse[]>([]);
  const [statsList, setStatsList] = useState<InstrumentStats[] | null>(null);
  const [loadingInstruments, setLoadingInstruments] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const priceCacheRef = useRef<Record<string, PriceSeriesResponse>>({});
  const statsCacheRef = useRef<Record<string, InstrumentStats>>({});
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const controller = new AbortController();

    async function loadInstruments() {
      setLoadingInstruments(true);
      setError(null);

      try {
        const result = await getInstruments(controller.signal);
        setInstruments(result);
        if (result.length > 0) {
          setSelectedTickers([result[0]]);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingInstruments(false);
        }
      }
    }

    loadInstruments();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSelectedData() {
      if (selectedTickers.length === 0) {
        setPriceSeries([]);
        setStatsList(null);
        return;
      }

      setLoadingData(true);
      setError(null);

      try {
        const [series, stats] = await Promise.all([
          Promise.all(
            selectedTickers.map(async (ticker) => {
              const cached = priceCacheRef.current[ticker];
              if (cached) return cached;

              const result = await getPrices(ticker, controller.signal);
              priceCacheRef.current[ticker] = result;
              return result;
            }),
          ),
          Promise.all(
            selectedTickers.map(async (ticker) => {
              const cached = statsCacheRef.current[ticker];
              if (cached) return cached;

              const result = await getStats(ticker, controller.signal);
              statsCacheRef.current[ticker] = result;
              return result;
            }),
          ),
        ]);

        setPriceSeries(series);
        setStatsList(stats);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setError(getErrorMessage(error));
          setPriceSeries([]);
          setStatsList(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingData(false);
        }
      }
    }

    void loadSelectedData();
    return () => controller.abort();
  }, [selectedTickers]);

  const filteredInstruments = useMemo(() => {
    const query = search.trim().toUpperCase();
    return query
      ? instruments.filter((ticker) => ticker.includes(query))
      : instruments;
  }, [instruments, search]);

  function toggleTicker(ticker: string) {
    setSelectedTickers((current) => {
      if (current.includes(ticker)) {
        return current.filter((item) => item !== ticker);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, ticker];
    });
  }

  const lineColors = ['#2563eb', '#0f766e', '#9333ea'];
  const observationCount = priceSeries[0]?.prices.length;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Market Data</p>
          <h1>Instrument Price Dashboard</h1>
          <p className="subtitle">
            Explore 30-day price history, key statistics, and compare up to three instruments.
          </p>
        </div>
        <div className="header-actions">
          <div className="status-chip">
            {instruments.length || '—'} instruments
            {observationCount ? ` · ${observationCount} days` : ''}
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <strong>Unable to load market data.</strong>
          <span>{error} Make sure the API is running on localhost:5058.</span>
        </div>
      )}

      <div className="dashboard-grid">
        <InstrumentSelector
          instruments={filteredInstruments}
          selectedTickers={selectedTickers}
          search={search}
          onSearchChange={setSearch}
          onToggleTicker={toggleTicker}
          loading={loadingInstruments}
        />

        <section className="content-column">
          <section className="panel chart-panel">
            <div className="panel-heading chart-heading">
              <div className="chart-heading-content">
                <p className="eyebrow">30-day price history</p>

                {priceSeries.length > 0 && (
                  <div className="chart-chips chart-chips-inline">
                    {priceSeries.map((item, index) => {
                      const color = lineColors[index % lineColors.length];
                      return (
                        <div
                          className="chart-chip compact"
                          key={item.ticker}
                          style={{ borderColor: color }}
                        >
                          <span className="chip-swatch" style={{ background: color }} />
                          <span className="chip-label">{item.ticker}</span>
                          <button
                            type="button"
                            className="chip-remove"
                            aria-label={`Unselect ${item.ticker}`}
                            onClick={() => toggleTicker(item.ticker)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <PriceChart series={priceSeries} loading={loadingData} />
          </section>

          <section className="stats-section">
            <div className="section-heading">
                <p className="eyebrow">Computed statistics</p>
            </div>
            <StatsPanel stats={statsList} loading={loadingData} />
          </section>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
