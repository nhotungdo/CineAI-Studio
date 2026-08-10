using System;
using System.Collections.Generic;

namespace CineAI.AI.Models;

public class PromptRefineRequest
{
    public string RawPrompt { get; set; } = string.Empty;
    public string Style { get; set; } = "cinematic";
}

public class PromptRefineResult
{
    public string OriginalPrompt { get; set; } = string.Empty;
    public string RefinedPrompt { get; set; } = string.Empty;
    public string SuggestedCameraMovement { get; set; } = "slow dolly in";
    public string SuggestedLighting { get; set; } = "cinematic neon lighting";
    public List<string> KeyKeywords { get; set; } = new();
}

public class DirectorRequest
{
    public string Idea { get; set; } = string.Empty;
    public int TargetDuration { get; set; } = 30; // seconds
    public string AspectRatio { get; set; } = "16:9";
    public string Style { get; set; } = "cinematic";
    public string? Language { get; set; } = "vi";
}

public class CharacterResult
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; } = 25;
    public string Gender { get; set; } = "male";
    public string Appearance { get; set; } = string.Empty;
    public string Clothing { get; set; } = string.Empty;
    public string Style { get; set; } = "cinematic realistic";
}

public class ScenePromptResult
{
    public int SceneNumber { get; set; }
    public double Duration { get; set; } = 8.0;
    public string Prompt { get; set; } = string.Empty;
    public string CameraMovement { get; set; } = "slow dolly in";
    public string LightingStyle { get; set; } = "cinematic moody lighting";
    public string AssociatedCharacter { get; set; } = string.Empty;
}

public class StoryboardResult
{
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<ScenePromptResult> Scenes { get; set; } = new();
}

public class ScriptResult
{
    public string Title { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public string Logline { get; set; } = string.Empty;
    public string FullText { get; set; } = string.Empty;
}

public class DirectorResponse
{
    public string Title { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int Duration { get; set; } = 30;
    public string Hook { get; set; } = string.Empty;
    public ScriptResult Script { get; set; } = new();
    public List<CharacterResult> Characters { get; set; } = new();
    public StoryboardResult Storyboard { get; set; } = new();
}
