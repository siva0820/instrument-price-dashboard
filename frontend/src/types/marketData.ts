export type PricePoint = {
  date: string;
  price: number;
};

export type PriceSeriesResponse = {
  ticker: string;
  prices: PricePoint[];
};

export type InstrumentStats = {
  ticker: string;
  totalReturnPercent: number;
  dailyVolatilityPercent: number;
  maxDrawdownPercent: number;
};
