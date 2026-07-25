namespace CampusCore.Api.Modules.Fees;

public class RecordPaymentRequest
{
    public decimal Amount { get; set; }
    public PaymentMode Mode { get; set; }
}
