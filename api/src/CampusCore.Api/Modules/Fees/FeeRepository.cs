using CampusCore.Api.Context;
using Microsoft.EntityFrameworkCore;

namespace CampusCore.Api.Modules.Fees;

public interface IFeeRepository
{
    Task<List<FeeRecord>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<FeeRecord?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<FeeRecord> CreateAsync(FeeRecord fee, CancellationToken cancellationToken = default);
    Task UpdateAsync(FeeRecord fee, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class FeeRepository(AppDbContext context) : IFeeRepository
{
    public async Task<List<FeeRecord>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.FeeRecords.OrderBy(f => f.StudentName).AsNoTracking().ToListAsync(cancellationToken);
    }

    /// <summary>Includes Payments — every caller of GetByIdAsync (edit,
    /// delete, record-payment, history) ends up needing the payment list
    /// or the current AmountPaid derived from it, so it's simpler to
    /// always load it than to have two variants.</summary>
    public async Task<FeeRecord?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.FeeRecords.Include(f => f.Payments).FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<FeeRecord> CreateAsync(FeeRecord fee, CancellationToken cancellationToken = default)
    {
        context.FeeRecords.Add(fee);
        await context.SaveChangesAsync(cancellationToken);
        return fee;
    }

    public async Task UpdateAsync(FeeRecord fee, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var fee = await context.FeeRecords.FindAsync([id], cancellationToken);
        if (fee is null)
            return;

        context.FeeRecords.Remove(fee);
        await context.SaveChangesAsync(cancellationToken);
    }
}
