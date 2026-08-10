using System;
using System.Collections.Generic;
using CineAI.Domain.Enums;

namespace CineAI.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Credit? Credit { get; set; }
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<CreditTransaction> CreditTransactions { get; set; } = new List<CreditTransaction>();
}

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AspectRatio AspectRatio { get; set; } = AspectRatio.Widescreen_16_9;
    public ProjectStyle Style { get; set; } = ProjectStyle.Cinematic;
    public int TargetDuration { get; set; } = 30; // seconds
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public ICollection<Script> Scripts { get; set; } = new List<Script>();
    public ICollection<Storyboard> Storyboards { get; set; } = new List<Storyboard>();
    public ICollection<Character> Characters { get; set; } = new List<Character>();
    public ICollection<Scene> Scenes { get; set; } = new List<Scene>();
    public ICollection<Export> Exports { get; set; } = new List<Export>();
}

public class Script
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Genre { get; set; }
    public string? Logline { get; set; }
    public string FullText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
}

public class Storyboard
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
}

public class Character
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? Appearance { get; set; }
    public string? Clothing { get; set; }
    public string? VoiceDescription { get; set; }
    public string ReferenceImagesJson { get; set; } = "[]"; // List of image URLs
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
    public ICollection<Scene> Scenes { get; set; } = new List<Scene>();
}

public class Scene
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid? CharacterId { get; set; }
    public int SceneNumber { get; set; }
    public double Duration { get; set; } = 5.0; // in seconds
    public string Prompt { get; set; } = string.Empty;
    public string? CameraMovement { get; set; }
    public string? LightingStyle { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
    public Character? Character { get; set; }
    public ICollection<SceneGeneration> Generations { get; set; } = new List<SceneGeneration>();
}

public class SceneGeneration
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SceneId { get; set; }
    public string? VeoOperationId { get; set; }
    public GenerationStatus Status { get; set; } = GenerationStatus.Pending;
    public string? VideoUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Scene? Scene { get; set; }
    public ICollection<VideoJob> VideoJobs { get; set; } = new List<VideoJob>();
}

public class VideoJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GenerationId { get; set; }
    public string JobType { get; set; } = "VeoVideoGeneration";
    public JobStatus Status { get; set; } = JobStatus.Queued;
    public int ProgressPercentage { get; set; } = 0;
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public SceneGeneration? Generation { get; set; }
}

public class Export
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string FinalVideoUrl { get; set; } = string.Empty;
    public string Resolution { get; set; } = "1080p";
    public long FileSizeBytes { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
}

public class Credit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public int Balance { get; set; } = 100;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

public class CreditTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public int Amount { get; set; }
    public CreditTransactionType Type { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
