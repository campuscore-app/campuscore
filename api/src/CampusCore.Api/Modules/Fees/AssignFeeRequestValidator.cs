using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Fees;

/// <summary>Structural validation only. The rule that needs current
/// system state — amount due can't drop below what's already been paid —
/// lives in FeeManager, since only it knows the existing AmountPaid for
/// an edit (a new fee always starts at zero paid, so the rule is
/// meaningless on assignment).</summary>
public class AssignFeeRequestValidator : AbstractValidator<AssignFeeRequest>
{
    public AssignFeeRequestValidator()
    {
        RuleFor(x => x.StudentId).GreaterThan(0).WithMessage("A student must be selected.");
        RuleFor(x => x.AmountDue).MustBePositive("Amount due");
    }
}
