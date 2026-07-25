using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Students;

public class UpdateStudentRequestValidator : AbstractValidator<UpdateStudentRequest>
{
    public UpdateStudentRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Student name is required.");
        RuleFor(x => x.RollNo).NotEmpty().WithMessage("Roll number is required.");
        RuleFor(x => x.ClassName).NotEmpty().WithMessage("Class is required.");
        RuleFor(x => x.Section).NotEmpty().WithMessage("Section is required.");
        RuleFor(x => x.GuardianName).NotEmpty().WithMessage("Guardian name is required.");
        RuleFor(x => x.Contact).NotEmpty().WithMessage("Contact number is required.").MustBeValidPhone();
    }
}
