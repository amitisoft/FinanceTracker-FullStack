using System.ComponentModel.DataAnnotations;

namespace FinanceTracker.Application.Reports.Queries;

public class GetNetWorthReportQuery
{
    [Required]
    public DateTime DateFrom { get; set; }

    [Required]
    public DateTime DateTo { get; set; }
}
