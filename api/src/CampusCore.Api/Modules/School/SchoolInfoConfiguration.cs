using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CampusCore.Api.Modules.School;

public class SchoolInfoConfiguration : IEntityTypeConfiguration<SchoolInfo>
{
    public void Configure(EntityTypeBuilder<SchoolInfo> builder)
    {
        builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
    }
}
