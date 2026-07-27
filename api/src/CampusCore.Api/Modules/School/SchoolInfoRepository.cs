using CampusCore.Api.Context;
using Microsoft.EntityFrameworkCore;

namespace CampusCore.Api.Modules.School;

public interface ISchoolInfoRepository
{
    /// <summary>Free tier only ever has one row — the school this
    /// installation serves. Multi-school support isn't a free-tier
    /// concept, so there's no "which school" parameter to pass.</summary>
    Task<SchoolInfo?> GetAsync(CancellationToken cancellationToken = default);
    Task<SchoolInfo> CreateAsync(SchoolInfo school, CancellationToken cancellationToken = default);
}

public class SchoolInfoRepository(AppDbContext context) : ISchoolInfoRepository
{
    public async Task<SchoolInfo?> GetAsync(CancellationToken cancellationToken = default)
    {
        return await context.Schools.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<SchoolInfo> CreateAsync(SchoolInfo school, CancellationToken cancellationToken = default)
    {
        context.Schools.Add(school);
        await context.SaveChangesAsync(cancellationToken);
        return school;
    }
}
