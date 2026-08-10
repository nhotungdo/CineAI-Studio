using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CineAI.Video.Models;
using CineAI.Video.Veo;

namespace CineAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideoController : ControllerBase
{
    private readonly IVeoVideoService _veoService;

    public VideoController(IVeoVideoService veoService)
    {
        _veoService = veoService;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> StartGeneration([FromBody] VideoGenerationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
        {
            return BadRequest(new { message = "Prompt is required for video generation." });
        }

        var response = await _veoService.StartVideoGenerationAsync(request);
        return Accepted(response);
    }

    [HttpGet("operation/{operationId}")]
    public async Task<IActionResult> GetOperationStatus(string operationId)
    {
        var status = await _veoService.CheckOperationStatusAsync(operationId);
        return Ok(status);
    }
}
