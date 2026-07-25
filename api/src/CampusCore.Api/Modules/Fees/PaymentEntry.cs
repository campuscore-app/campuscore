namespace CampusCore.Api.Modules.Fees;

public enum PaymentMode
{
    Cash,
    Cheque,
    BankTransfer,
    Upi,
}

/// <summary>One historical payment against a fee record — the audit
/// trail behind FeeRecord.AmountPaid, so the running total is never just
/// a trusted number with nothing backing it.</summary>
public class PaymentEntry
{
    public int Id { get; set; }

    public int FeeRecordId { get; set; }
    public FeeRecord? FeeRecord { get; set; }

    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public PaymentMode Mode { get; set; }
}
