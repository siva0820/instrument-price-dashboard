using System.Globalization;
using InstrumentDashboard.Api.Models;

namespace InstrumentDashboard.Api.Services;

public sealed class MarketDataService : IMarketDataService
{
    private readonly IReadOnlyDictionary<string, IReadOnlyList<PricePoint>> _pricesByTicker;
    private readonly IReadOnlyList<string> _instruments;

    public MarketDataService(string csvPath)
    {
        if (!File.Exists(csvPath))
        {
            throw new FileNotFoundException("Market data CSV was not found.", csvPath);
        }

        var pricesByTicker = LoadCsv(csvPath);

        _pricesByTicker = pricesByTicker.ToDictionary(
            pair => pair.Key,
            pair => (IReadOnlyList<PricePoint>)pair.Value
                .OrderBy(point => point.Date)
                .ToArray(),
            StringComparer.OrdinalIgnoreCase);

        _instruments = _pricesByTicker.Keys
            .OrderBy(ticker => ticker, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public IReadOnlyList<string> GetInstruments() => _instruments;

    public PriceSeriesResponse? GetPrices(string ticker)
    {
        var normalizedTicker = NormalizeTicker(ticker);

        return _pricesByTicker.TryGetValue(normalizedTicker, out var prices)
            ? new PriceSeriesResponse(normalizedTicker, prices)
            : null;
    }

    public InstrumentStats? GetStats(string ticker)
    {
        var normalizedTicker = NormalizeTicker(ticker);

        if (!_pricesByTicker.TryGetValue(normalizedTicker, out var prices) || prices.Count == 0)
        {
            return null;
        }

        var firstPrice = (double)prices[0].Price;
        var lastPrice = (double)prices[^1].Price;
        var totalReturnPercent = ((lastPrice / firstPrice) - 1.0) * 100.0;

        var dailyReturns = new List<double>(Math.Max(0, prices.Count - 1));
        for (var i = 1; i < prices.Count; i++)
        {
            var previousPrice = (double)prices[i - 1].Price;
            var currentPrice = (double)prices[i].Price;
            dailyReturns.Add((currentPrice / previousPrice) - 1.0);
        }

        // Sample standard deviation (N - 1), expressed as a percentage.
        var dailyVolatilityPercent = CalculateSampleStandardDeviation(dailyReturns) * 100.0;

        var peak = (double)prices[0].Price;
        var maxDrawdown = 0.0;

        foreach (var point in prices)
        {
            var currentPrice = (double)point.Price;
            peak = Math.Max(peak, currentPrice);
            var drawdown = (currentPrice / peak) - 1.0;
            maxDrawdown = Math.Min(maxDrawdown, drawdown);
        }

        return new InstrumentStats(
            normalizedTicker,
            Round(totalReturnPercent),
            Round(dailyVolatilityPercent),
            Round(maxDrawdown * 100.0));
    }

    private static Dictionary<string, List<PricePoint>> LoadCsv(string csvPath)
    {
        var result = new Dictionary<string, List<PricePoint>>(StringComparer.OrdinalIgnoreCase);

        using var reader = new StreamReader(csvPath);
        var header = reader.ReadLine();

        if (header is null)
        {
            throw new InvalidDataException("Market data CSV is empty.");
        }

        string? line;
        var lineNumber = 1;

        while ((line = reader.ReadLine()) is not null)
        {
            lineNumber++;
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var columns = line.Split(',');
            if (columns.Length != 3)
            {
                throw new InvalidDataException($"Invalid CSV row at line {lineNumber}.");
            }

            if (!DateOnly.TryParseExact(
                    columns[0].Trim(),
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var date))
            {
                throw new InvalidDataException($"Invalid date at line {lineNumber}.");
            }

            var ticker = NormalizeTicker(columns[1]);
            if (string.IsNullOrWhiteSpace(ticker))
            {
                throw new InvalidDataException($"Missing ticker at line {lineNumber}.");
            }

            if (!decimal.TryParse(
                    columns[2].Trim(),
                    NumberStyles.Number,
                    CultureInfo.InvariantCulture,
                    out var price) || price <= 0)
            {
                throw new InvalidDataException($"Invalid price at line {lineNumber}.");
            }

            if (!result.TryGetValue(ticker, out var points))
            {
                points = new List<PricePoint>();
                result[ticker] = points;
            }

            points.Add(new PricePoint(date, price));
        }

        return result;
    }

    private static double CalculateSampleStandardDeviation(IReadOnlyList<double> values)
    {
        if (values.Count < 2)
        {
            return 0.0;
        }

        var mean = values.Average();
        var sumSquaredDifferences = values.Sum(value => Math.Pow(value - mean, 2));
        var variance = sumSquaredDifferences / (values.Count - 1);

        return Math.Sqrt(variance);
    }

    private static string NormalizeTicker(string ticker) => ticker.Trim().ToUpperInvariant();

    private static double Round(double value) => Math.Round(value, 4);
}
