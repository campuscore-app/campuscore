using CampusCore.Api.Context;
using Microsoft.EntityFrameworkCore;

namespace CampusCore.Api.Modules.Students;

public interface IStudentRepository
{
    Task<List<Student>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Student?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Student?> GetByRollNoAsync(string rollNo, CancellationToken cancellationToken = default);
    Task<Student> CreateAsync(Student student, CancellationToken cancellationToken = default);
    Task UpdateAsync(Student student, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class StudentRepository(AppDbContext context) : IStudentRepository
{
    public async Task<List<Student>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Students.OrderBy(s => s.RollNo).AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<Student?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Students.FindAsync([id], cancellationToken);
    }

    public async Task<Student?> GetByRollNoAsync(string rollNo, CancellationToken cancellationToken = default)
    {
        return await context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.RollNo == rollNo, cancellationToken);
    }

    public async Task<Student> CreateAsync(Student student, CancellationToken cancellationToken = default)
    {
        context.Students.Add(student);
        await context.SaveChangesAsync(cancellationToken);
        return student;
    }

    public async Task UpdateAsync(Student student, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var student = await context.Students.FindAsync([id], cancellationToken);
        if (student is null)
            return;

        context.Students.Remove(student);
        await context.SaveChangesAsync(cancellationToken);
    }
}
