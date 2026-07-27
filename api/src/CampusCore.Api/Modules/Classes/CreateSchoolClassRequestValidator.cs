using FluentValidation;

namespace CampusCore.Api.Modules.Classes;

public class CreateSchoolClassRequestValidator : AbstractValidator<CreateSchoolClassRequest>
{
    public CreateSchoolClassRequestValidator()
    {
        RuleFor(x => x.ClassName).NotEmpty().WithMessage("Class name is required.").MaximumLength(50).WithMessage("Class name must be 50 characters or fewer.");

        RuleFor(x => x.Section).NotEmpty().WithMessage("Section is required.").MaximumLength(20).WithMessage("Section must be 20 characters or fewer.");
    }
}
