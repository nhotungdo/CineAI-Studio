using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace CineAI.API.Hubs;

public class VideoGenerationHub : Hub
{
    public async Task JoinProjectGroup(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project_{projectId}");
    }

    public async Task LeaveProjectGroup(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project_{projectId}");
    }

    public async Task SendProgressUpdate(string operationId, int progressPercentage, string status, string? videoUrl)
    {
        await Clients.All.SendAsync("VideoProgressUpdated", new
        {
            operationId,
            progressPercentage,
            status,
            videoUrl
        });
    }
}
