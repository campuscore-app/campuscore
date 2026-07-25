using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Fees;

public class RecordPaymentRequestValidator : AbstractValidator<RecordPaymentRequest>
{
    public RecordPaymentRequestValidator()
    {
        RuleFor(x => x.Amount).MustBePositive("Payment amount");
    }
}
