using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Attendance;

public class BulkAttendanceRequestValidator : AbstractValidator<BulkAttendanceRequest>
{
    public BulkAttendanceRequestValidator()
    {
        RuleFor(x => x.Date).MustNotBeFutureDate("Date");
        RuleFor(x => x.Entries).NotEmpty().WithMessage("At least one student is required.");
        RuleForEach(x => x.Entries)
            .ChildRules(entry =>
            {
                entry.RuleFor(e => e.StudentName).NotEmpty().WithMessage("Student name is required.");
                entry.RuleFor(e => e.ClassName).NotEmpty().WithMessage("Class is required.");
            });
    }
}
