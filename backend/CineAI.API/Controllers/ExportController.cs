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
public class ExportController : ControllerBase
{
    private readonly ICineAIDbContext _dbContext;

    public ExportController(ICineAIDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetExports()
    {
        var exports = await _dbContext.Exports
            .Include(e => e.Project)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return Ok(exports);
    }

    [HttpPost]
    public async Task<IActionResult> CreateExport([FromBody] Export export)
    {
        export.CreatedAt = DateTime.UtcNow;
        _dbContext.Exports.Add(export);
        await _dbContext.SaveChangesAsync();

        return Ok(export);
    }
}
