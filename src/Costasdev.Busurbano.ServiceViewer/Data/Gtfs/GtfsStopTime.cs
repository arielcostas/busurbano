using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Costasdev.ServiceViewer.Data.Gtfs;

[Table("stop_times")]
[PrimaryKey(nameof(TripId), nameof(StopSequence))]
public class GtfsStopTime
{
    [Column("trip_id")]
    [ForeignKey("TripId")]
    [MaxLength(32)]
    public string TripId { get; set; } = null!;

    [ForeignKey(nameof(TripId))] public GtfsTrip GtfsTrip { get; set; } = null!;

    [Column("arrival_time")] public string ArrivalTime { get; set; }
    public TimeOnly ArrivalTimeOnly => TimeOnly.Parse(ArrivalTime);

    [Column("departure_time")] public string DepartureTime { get; set; }
    public TimeOnly DepartureTimeOnly => TimeOnly.Parse(DepartureTime);

    [Column("stop_id")]
    [ForeignKey(nameof(GtfsStop))]
    [MaxLength(32)]
    public required string StopId { get; set; }

    [ForeignKey(nameof(StopId))] public GtfsStop GtfsStop { get; set; } = null!;

    [Column("stop_sequence")] public int StopSequence { get; set; } = 0;

    // [Column("pickup_type")]
    // public int? PickupType { get; set; }
    //
    // [Column("drop_off_type")]
    // public int? DropOffType { get; set; }

    [Column("shape_dist_traveled")] public double? ShapeDistTraveled { get; set; } = null!;
}
