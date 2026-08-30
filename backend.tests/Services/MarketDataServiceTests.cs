using InstrumentDashboard.Api.Services;
using Xunit;

namespace InstrumentDashboard.Api.Tests.Services;

public sealed class MarketDataServiceTests
{
    [Fact]
    public void GetInstruments_ReturnsNormalizedTickersInAlphabeticalOrder()
    {
        using var csv = CsvFixture.Create(
            "2026-01-01,zeta,100",
            "2026-01-01,Alpha,100",
            "2026-01-01,beta,100");
        var service = new MarketDataService(csv.Path);

        var instruments = service.GetInstruments();

        Assert.Equal(["ALPHA", "BETA", "ZETA"], instruments);
    }

    [Fact]
    public void GetStats_CalculatesTotalReturnFromChronologicalEndpoints()
    {
        using var csv = CsvFixture.Create(
            "2026-01-03,TEST,120",
            "2026-01-01,TEST,100",
            "2026-01-02,TEST,110");
        var service = new MarketDataService(csv.Path);

        var stats = service.GetStats("TEST");

        Assert.NotNull(stats);
        Assert.Equal(20.0, stats.TotalReturnPercent);
    }

    [Fact]
    public void GetStats_UsesSampleStandardDeviationForDailyVolatility()
    {
        using var csv = CsvFixture.Create(
            "2026-01-01,TEST,100",
            "2026-01-02,TEST,110",
            "2026-01-03,TEST,99");
        var service = new MarketDataService(csv.Path);

        var stats = service.GetStats("TEST");

        Assert.NotNull(stats);
        Assert.Equal(14.1421, stats.DailyVolatilityPercent);
    }

    [Fact]
    public void GetStats_CalculatesLargestPeakToTroughDrawdown()
    {
        using var csv = CsvFixture.Create(
            "2026-01-01,TEST,100",
            "2026-01-02,TEST,120",
            "2026-01-03,TEST,90",
            "2026-01-04,TEST,110");
        var service = new MarketDataService(csv.Path);

        var stats = service.GetStats("TEST");

        Assert.NotNull(stats);
        Assert.Equal(-25.0, stats.MaxDrawdownPercent);
    }

    [Fact]
    public void GetStats_ReturnsZeroDrawdownForContinuouslyRisingPrices()
    {
        using var csv = CsvFixture.Create(
            "2026-01-01,TEST,100",
            "2026-01-02,TEST,110",
            "2026-01-03,TEST,120");
        var service = new MarketDataService(csv.Path);

        var stats = service.GetStats("TEST");

        Assert.NotNull(stats);
        Assert.Equal(0.0, stats.MaxDrawdownPercent);
    }

    [Fact]
    public void GetStats_ReturnsZeroMetricsForSinglePrice()
    {
        using var csv = CsvFixture.Create("2026-01-01,TEST,100");
        var service = new MarketDataService(csv.Path);

        var stats = service.GetStats("TEST");

        Assert.NotNull(stats);
        Assert.Equal(0.0, stats.TotalReturnPercent);
        Assert.Equal(0.0, stats.DailyVolatilityPercent);
        Assert.Equal(0.0, stats.MaxDrawdownPercent);
    }

    [Fact]
    public void GetPrices_SortsRowsByDate()
    {
        using var csv = CsvFixture.Create(
            "2026-01-03,TEST,120",
            "2026-01-01,TEST,100",
            "2026-01-02,TEST,110");
        var service = new MarketDataService(csv.Path);

        var result = service.GetPrices("TEST");

        Assert.NotNull(result);
        Assert.Equal(
            [new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 2), new DateOnly(2026, 1, 3)],
            result.Prices.Select(point => point.Date));
    }

    [Fact]
    public void TickerLookup_IsTrimmedAndCaseInsensitive()
    {
        using var csv = CsvFixture.Create("2026-01-01,test,100");
        var service = new MarketDataService(csv.Path);

        var result = service.GetPrices("  TeSt  ");

        Assert.NotNull(result);
        Assert.Equal("TEST", result.Ticker);
    }

    [Fact]
    public void UnknownTicker_ReturnsNull()
    {
        using var csv = CsvFixture.Create("2026-01-01,TEST,100");
        var service = new MarketDataService(csv.Path);

        Assert.Null(service.GetPrices("UNKNOWN"));
        Assert.Null(service.GetStats("UNKNOWN"));
    }

    [Theory]
    [InlineData("not-a-date,TEST,100")]
    [InlineData("2026-01-01,,100")]
    [InlineData("2026-01-01,TEST,not-a-price")]
    [InlineData("2026-01-01,TEST,0")]
    [InlineData("2026-01-01,TEST")]
    public void Constructor_RejectsMalformedRows(string row)
    {
        using var csv = CsvFixture.Create(row);

        var exception = Assert.Throws<InvalidDataException>(
            () => new MarketDataService(csv.Path));

        Assert.Contains("line 2", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class CsvFixture : IDisposable
    {
        private CsvFixture(string path)
        {
            Path = path;
        }

        public string Path { get; }

        public static CsvFixture Create(params string[] rows)
        {
            var path = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(),
                $"market-data-{Guid.NewGuid():N}.csv");
            File.WriteAllLines(path, ["date,ticker,price", .. rows]);
            return new CsvFixture(path);
        }

        public void Dispose()
        {
            File.Delete(Path);
        }
    }
}
