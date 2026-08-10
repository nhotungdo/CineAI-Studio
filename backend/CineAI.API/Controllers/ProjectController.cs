using System;
using System.Collections.Generic;
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
public class ProjectController : ControllerBase
{
    private readonly ICineAIDbContext _dbContext;

    public ProjectController(ICineAIDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var projects = await _dbContext.Projects
            .Include(p => p.Scenes)
            .Include(p => p.Characters)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProjectById(Guid id)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Scripts)
            .Include(p => p.Storyboards)
            .Include(p => p.Characters)
            .Include(p => p.Scenes)
                .ThenInclude(s => s.Generations)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        return Ok(project);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] Project project)
    {
        if (project.UserId == Guid.Empty)
        {
            project.UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"); // Demo default user ID
        }

        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProjectById), new { id = project.Id }, project);
    }
}
