import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { InstrumentStats, PriceSeriesResponse } from './types/marketData';

const apiMocks = vi.hoisted(() => ({
  getInstruments: vi.fn(),
  getPrices: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock('./api/marketDataApi', () => apiMocks);

vi.mock('./components/PriceChart', () => ({
  PriceChart: ({ series, loading }: { series: PriceSeriesResponse[]; loading: boolean }) => (
    <div data-testid="price-chart">
      {loading ? 'Loading chart' : series.map((item) => item.ticker).join(', ')}
    </div>
  ),
}));

const instruments = ['TICK0001', 'TICK0002', 'TICK0003', 'TICK0004'];

function priceSeries(ticker: string): PriceSeriesResponse {
  return {
    ticker,
    prices: [
      { date: '2026-01-01', price: 100 },
      { date: '2026-01-02', price: 102 },
    ],
  };
}

function stats(ticker: string): InstrumentStats {
  return {
    ticker,
    totalReturnPercent: 2,
    dailyVolatilityPercent: 1,
    maxDrawdownPercent: -0.5,
  };
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    apiMocks.getInstruments.mockReset().mockResolvedValue(instruments);
    apiMocks.getPrices.mockReset().mockImplementation((ticker: string) =>
      Promise.resolve(priceSeries(ticker)),
    );
    apiMocks.getStats.mockReset().mockImplementation((ticker: string) =>
      Promise.resolve(stats(ticker)),
    );
  });

  it('loads instruments and displays data for the first ticker', async () => {
    render(<App />);

    expect(await screen.findByText('4 instruments · 2 days')).toBeInTheDocument();
    expect(screen.getByTestId('price-chart')).toHaveTextContent('TICK0001');
    expect(screen.getByText('2.00%')).toBeInTheDocument();
    expect(apiMocks.getPrices).toHaveBeenCalledWith(
      'TICK0001',
      expect.any(AbortSignal),
    );
    expect(apiMocks.getStats).toHaveBeenCalledWith(
      'TICK0001',
      expect.any(AbortSignal),
    );
  });

  it('limits comparison to three selected instruments', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('1/3');
    await user.click(screen.getByRole('button', { name: /TICK0002/ }));
    await user.click(screen.getByRole('button', { name: /TICK0003/ }));

    expect(await screen.findByText('3/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TICK0004/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Unselect TICK0002' }));

    expect(await screen.findByText('2/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TICK0004/ })).toBeEnabled();
  });

  it('filters instruments case-insensitively and shows an empty state', async () => {
    const user = userEvent.setup();
    render(<App />);
    const selector = (await screen.findByText('Choose up to 3 tickers')).closest('section');

    expect(selector).not.toBeNull();
    const search = within(selector!).getByRole('textbox', { name: 'Search instruments' });
    await user.type(search, 'tick0002');

    expect(within(selector!).getByRole('button', { name: /TICK0002/ })).toBeInTheDocument();
    expect(within(selector!).queryByRole('button', { name: /TICK0001/ })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'missing');
    expect(within(selector!).getByText('No tickers match your search.')).toBeInTheDocument();
  });

  it('shows an error banner when the instrument request fails', async () => {
    apiMocks.getInstruments.mockRejectedValue(new Error('API unavailable'));

    render(<App />);

    const alert = await screen.findByRole('alert');
    await waitFor(() => expect(alert).toHaveTextContent('Unable to load market data.'));
    expect(alert).toHaveTextContent('API unavailable');
  });
});
