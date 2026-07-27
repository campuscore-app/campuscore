using FluentValidation;

namespace CampusCore.Api.Modules.Auth;

public class SetupRequestValidator : AbstractValidator<SetupRequest>
{
    public SetupRequestValidator()
    {
        RuleFor(x => x.SchoolName).NotEmpty().WithMessage("School name is required.").MaximumLength(200).WithMessage("School name must be 200 characters or fewer.");

        RuleFor(x => x.Email).NotEmpty().WithMessage("Email is required.").EmailAddress().WithMessage("Enter a valid email address.");

        // A slightly stronger minimum than regular login (6) — this is the
        // one account that can do everything, worth nudging toward a
        // better password at the moment it's actually created.
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password is required.").MinimumLength(8).WithMessage("Password must be at least 8 characters.");

        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}
