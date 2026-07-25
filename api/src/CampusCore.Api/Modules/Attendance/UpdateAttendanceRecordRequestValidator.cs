using CampusCore.Api.Common;
using FluentValidation;

namespace CampusCore.Api.Modules.Attendance;

public class UpdateAttendanceRecordRequestValidator : AbstractValidator<UpdateAttendanceRecordRequest>
{
    public UpdateAttendanceRecordRequestValidator()
    {
        RuleFor(x => x.StudentName).NotEmpty().WithMessage("Student name is required.");
        RuleFor(x => x.ClassName).NotEmpty().WithMessage("Class is required.");
        RuleFor(x => x.Date).MustNotBeFutureDate("Date");
    }
}
