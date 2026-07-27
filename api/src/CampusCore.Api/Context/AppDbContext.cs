using System.Reflection;
using CampusCore.Api.Modules.Attendance;
using CampusCore.Api.Modules.Auth;
using CampusCore.Api.Modules.Classes;
using CampusCore.Api.Modules.Fees;
using CampusCore.Api.Modules.School;
using CampusCore.Api.Modules.Staff;
using CampusCore.Api.Modules.Students;
using Microsoft.EntityFrameworkCore;

namespace CampusCore.Api.Context;

/// <summary>Single EF Core DbContext shared by every free-tier module.
/// They're tightly related (Fees references Students via a real foreign
/// key) so splitting into one DbContext per module would just make
/// cross-module queries and migrations harder for no real benefit at this scale.</summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StaffMember> StaffMembers => Set<StaffMember>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<FeeRecord> FeeRecords => Set<FeeRecord>();
    public DbSet<PaymentEntry> PaymentEntries => Set<PaymentEntry>();
    public DbSet<User> Users => Set<User>();
    public DbSet<SchoolInfo> Schools => Set<SchoolInfo>();
    public DbSet<SchoolClass> SchoolClasses => Set<SchoolClass>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Picks up every IEntityTypeConfiguration<T> in the assembly
        // (one per module, living next to its entity) instead of
        // configuring everything inline here.
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
