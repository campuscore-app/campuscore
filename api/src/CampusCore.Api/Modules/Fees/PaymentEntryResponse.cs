namespace CampusCore.Api.Modules.Fees;

public class PaymentEntryResponse
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public PaymentMode Mode { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
}
