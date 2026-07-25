using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Staff;

public class CreateStaffMemberRequestValidator : AbstractValidator<CreateStaffMemberRequest>
{
    public CreateStaffMemberRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Staff name is required.");
        RuleFor(x => x.Role).NotEmpty().WithMessage("Role is required.");
        RuleFor(x => x.Department).NotEmpty().WithMessage("Department is required.");
        RuleFor(x => x.Contact).NotEmpty().WithMessage("Contact number is required.").MustBeValidPhone();
        // Business rule: can't record someone as having joined a date that hasn't happened yet.
        RuleFor(x => x.JoinedOn).MustNotBeFutureDate("Joined on");
    }
}
