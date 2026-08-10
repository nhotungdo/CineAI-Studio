using System.Threading.Tasks;
using CineAI.AI.Models;

namespace CineAI.AI.Gemini;

public interface IGeminiDirectorService
{
    Task<DirectorResponse> AnalyzeAndOrchestrateAsync(DirectorRequest request);
    Task<ScriptResult> GenerateScriptAsync(string idea, string style, int duration);
    Task<ScenePromptResult> EnhanceScenePromptAsync(string basePrompt, string characterContext, string style);
    Task<PromptRefineResult> RefinePromptAsync(PromptRefineRequest request);
}
