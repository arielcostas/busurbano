﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Costasdev.ServiceViewer.Data.Gtfs;

[Table("calendar")]
public class GtfsCalendar
{
    [Key]
    [Column("service_id")]
    [MaxLength(32)]
    public string ServiceId { get; set; } = null!;

    [Column("monday")]
    public bool Monday { get; set; }

    [Column("tuesday")]
    public bool Tuesday { get; set; }

    [Column("wednesday")]
    public bool Wednesday { get; set; }

    [Column("thursday")]
    public bool Thursday { get; set; }

    [Column("friday")]
    public bool Friday { get; set; }

    [Column("saturday")]
    public bool Saturday { get; set; }

    [Column("sunday")]
    public bool Sunday { get; set; }

    [Column("start_date")]
    public DateOnly StartDate { get; set; }

    [Column("end_date")]
    public DateOnly EndDate { get; set; }
}
