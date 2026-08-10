using Microsoft.EntityFrameworkCore;
using CineAI.Application.Interfaces;
using CineAI.Domain.Entities;

namespace CineAI.Infrastructure.Persistence;

public class CineAIDbContext : DbContext, ICineAIDbContext
{
    public CineAIDbContext(DbContextOptions<CineAIDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Script> Scripts => Set<Script>();
    public DbSet<Storyboard> Storyboards => Set<Storyboard>();
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<Scene> Scenes => Set<Scene>();
    public DbSet<SceneGeneration> SceneGenerations => Set<SceneGeneration>();
    public DbSet<VideoJob> VideoJobs => Set<VideoJob>();
    public DbSet<Export> Exports => Set<Export>();
    public DbSet<Credit> Credits => Set<Credit>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure cascade deletes and relationships
        modelBuilder.Entity<Project>()
            .HasOne(p => p.User)
            .WithMany(u => u.Projects)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Scene>()
            .HasOne(s => s.Project)
            .WithMany(p => p.Scenes)
            .HasForeignKey(s => s.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SceneGeneration>()
            .HasOne(sg => sg.Scene)
            .WithMany(s => s.Generations)
            .HasForeignKey(sg => sg.SceneId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoJob>()
            .HasOne(vj => vj.Generation)
            .WithMany(sg => sg.VideoJobs)
            .HasForeignKey(vj => vj.GenerationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Credit>()
            .HasOne(c => c.User)
            .WithOne(u => u.Credit)
            .HasForeignKey<Credit>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
