using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CampusCore.Api.Modules.Classes;

public class SchoolClassConfiguration : IEntityTypeConfiguration<SchoolClass>
{
    public void Configure(EntityTypeBuilder<SchoolClass> builder)
    {
        builder.Property(c => c.ClassName).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Section).HasMaxLength(20).IsRequired();
        builder.HasIndex(c => new { c.ClassName, c.Section }).IsUnique();
    }
}
