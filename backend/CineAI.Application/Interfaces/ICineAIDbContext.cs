using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CineAI.Domain.Entities;

namespace CineAI.Application.Interfaces;

public interface ICineAIDbContext
{
    DbSet<User> Users { get; }
    DbSet<Project> Projects { get; }
    DbSet<Script> Scripts { get; }
    DbSet<Storyboard> Storyboards { get; }
    DbSet<Character> Characters { get; }
    DbSet<Scene> Scenes { get; }
    DbSet<SceneGeneration> SceneGenerations { get; }
    DbSet<VideoJob> VideoJobs { get; }
    DbSet<Export> Exports { get; }
    DbSet<Credit> Credits { get; }
    DbSet<CreditTransaction> CreditTransactions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
