import { useEffect, useMemo, useState } from 'react';
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

export default function App() {
  const [instruments, setInstruments] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [priceSeries, setPriceSeries] = useState<PriceSeriesResponse[]>([]);
  const [primaryStats, setPrimaryStats] = useState<InstrumentStats | null>(null);
  const [loadingInstruments, setLoadingInstruments] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setPrimaryStats(null);
        return;
      }

      setLoadingData(true);
      setError(null);

      try {
        const [series, stats] = await Promise.all([
          Promise.all(
            selectedTickers.map((ticker) => getPrices(ticker, controller.signal)),
          ),
          getStats(selectedTickers[0], controller.signal),
        ]);

        setPriceSeries(series);
        setPrimaryStats(stats);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setError(getErrorMessage(error));
          setPriceSeries([]);
          setPrimaryStats(null);
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

  const primaryTicker = selectedTickers[0];

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
        <div className="status-chip">200 instruments · 30 days</div>
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
              <div>
                <p className="eyebrow">30-day price history</p>
                <h2>
                  {selectedTickers.length > 0
                    ? selectedTickers.join(' vs ')
                    : 'No instrument selected'}
                </h2>
              </div>
              {selectedTickers.length > 1 && (
                <span className="comparison-badge">Comparison mode</span>
              )}
            </div>

            <PriceChart series={priceSeries} loading={loadingData} />
          </section>

          <section className="stats-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Computed statistics</p>
                <h2>{primaryTicker ?? 'Select an instrument'}</h2>
              </div>
              {selectedTickers.length > 1 && (
                <p>Statistics shown for the first selected ticker.</p>
              )}
            </div>
            <StatsPanel stats={primaryStats} loading={loadingData} />
          </section>
        </section>
      </div>
    </main>
  );
}
