using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Staff;

public class UpdateStaffMemberRequestValidator : AbstractValidator<UpdateStaffMemberRequest>
{
    public UpdateStaffMemberRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Staff name is required.");
        RuleFor(x => x.Role).NotEmpty().WithMessage("Role is required.");
        RuleFor(x => x.Department).NotEmpty().WithMessage("Department is required.");
        RuleFor(x => x.Contact).NotEmpty().WithMessage("Contact number is required.").MustBeValidPhone();
        RuleFor(x => x.JoinedOn).MustNotBeFutureDate("Joined on");
    }
}
