namespace CampusCore.Api.Modules.Fees;

public class UpdateFeeRequest
{
    public int StudentId { get; set; }
    public decimal AmountDue { get; set; }
    public DateOnly DueDate { get; set; }
}
