using FluentValidation;

namespace CampusCore.Api.Common;

/// <summary>Reusable FluentValidation rules for the business rules that
/// show up in more than one module — mirrors
/// web/src/shared/validation/rules.ts so the same rule has the same name
/// and the same behavior on both the frontend and the backend. The
/// frontend checks exist for instant UX feedback; these exist because the
/// frontend check is not security — anyone can call the API directly.</summary>
public static class ValidationRuleExtensions
{
    private static readonly System.Text.RegularExpressions.Regex PhonePattern = new(@"^\d{10}$");

    public static IRuleBuilderOptions<T, string> MustBeValidPhone<T>(this IRuleBuilder<T, string> rule) =>
        rule.Matches(PhonePattern).WithMessage("Enter a valid 10-digit contact number.");

    public static IRuleBuilderOptions<T, DateOnly> MustNotBeFutureDate<T>(
        this IRuleBuilder<T, DateOnly> rule,
        string fieldName
    ) =>
        rule.Must(date => date <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage($"{fieldName} cannot be a future date.");

    public static IRuleBuilderOptions<T, decimal> MustBePositive<T>(
        this IRuleBuilder<T, decimal> rule,
        string fieldName
    ) => rule.GreaterThan(0).WithMessage($"{fieldName} must be a positive number.");
}
