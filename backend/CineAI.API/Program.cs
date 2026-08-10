using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using CineAI.AI.Gemini;
using CineAI.API.Hubs;
using CineAI.Application.Interfaces;
using CineAI.Infrastructure.Persistence;
using CineAI.Media.FFmpeg;
using CineAI.Storage.Supabase;
using CineAI.Video.Veo;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CineAI Studio API",
        Version = "v1",
        Description = "Production-Ready AI Video Studio API powered by Gemini AI Director & Veo 3.1 Video Engine"
    });
});

builder.Services.AddHttpClient();
builder.Services.AddSignalR();

// Register DbContext with PostgreSQL / Npgsql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Host=localhost;Port=5432;Database=cineai_db;Username=postgres;Password=123456;";

var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");

builder.Services.AddDbContext<CineAIDbContext>(options =>
{
    if (useInMemory)
    {
        options.UseInMemoryDatabase("CineAIDb_InMemory");
    }
    else
    {
        options.UseNpgsql(connectionString, b => b.MigrationsAssembly("CineAI.Infrastructure"));
    }
});

builder.Services.AddScoped<ICineAIDbContext>(provider => provider.GetRequiredService<CineAIDbContext>());
builder.Services.AddScoped<IGeminiDirectorService, GeminiDirectorService>();
builder.Services.AddScoped<IVeoVideoService, VeoVideoService>();
builder.Services.AddScoped<ISupabaseStorageService, SupabaseStorageService>();
builder.Services.AddScoped<IFFmpegService, FFmpegService>();

// CORS configuration for Next.js Web App
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Enable Swagger UI for interactive API documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CineAI Studio API v1");
    c.RoutePrefix = "swagger";
});

// Redirect root URL '/' to '/swagger'
app.MapGet("/", () => Results.Redirect("/swagger"));

// Automatically seed initial production data into PostgreSQL if empty
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CineAIDbContext>();
    try
    {
        dbContext.Database.EnsureCreated();

        if (!dbContext.Users.Any())
        {
            var demoUser = new CineAI.Domain.Entities.User
            {
                Id = System.Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "demo@cineai.studio",
                FullName = "CineAI Studio Director",
                Credit = new CineAI.Domain.Entities.Credit
                {
                    Id = System.Guid.NewGuid(),
                    Balance = 500
                }
            };
            dbContext.Users.Add(demoUser);

            var demoProject = new CineAI.Domain.Entities.Project
            {
                Id = System.Guid.Parse("22222222-2222-2222-2222-222222222222"),
                UserId = demoUser.Id,
                Title = "Hanoi After Dark",
                Description = "Một video cinematic phô diễn vẻ đẹp của Hà Nội về đêm với ánh đèn neon lung linh.",
                AspectRatio = CineAI.Domain.Enums.AspectRatio.Vertical_9_16,
                Style = CineAI.Domain.Enums.ProjectStyle.Cinematic,
                TargetDuration = 30
            };
            dbContext.Projects.Add(demoProject);

            var demoCharacter = new CineAI.Domain.Entities.Character
            {
                Id = System.Guid.Parse("44444444-4444-4444-4444-444444444444"),
                ProjectId = demoProject.Id,
                Name = "Alex Vance",
                Age = 28,
                Gender = "Male",
                Appearance = "Sharp jawline, reflective dark eyes, cybernetic tattoo along left temple.",
                Clothing = "Black leather jacket with metallic zippers.",
                ReferenceImagesJson = "[\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80\"]"
            };
            dbContext.Characters.Add(demoCharacter);

            var scene1 = new CineAI.Domain.Entities.Scene
            {
                Id = System.Guid.Parse("55555555-5555-5555-5555-555555555551"),
                ProjectId = demoProject.Id,
                CharacterId = demoCharacter.Id,
                SceneNumber = 1,
                Duration = 8.0,
                Prompt = "Cinematic wide shot of Hanoi Old Quarter at night, rain reflections on pavement, vibrant neon signboards, 8k Veo 3.1 video.",
                CameraMovement = "slow dolly in",
                LightingStyle = "neon cybernetic moody"
            };
            var scene2 = new CineAI.Domain.Entities.Scene
            {
                Id = System.Guid.Parse("55555555-5555-5555-5555-555555555552"),
                ProjectId = demoProject.Id,
                CharacterId = demoCharacter.Id,
                SceneNumber = 2,
                Duration = 10.0,
                Prompt = "Medium shot of Alex Vance wearing dark leather jacket walking slowly past lantern lit alleyway, soft anamorphic bokeh.",
                CameraMovement = "slow arc right",
                LightingStyle = "volumetric backlight"
            };
            var scene3 = new CineAI.Domain.Entities.Scene
            {
                Id = System.Guid.Parse("55555555-5555-5555-5555-555555555553"),
                ProjectId = demoProject.Id,
                CharacterId = demoCharacter.Id,
                SceneNumber = 3,
                Duration = 12.0,
                Prompt = "Panoramic shot revealing West Lake Hanoi sunset with golden hour lighting reflections, photorealistic 4k resolution.",
                CameraMovement = "ascending drone crane shot",
                LightingStyle = "golden hour ambient"
            };

            dbContext.Scenes.AddRange(scene1, scene2, scene3);

            var demoExport = new CineAI.Domain.Entities.Export
            {
                Id = System.Guid.NewGuid(),
                ProjectId = demoProject.Id,
                FinalVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                Resolution = "1080p (1080x1920)",
                FileSizeBytes = 42500000
            };
            dbContext.Exports.Add(demoExport);

            dbContext.SaveChanges();
        }
    }
    catch (System.Exception ex)
    {
        System.Console.WriteLine($"[DB Auto-Migration] Warning or Exception: {ex.Message}");
    }
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.MapHub<VideoGenerationHub>("/hubs/video-generation");

app.Run();
