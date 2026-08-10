using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineAI.Application.Interfaces;
using CineAI.Domain.Entities;

namespace CineAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CharacterController : ControllerBase
{
    private readonly ICineAIDbContext _dbContext;

    public CharacterController(ICineAIDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetCharacters()
    {
        var characters = await _dbContext.Characters
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(characters);
    }

    [HttpGet("project/{projectId}")]
    public async Task<IActionResult> GetCharactersByProject(Guid projectId)
    {
        var characters = await _dbContext.Characters
            .Where(c => c.ProjectId == projectId)
            .ToListAsync();

        return Ok(characters);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCharacter([FromBody] Character character)
    {
        if (character.ProjectId == Guid.Empty)
        {
            character.ProjectId = Guid.Parse("22222222-2222-2222-2222-222222222222"); // Default demo project
        }

        character.CreatedAt = DateTime.UtcNow;
        _dbContext.Characters.Add(character);
        await _dbContext.SaveChangesAsync();

        return Ok(character);
    }
}
