using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Fees;

public class UpdateFeeRequestValidator : AbstractValidator<UpdateFeeRequest>
{
    public UpdateFeeRequestValidator()
    {
        RuleFor(x => x.StudentId).GreaterThan(0).WithMessage("A student must be selected.");
        RuleFor(x => x.AmountDue).MustBePositive("Amount due");
    }
}
