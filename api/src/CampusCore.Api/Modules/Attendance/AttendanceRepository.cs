using CampusCore.Api.Context;
using Microsoft.EntityFrameworkCore;

namespace CampusCore.Api.Modules.Attendance;

public interface IAttendanceRepository
{
    Task<List<AttendanceRecord>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AttendanceRecord?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AttendanceRecord?> GetByStudentAndDateAsync(
        string studentName,
        DateOnly date,
        CancellationToken cancellationToken = default
    );
    Task<Dictionary<string, AttendanceRecord>> GetByDateAsync(
        DateOnly date,
        CancellationToken cancellationToken = default
    );
    Task<AttendanceRecord> CreateAsync(AttendanceRecord record, CancellationToken cancellationToken = default);
    Task UpdateAsync(AttendanceRecord record, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Tracks a new record without saving yet — used by the bulk
    /// take-attendance flow, which adds several records and wants one
    /// SaveChangesAsync at the end instead of one per roster entry.</summary>
    void Add(AttendanceRecord record);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class AttendanceRepository(AppDbContext context) : IAttendanceRepository
{
    public async Task<List<AttendanceRecord>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context
            .AttendanceRecords.OrderByDescending(a => a.Date)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<AttendanceRecord?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.AttendanceRecords.FindAsync([id], cancellationToken);
    }

    public async Task<AttendanceRecord?> GetByStudentAndDateAsync(
        string studentName,
        DateOnly date,
        CancellationToken cancellationToken = default
    )
    {
        return await context.AttendanceRecords.AsNoTracking()
            .FirstOrDefaultAsync(a => a.StudentName == studentName && a.Date == date, cancellationToken);
    }

    /// <summary>Every existing record for one date, keyed by student name —
    /// fetched once for a bulk "take attendance for a class" save instead
    /// of one query per roster entry.</summary>
    public async Task<Dictionary<string, AttendanceRecord>> GetByDateAsync(
        DateOnly date,
        CancellationToken cancellationToken = default
    )
    {
        return await context
            .AttendanceRecords.Where(a => a.Date == date)
            .ToDictionaryAsync(a => a.StudentName, cancellationToken);
    }

    public async Task<AttendanceRecord> CreateAsync(
        AttendanceRecord record,
        CancellationToken cancellationToken = default
    )
    {
        context.AttendanceRecords.Add(record);
        await context.SaveChangesAsync(cancellationToken);
        return record;
    }

    public async Task UpdateAsync(AttendanceRecord record, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var record = await context.AttendanceRecords.FindAsync([id], cancellationToken);
        if (record is null)
            return;

        context.AttendanceRecords.Remove(record);
        await context.SaveChangesAsync(cancellationToken);
    }

    public void Add(AttendanceRecord record)
    {
        context.AttendanceRecords.Add(record);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
