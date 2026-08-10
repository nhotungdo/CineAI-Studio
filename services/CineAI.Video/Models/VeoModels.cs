using System;
using System.Collections.Generic;

namespace CineAI.Video.Models;

public class VideoGenerationRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string Model { get; set; } = "veo-3.1-generate-preview"; // veo-3.1-generate-preview, veo-3.1-fast-generate-preview, veo-3.1-lite-preview
    public string AspectRatio { get; set; } = "16:9"; // 16:9 or 9:16
    public double DurationSeconds { get; set; } = 5.0;
    public bool IncludeAudio { get; set; } = true;
    public List<string> ReferenceImageUrls { get; set; } = new(); // Up to 3 reference images for Veo 3.1 character consistency
    public string? FirstFrameUrl { get; set; }
    public string? LastFrameUrl { get; set; }
}

public class VideoGenerationResponse
{
    public string OperationId { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Processing, Completed, Failed
    public string? VideoUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class VeoOperationStatus
{
    public string OperationId { get; set; } = string.Empty;
    public bool IsDone { get; set; }
    public int ProgressPercentage { get; set; }
    public string? VideoUrl { get; set; }
    public string? ErrorMessage { get; set; }
}
