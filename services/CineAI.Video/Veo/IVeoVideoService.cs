using System.Threading.Tasks;
using CineAI.Video.Models;

namespace CineAI.Video.Veo;

public interface IVeoVideoService
{
    Task<VideoGenerationResponse> StartVideoGenerationAsync(VideoGenerationRequest request);
    Task<VeoOperationStatus> CheckOperationStatusAsync(string operationId);
}
