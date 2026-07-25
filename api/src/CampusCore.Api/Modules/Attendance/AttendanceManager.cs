using CampusCore.Api.Common;
using CampusCore.Api.Common.Utility;
using FluentValidation;

namespace CampusCore.Api.Modules.Attendance;

public interface IAttendanceManager
{
    Task<ApiResponse<List<AttendanceRecordResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<AttendanceRecordResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<AttendanceRecordResponse>> CreateAsync(
        CreateAttendanceRecordRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<AttendanceRecordResponse>> UpdateAsync(
        int id,
        UpdateAttendanceRecordRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<BulkAttendanceResult>> TakeAttendanceAsync(
        BulkAttendanceRequest request,
        CancellationToken cancellationToken = default
    );
}

public class AttendanceManager(
    IAttendanceRepository attendanceRepository,
    IValidator<CreateAttendanceRecordRequest> createValidator,
    IValidator<UpdateAttendanceRecordRequest> updateValidator,
    IValidator<BulkAttendanceRequest> bulkValidator,
    IApiResponseBuilder response
) : IAttendanceManager
{
    public async Task<ApiResponse<List<AttendanceRecordResponse>>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var records = await attendanceRepository.GetAllAsync(cancellationToken);
        return response.Ok(records.Select(MapToResponse).ToList());
    }

    public async Task<ApiResponse<AttendanceRecordResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        var record = await attendanceRepository.GetByIdAsync(id, cancellationToken);
        if (record is null)
            return response.NotFound<AttendanceRecordResponse>("Attendance record not found.");

        return response.Ok(MapToResponse(record));
    }

    public async Task<ApiResponse<AttendanceRecordResponse>> CreateAsync(
        CreateAttendanceRecordRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<AttendanceRecordResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var existing = await attendanceRepository.GetByStudentAndDateAsync(
            request.StudentName,
            request.Date,
            cancellationToken
        );
        if (existing is not null)
        {
            return response.Conflict<AttendanceRecordResponse>(
                "Attendance for this student has already been marked for this date."
            );
        }

        var record = new AttendanceRecord
        {
            StudentName = request.StudentName,
            ClassName = request.ClassName,
            Date = request.Date,
            Status = request.Status,
        };

        var created = await attendanceRepository.CreateAsync(record, cancellationToken);
        return response.Created(MapToResponse(created));
    }

    public async Task<ApiResponse<AttendanceRecordResponse>> UpdateAsync(
        int id,
        UpdateAttendanceRecordRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<AttendanceRecordResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var record = await attendanceRepository.GetByIdAsync(id, cancellationToken);
        if (record is null)
            return response.NotFound<AttendanceRecordResponse>("Attendance record not found.");

        // Business rule: attendance can only be corrected on the day it was
        // marked — editing older records would let someone quietly rewrite
        // attendance history. Checked against the record's EXISTING date,
        // regardless of what the request is trying to change it to.
        if (!IsToday(record.Date))
        {
            return response.BadRequest<AttendanceRecordResponse>(null, "Only today's attendance can be edited.");
        }

        var existing = await attendanceRepository.GetByStudentAndDateAsync(
            request.StudentName,
            request.Date,
            cancellationToken
        );
        if (existing is not null && existing.Id != id)
        {
            return response.Conflict<AttendanceRecordResponse>(
                "Attendance for this student has already been marked for this date."
            );
        }

        record.StudentName = request.StudentName;
        record.ClassName = request.ClassName;
        record.Date = request.Date;
        record.Status = request.Status;

        await attendanceRepository.UpdateAsync(record, cancellationToken);
        return response.Ok(MapToResponse(record), "Attendance updated");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        // No same-day lock on delete — this mirrors AttendancePage.tsx,
        // where Remove is always available regardless of date, only Edit is locked.
        var record = await attendanceRepository.GetByIdAsync(id, cancellationToken);
        if (record is null)
            return response.NotFound<object>("Attendance record not found.");

        await attendanceRepository.DeleteAsync(id, cancellationToken);
        return response.Ok<object>(null, "Attendance record removed");
    }

    public async Task<ApiResponse<BulkAttendanceResult>> TakeAttendanceAsync(
        BulkAttendanceRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await bulkValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<BulkAttendanceResult>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        // Fetch every existing record for this date once, instead of one
        // query per roster entry — keeps a 30-student class marking to a
        // handful of queries instead of 30+.
        var existingForDate = await attendanceRepository.GetByDateAsync(request.Date, cancellationToken);

        int created = 0,
            updated = 0,
            locked = 0;

        foreach (var entry in request.Entries)
        {
            if (!existingForDate.TryGetValue(entry.StudentName, out var existing))
            {
                attendanceRepository.Add(
                    new AttendanceRecord
                    {
                        StudentName = entry.StudentName,
                        ClassName = entry.ClassName,
                        Date = request.Date,
                        Status = entry.Status,
                    }
                );
                created++;
            }
            else if (IsToday(request.Date))
            {
                existing.Status = entry.Status;
                updated++;
            }
            else
            {
                // Already marked on a past date — same-day-edit-lock applies
                // here too, so this entry is left untouched rather than silently overwritten.
                locked++;
            }
        }

        await attendanceRepository.SaveChangesAsync(cancellationToken);

        return response.Ok(
            new BulkAttendanceResult
            {
                Created = created,
                Updated = updated,
                Locked = locked,
            },
            $"Attendance saved: {created} added, {updated} updated, {locked} locked"
        );
    }

    private static bool IsToday(DateOnly date) => date == DateOnly.FromDateTime(DateTime.UtcNow);

    private static AttendanceRecordResponse MapToResponse(AttendanceRecord a) =>
        new()
        {
            Id = a.Id,
            StudentName = a.StudentName,
            ClassName = a.ClassName,
            Date = a.Date,
            Status = a.Status,
        };
}
