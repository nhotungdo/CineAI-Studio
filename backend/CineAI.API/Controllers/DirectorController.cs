using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CineAI.AI.Gemini;
using CineAI.AI.Models;

namespace CineAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DirectorController : ControllerBase
{
    private readonly IGeminiDirectorService _directorService;

    public DirectorController(IGeminiDirectorService directorService)
    {
        _directorService = directorService;
    }

    [HttpPost("orchestrate")]
    public async Task<IActionResult> Orchestrate([FromBody] DirectorRequest request)
    {
        request ??= new DirectorRequest();
        if (string.IsNullOrWhiteSpace(request.Idea))
        {
            request.Idea = "Hanoi Old Quarter at night with cinematic neon lights";
        }

        var result = await _directorService.AnalyzeAndOrchestrateAsync(request);
        return Ok(result);
    }

    [HttpPost("refine-prompt")]
    public async Task<IActionResult> RefinePrompt([FromBody] PromptRefineRequest request)
    {
        request ??= new PromptRefineRequest();
        var result = await _directorService.RefinePromptAsync(request);
        return Ok(result);
    }

    [HttpPost("script")]
    public async Task<IActionResult> GenerateScript([FromBody] DirectorRequest request)
    {
        request ??= new DirectorRequest();
        var result = await _directorService.GenerateScriptAsync(request.Idea, request.Style, request.TargetDuration);
        return Ok(result);
    }
}
