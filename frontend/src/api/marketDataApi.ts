import type {
  InstrumentStats,
  PriceSeriesResponse,
} from '../types/marketData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5058';

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getInstruments(signal?: AbortSignal) {
  return getJson<string[]>('/api/instruments', signal);
}

export function getPrices(ticker: string, signal?: AbortSignal) {
  return getJson<PriceSeriesResponse>(
    `/api/prices/${encodeURIComponent(ticker)}`,
    signal,
  );
}

export function getStats(ticker: string, signal?: AbortSignal) {
  return getJson<InstrumentStats>(
    `/api/prices/${encodeURIComponent(ticker)}/stats`,
    signal,
  );
}
