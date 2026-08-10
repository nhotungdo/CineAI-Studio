using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineAI.Application.Interfaces;

namespace CineAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CreditController : ControllerBase
{
    private readonly ICineAIDbContext _dbContext;

    public CreditController(ICineAIDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserCredit(Guid userId)
    {
        var credit = await _dbContext.Credits.FirstOrDefaultAsync(c => c.UserId == userId);
        if (credit == null)
        {
            credit = new CineAI.Domain.Entities.Credit
            {
                UserId = userId,
                Balance = 500,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.Credits.Add(credit);
            await _dbContext.SaveChangesAsync();
        }

        return Ok(credit);
    }
}
