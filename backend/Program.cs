using InstrumentDashboard.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<IMarketDataService>(serviceProvider =>
{
    var environment = serviceProvider.GetRequiredService<IHostEnvironment>();
    var csvPath = Path.Combine(environment.ContentRootPath, "Data", "market_data.csv");
    return new MarketDataService(csvPath);
});

var app = builder.Build();

app.UseCors("Frontend");
app.MapControllers();

app.Run();
