using CampusCore.Api.Context;
using Microsoft.EntityFrameworkCore;

namespace CampusCore.Api.Modules.Staff;

public interface IStaffRepository
{
    Task<List<StaffMember>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<StaffMember?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<StaffMember> CreateAsync(StaffMember staff, CancellationToken cancellationToken = default);
    Task UpdateAsync(StaffMember staff, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class StaffRepository(AppDbContext context) : IStaffRepository
{
    public async Task<List<StaffMember>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.StaffMembers.OrderBy(s => s.Name).AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<StaffMember?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.StaffMembers.FindAsync([id], cancellationToken);
    }

    public async Task<StaffMember> CreateAsync(StaffMember staff, CancellationToken cancellationToken = default)
    {
        context.StaffMembers.Add(staff);
        await context.SaveChangesAsync(cancellationToken);
        return staff;
    }

    public async Task UpdateAsync(StaffMember staff, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var staff = await context.StaffMembers.FindAsync([id], cancellationToken);
        if (staff is null)
            return;

        context.StaffMembers.Remove(staff);
        await context.SaveChangesAsync(cancellationToken);
    }
}
