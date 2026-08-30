import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PriceSeriesResponse } from '../types/marketData';

type PriceChartProps = {
  series: PriceSeriesResponse[];
  loading: boolean;
};

type ChartRow = {
  date: string;
  [ticker: string]: string | number;
};

const lineColors = ['#2563eb', '#0f766e', '#9333ea'];

function mergeSeries(series: PriceSeriesResponse[]): ChartRow[] {
  const rows = new Map<string, ChartRow>();

  for (const item of series) {
    for (const point of item.prices) {
      const row = rows.get(point.date) ?? { date: point.date };
      row[item.ticker] = point.price;
      rows.set(point.date, row);
    }
  }

  return Array.from(rows.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export function PriceChart({ series, loading }: PriceChartProps) {
  if (loading) {
    return <div className="chart-placeholder">Loading price history…</div>;
  }

  if (series.length === 0) {
    return (
      <div className="chart-placeholder">
        Select a ticker to view its 30-day price history.
      </div>
    );
  }

  const chartData = mergeSeries(series);

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            minTickGap={28}
            tickLine={false}
          />
          <YAxis
            width={70}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
            domain={['auto', 'auto']}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
          />
          {series.length > 1 && <Legend />}
          {series.map((item, index) => (
            <Line
              key={item.ticker}
              type="monotone"
              dataKey={item.ticker}
              name={item.ticker}
              stroke={lineColors[index % lineColors.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
