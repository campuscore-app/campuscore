using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CampusCore.Api.Modules.Fees;

public class FeeRecordConfiguration : IEntityTypeConfiguration<FeeRecord>
{
    public void Configure(EntityTypeBuilder<FeeRecord> builder)
    {
        builder.Property(f => f.StudentName).HasMaxLength(200).IsRequired();
        builder.Property(f => f.ClassName).HasMaxLength(50).IsRequired();
        builder.Property(f => f.AmountDue).HasPrecision(12, 2);
        builder.Property(f => f.AmountPaid).HasPrecision(12, 2);

        builder
            .HasOne(f => f.Student)
            .WithMany()
            .HasForeignKey(f => f.StudentId)
            // A student can't be deleted while they still have fee
            // records — mirrors the real-world rule that you can't just
            // erase a student's financial history.
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasMany(f => f.Payments)
            .WithOne(p => p.FeeRecord)
            .HasForeignKey(p => p.FeeRecordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PaymentEntryConfiguration : IEntityTypeConfiguration<PaymentEntry>
{
    public void Configure(EntityTypeBuilder<PaymentEntry> builder)
    {
        builder.Property(p => p.Amount).HasPrecision(12, 2);
    }
}
