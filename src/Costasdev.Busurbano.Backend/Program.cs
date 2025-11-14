using Costasdev.Busurbano.Backend.Configuration;
using Costasdev.Busurbano.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AppConfiguration>(builder.Configuration.GetSection("App"));

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ShapeTraversalService>();

var app = builder.Build();

app.MapControllers();

app.Run();
