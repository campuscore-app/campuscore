using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CampusCore.Api.Modules.Staff;

public class StaffMemberConfiguration : IEntityTypeConfiguration<StaffMember>
{
    public void Configure(EntityTypeBuilder<StaffMember> builder)
    {
        builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Role).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Department).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Contact).HasMaxLength(20).IsRequired();
    }
}
