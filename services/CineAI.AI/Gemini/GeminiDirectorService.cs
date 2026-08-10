using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using CineAI.AI.Models;

namespace CineAI.AI.Gemini;

public class GeminiDirectorService : IGeminiDirectorService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiDirectorService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] 
                 ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY") 
                 ?? string.Empty;

        _model = configuration["Gemini:Model"] 
                ?? Environment.GetEnvironmentVariable("GEMINI_MODEL") 
                ?? "gemini-3.1-pro-preview";
    }

    public async Task<PromptRefineResult> RefinePromptAsync(PromptRefineRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RawPrompt))
        {
            return new PromptRefineResult
            {
                OriginalPrompt = "",
                RefinedPrompt = "Ultra-cinematic 8k video of Hanoi Old Quarter at night, glistening rain reflections on cobblestone street, cyan and magenta neon signboards glowing through mist, camera executes a smooth slow dolly forward shot at 24fps with 35mm anamorphic lens flare, shallow depth of field, photorealistic lighting, Veo 3.1 render.",
                SuggestedCameraMovement = "slow dolly in at 24fps",
                SuggestedLighting = "volumetric neon cinematic"
            };
        }

        try
        {
            var prompt = $@"
You are an elite AI Video Director & Senior Prompt Engineer for Google Veo 3.1 Engine. 
Your task is to transform the user's raw video idea into an ultra-detailed, production-ready cinematic prompt optimized specifically for Google Veo 3.1 Text-to-Video generation.

Raw Idea: {request.RawPrompt}
Style: {request.Style}

Requirements for Veo 3.1 Prompt Architecture:
1. SUBJECT & ACTION: Explicit description of character appearance, motion, emotion, clothing, and actions.
2. ENVIRONMENT & ATMOSPHERE: Weather, surface textures (wet cobblestone, reflective glass), volumetric fog, particles.
3. CAMERA & CINEMATOGRAPHY: Specify camera movement (slow dolly forward, low angle pan, orbital tracking shot), lens focal length (35mm anamorphic, 85mm portrait), frame rate (24fps cinematic motion blur), and aperture (f/1.8 shallow DoF).
4. LIGHTING & COLOR: Specific lighting style (volumetric backlight, chiaroscuro shadow contrast, cybernetic neon hues, golden hour bloom).
5. AUDIO SYNCHRONIZATION: Ambient sound cues for Veo 3.1 audio (soft rain pitter-patter, distant city hum, cinematic cello score).

Return JSON with structure:
{{
  ""refinedPrompt"": ""Ultra-cinematic 8k photorealistic video of..."",
  ""suggestedCameraMovement"": ""slow dolly forward at 24fps with 35mm lens"",
  ""suggestedLighting"": ""volumetric neon & rain reflections"",
  ""keyKeywords"": [""Veo 3.1"", ""8k photorealistic"", ""35mm anamorphic"", ""24fps""]
}}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    response_mime_type = "application/json",
                    temperature = 0.7
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}", jsonContent);

            if (response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                var textResult = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (!string.IsNullOrEmpty(textResult))
                {
                    using var resultDoc = JsonDocument.Parse(textResult);
                    var root = resultDoc.RootElement;
                    return new PromptRefineResult
                    {
                        OriginalPrompt = request.RawPrompt,
                        RefinedPrompt = root.GetProperty("refinedPrompt").GetString() ?? request.RawPrompt,
                        SuggestedCameraMovement = root.GetProperty("suggestedCameraMovement").GetString() ?? "slow dolly forward at 24fps",
                        SuggestedLighting = root.GetProperty("suggestedLighting").GetString() ?? "volumetric neon lighting",
                        KeyKeywords = new List<string> { "Veo 3.1", "8k photorealistic", "35mm anamorphic", "24fps" }
                    };
                }
            }
        }
        catch (Exception)
        {
            // Fallback refinement logic
        }

        return new PromptRefineResult
        {
            OriginalPrompt = request.RawPrompt,
            RefinedPrompt = $"Ultra-cinematic 8k photorealistic video of {request.RawPrompt}. Atmospheric volumetric fog, rain reflections on pavement, 35mm anamorphic lens flare, slow dolly forward at 24fps, shallow depth of field, dramatic cinematic color grading, Google Veo 3.1 render.",
            SuggestedCameraMovement = "slow dolly forward at 24fps",
            SuggestedLighting = "volumetric backlight & neon contrast",
            KeyKeywords = new List<string> { "Veo 3.1", "8k photorealistic", "35mm anamorphic", "24fps" }
        };
    }

    public async Task<DirectorResponse> AnalyzeAndOrchestrateAsync(DirectorRequest request)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            return GenerateMockDirectorResponse(request);
        }

        try
        {
            var prompt = $@"
You are Google's top AI Film Director powering CineAI Studio with Gemini 3.1 Pro and Veo 3.1. 
Analyze the user's idea and engineer a full production script, characters, and scene-by-scene prompts specifically structured for Veo 3.1 video generation.

Idea: {request.Idea}
Target Duration: {request.TargetDuration} seconds
Style: {request.Style}
Aspect Ratio: {request.AspectRatio}

Return JSON with structure:
{{
  ""title"": ""..."",
  ""genre"": ""..."",
  ""audience"": ""..."",
  ""duration"": {request.TargetDuration},
  ""hook"": ""..."",
  ""script"": {{
    ""title"": ""..."",
    ""genre"": ""..."",
    ""logline"": ""..."",
    ""fullText"": ""...""
  }},
  ""characters"": [
    {{
      ""name"": ""..."",
      ""age"": 28,
      ""gender"": ""male/female"",
      ""appearance"": ""Gương mặt góc cạnh, ánh mắt cuốn hút, xăm mỏng bên thái dương."",
      ""clothing"": ""Áo khoác da đen khóa kim loại."",
      ""style"": ""cinematic realistic""
    }}
  ],
  ""storyboard"": {{
    ""title"": ""..."",
    ""summary"": ""..."",
    ""scenes"": [
      {{
        ""sceneNumber"": 1,
        ""duration"": 8,
        ""prompt"": ""Ultra-cinematic 8k video shot on 35mm anamorphic lens of..."",
        ""cameraMovement"": ""slow dolly forward at 24fps"",
        ""lightingStyle"": ""volumetric neon rain lighting"",
        ""associatedCharacter"": ""...""
      }}
    ]
  }}
}}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    response_mime_type = "application/json",
                    temperature = 0.7
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}", jsonContent);

            if (response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                var textResult = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (!string.IsNullOrEmpty(textResult))
                {
                    var result = JsonSerializer.Deserialize<DirectorResponse>(textResult, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result != null) return result;
                }
            }
        }
        catch (Exception)
        {
            // Fallback to simulation response if quota exceeded or offline
        }

        return GenerateMockDirectorResponse(request);
    }

    public async Task<ScriptResult> GenerateScriptAsync(string idea, string style, int duration)
    {
        var response = await AnalyzeAndOrchestrateAsync(new DirectorRequest
        {
            Idea = idea,
            Style = style,
            TargetDuration = duration
        });

        return response.Script;
    }

    public Task<ScenePromptResult> EnhanceScenePromptAsync(string basePrompt, string characterContext, string style)
    {
        var enhancedPrompt = $"Google Veo 3.1 {style.ToUpper()} Cinematic Spec: {basePrompt}. Character anchors: {characterContext}. Shot on 35mm anamorphic lens f/1.8, 8k resolution, volumetric backlight, 24fps cinematic motion blur, photorealistic depth of field.";
        
        return Task.FromResult(new ScenePromptResult
        {
            SceneNumber = 1,
            Duration = 8.0,
            Prompt = enhancedPrompt,
            CameraMovement = "slow dolly forward at 24fps",
            LightingStyle = "volumetric neon contrast"
        });
    }

    private static DirectorResponse GenerateMockDirectorResponse(DirectorRequest request)
    {
        var title = string.IsNullOrWhiteSpace(request.Idea) ? "CineAI Masterpiece" : $"Cinematic: {request.Idea}";
        return new DirectorResponse
        {
            Title = title,
            Genre = request.Style ?? "Cinematic Drama",
            Audience = "General Audience / Film Enthusiasts",
            Duration = request.TargetDuration,
            Hook = "Một hành trình thị giác điện ảnh cuốn hút với ánh sáng huyền ảo và chiều sâu không gian vượt trội.",
            Script = new ScriptResult
            {
                Title = title,
                Genre = request.Style ?? "Cinematic",
                Logline = $"Câu chuyện điện ảnh độc đáo khám phá ý tưởng: {request.Idea}",
                FullText = $"[SCENE 1 - INT/EXT NIGHT]\nCamera lướt mượt mà qua ánh đèn neon phản chiếu trên phố ướt mưa. Nhân vật chính bước chậm trong không gian lung linh.\n\n[SCENE 2 - CLOSE UP]\nGóc cận cảnh 35mm ghi lại biểu cảm ánh mắt cuốn hút dưới hiệu ứng xóa phông mượt mà.\n\n[SCENE 3 - WIDE SHOT]\nToàn cảnh góc cao hé lộ toàn cảnh thành phố đắm mình trong ánh hoàng hôn rực rỡ."
            },
            Characters = new List<CharacterResult>
            {
                new CharacterResult
                {
                    Name = "Alex Vance",
                    Age = 28,
                    Gender = "male",
                    Appearance = "Gương mặt góc cạnh, ánh mắt cuốn hút, tattoo mỏng bên thái dương.",
                    Clothing = "Áo khoác da đen khóa kim loại.",
                    Style = "Cinematic Realistic"
                }
            },
            Storyboard = new StoryboardResult
            {
                Title = $"{title} - Storyboard",
                Summary = "Chuỗi phân cảnh điện ảnh được tối ưu chuẩn Google Veo 3.1 Video Engine.",
                Scenes = new List<ScenePromptResult>
                {
                    new ScenePromptResult
                    {
                        SceneNumber = 1,
                        Duration = 8.0,
                        Prompt = $"Ultra-cinematic 8k wide shot of {request.Idea}. Glistening rain reflections on cobblestone street, cyan and magenta neon signboards glowing through mist, camera executes a smooth slow dolly forward shot at 24fps with 35mm anamorphic lens flare, shallow depth of field, photorealistic lighting, Veo 3.1 render.",
                        CameraMovement = "slow dolly forward at 24fps",
                        LightingStyle = "volumetric neon rain lighting",
                        AssociatedCharacter = "Alex Vance"
                    },
                    new ScenePromptResult
                    {
                        SceneNumber = 2,
                        Duration = 10.0,
                        Prompt = $"Medium close-up shot of Alex Vance wearing dark leather jacket walking slowly past an ancient lantern-lit alleyway, 85mm portrait lens, smooth 24fps motion blur, volumetric backlight, 8k resolution, photorealistic cinematic render.",
                        CameraMovement = "slow arc right tracking shot",
                        LightingStyle = "volumetric backlight & soft bokeh",
                        AssociatedCharacter = "Alex Vance"
                    },
                    new ScenePromptResult
                    {
                        SceneNumber = 3,
                        Duration = 12.0,
                        Prompt = $"Breathtaking panoramic shot revealing a futuristic city skyline bathed in golden hour sunlight reflections, drone ascending crane shot, 8k ultra-detailed photorealistic visual, Veo 3.1 engine render.",
                        CameraMovement = "drone ascending crane shot",
                        LightingStyle = "golden hour ambient lighting",
                        AssociatedCharacter = "Alex Vance"
                    }
                }
            }
        };
    }
}
