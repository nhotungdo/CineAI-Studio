using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineAI.Application.Interfaces;
using CineAI.Domain.Entities;
using CineAI.Domain.Enums;

namespace CineAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SceneController : ControllerBase
{
    private readonly ICineAIDbContext _dbContext;

    public SceneController(ICineAIDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("project/{projectId}")]
    public async Task<IActionResult> GetScenesByProject(Guid projectId)
    {
        var scenes = await _dbContext.Scenes
            .Where(s => s.ProjectId == projectId)
            .Include(s => s.Character)
            .Include(s => s.Generations)
            .OrderBy(s => s.SceneNumber)
            .ToListAsync();

        return Ok(scenes);
    }

    [HttpPost]
    public async Task<IActionResult> CreateScene([FromBody] Scene scene)
    {
        scene.CreatedAt = DateTime.UtcNow;
        _dbContext.Scenes.Add(scene);
        await _dbContext.SaveChangesAsync();

        return Ok(scene);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateScene(Guid id, [FromBody] Scene sceneUpdate)
    {
        var existing = await _dbContext.Scenes.FirstOrDefaultAsync(s => s.Id == id);
        if (existing == null) return NotFound();

        existing.Prompt = sceneUpdate.Prompt;
        existing.CameraMovement = sceneUpdate.CameraMovement;
        existing.LightingStyle = sceneUpdate.LightingStyle;
        existing.Duration = sceneUpdate.Duration;
        existing.CharacterId = sceneUpdate.CharacterId;

        await _dbContext.SaveChangesAsync();
        return Ok(existing);
    }
}
