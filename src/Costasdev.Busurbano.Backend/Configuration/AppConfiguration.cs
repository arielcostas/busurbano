namespace Costasdev.Busurbano.Backend.Configuration;

public class AppConfiguration
{
    public required string VitrasaScheduleBasePath { get; set; }
    public required string RenfeScheduleBasePath { get; set; }

    public string OtpGeocodingBaseUrl { get; set; } = "https://planificador-rutas-api.vigo.org/v1";
    public string OtpPlannerBaseUrl { get; set; } = "https://planificador-rutas.vigo.org/otp/routers/default";

    // Default Routing Parameters
    public double WalkSpeed { get; set; } = 1.4;
    public int MaxWalkDistance { get; set; } = 1000;
    public int MaxWalkTime { get; set; } = 20;
    public int NumItineraries { get; set; } = 4;

    // Fare Configuration
    public double FareCashPerBus { get; set; } = 1.63;
    public double FareCardPerBus { get; set; } = 0.67;
}
