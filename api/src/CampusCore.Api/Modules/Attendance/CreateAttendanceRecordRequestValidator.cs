using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Attendance;

public class CreateAttendanceRecordRequestValidator : AbstractValidator<CreateAttendanceRecordRequest>
{
    public CreateAttendanceRecordRequestValidator()
    {
        RuleFor(x => x.StudentName).NotEmpty().WithMessage("Student name is required.");
        RuleFor(x => x.ClassName).NotEmpty().WithMessage("Class is required.");
        // Business rule: you can't take attendance for a day that hasn't happened yet.
        RuleFor(x => x.Date).MustNotBeFutureDate("Date");
    }
}
