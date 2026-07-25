using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CampusCore.Api.Modules.Attendance;

public class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> builder)
    {
        builder.Property(a => a.StudentName).HasMaxLength(200).IsRequired();
        builder.Property(a => a.ClassName).HasMaxLength(50).IsRequired();

        // One attendance record per student per day — enforced at the
        // database level too, not just checked in the manager.
        builder.HasIndex(a => new { a.StudentName, a.Date }).IsUnique();
    }
}
