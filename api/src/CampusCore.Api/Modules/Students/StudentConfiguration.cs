using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CampusCore.Api.Modules.Students;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
        builder.Property(s => s.RollNo).HasMaxLength(50).IsRequired();
        builder.Property(s => s.ClassName).HasMaxLength(50).IsRequired();
        builder.Property(s => s.Section).HasMaxLength(20).IsRequired();
        builder.Property(s => s.GuardianName).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Contact).HasMaxLength(20).IsRequired();

        builder.HasIndex(s => s.RollNo).IsUnique();
    }
}
