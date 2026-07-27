using CampusCore.Api.Context;
using Microsoft.EntityFrameworkCore;

namespace CampusCore.Api.Modules.Classes;

public interface ISchoolClassRepository
{
    Task<List<SchoolClass>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SchoolClass?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string className, string section, CancellationToken cancellationToken = default);
    Task<SchoolClass> CreateAsync(SchoolClass schoolClass, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class SchoolClassRepository(AppDbContext context) : ISchoolClassRepository
{
    public async Task<List<SchoolClass>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context
            .SchoolClasses.OrderBy(c => c.ClassName)
            .ThenBy(c => c.Section)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<SchoolClass?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.SchoolClasses.FindAsync([id], cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        string className,
        string section,
        CancellationToken cancellationToken = default
    )
    {
        return await context.SchoolClasses.AnyAsync(
            c => c.ClassName == className && c.Section == section,
            cancellationToken
        );
    }

    public async Task<SchoolClass> CreateAsync(
        SchoolClass schoolClass,
        CancellationToken cancellationToken = default
    )
    {
        context.SchoolClasses.Add(schoolClass);
        await context.SaveChangesAsync(cancellationToken);
        return schoolClass;
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var schoolClass = await context.SchoolClasses.FindAsync([id], cancellationToken);
        if (schoolClass is null)
            return;

        context.SchoolClasses.Remove(schoolClass);
        await context.SaveChangesAsync(cancellationToken);
    }
}
