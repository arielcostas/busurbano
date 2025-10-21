﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Costasdev.ServiceViewer.Data.Gtfs;

[Table("agencies")]
public class GtfsAgency
{
    [Key]
    [Column("agency_id")]
    [MaxLength(255)]
    public required string Id { get; set; }

    [Column("agency_name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("agency_url")]
    [MaxLength(255)]
    public string Url { get; set; } = string.Empty;

    [Column("agency_timezone")]
    [MaxLength(50)]
    public string Timezone { get; set; } = string.Empty;

    [Column("agency_lang")]
    [MaxLength(5)]
    public string Language { get; set; } = string.Empty;

    [Column("agency_phone")]
    [MaxLength(30)]
    public string? Phone { get; set; } = string.Empty;

    [Column("agency_email")]
    [MaxLength(255)]
    public string? Email { get; set; } = string.Empty;

    [Column("agency_fare_url")]
    [MaxLength(255)]
    public string? FareUrl { get; set; } = string.Empty;
}
