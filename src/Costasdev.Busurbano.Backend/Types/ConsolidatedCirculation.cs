namespace Costasdev.Busurbano.Backend.Types;

public class ConsolidatedCirculation
{
    public required string Line { get; set; }
    public required string Route { get; set; }

    public ScheduleData? Schedule { get; set; }
    public RealTimeData? RealTime { get; set; }
}

public class RealTimeData
{
    public required int Minutes { get; set; }
    public required int Distance { get; set; }
    public required RealTimeConfidence Confidence { get; set; }
}

public class ScheduleData
{
    public bool Running { get; set; }
    public required int Minutes { get; set; }
    public required string ServiceId { get; set; }
    public required string TripId { get; set; }
}

public enum RealTimeConfidence
{
    NotApplicable = 0,
    Low = 1,
    High = 2
}
