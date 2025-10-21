using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Costasdev.ServiceViewer.Data.Gtfs.Enums;

namespace Costasdev.ServiceViewer.Data.Gtfs;

[Table("stops")]
public class GtfsStop
{
    [Key]
    [Column("stop_id")]
    [MaxLength(32)]
    public required string Id { get; set; }

    [Column("stop_code")]
    [MaxLength(32)]
    public string Code { get; set; } = string.Empty;

    [Column("stop_name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("stop_desc")]
    [MaxLength(255)]
    public string? Description { get; set; }

    [Column("stop_lat")]
    public double Latitude { get; set; }

    [Column("stop_lon")]
    public double Longitude { get; set; }

    [Column("stop_url")]
    [MaxLength(255)]
    public string? Url { get; set; }

    [Column("stop_timezone")]
    [MaxLength(50)]
    public string? Timezone { get; set; }

    [Column("wheelchair_boarding")]
    public WheelchairBoarding WheelchairBoarding { get; set; } = WheelchairBoarding.Unknown;

    // [Column("location_type")]
    // public int LocationType { get; set; }
    //
    // [Column("parent_station")]
    // public int? ParentStationId { get; set; }
}
