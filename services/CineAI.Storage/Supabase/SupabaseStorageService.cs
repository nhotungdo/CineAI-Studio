using System.IO;
using System.Threading.Tasks;

namespace CineAI.Storage.Supabase;

public interface ISupabaseStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string bucketName = "cineai");
    Task<bool> DeleteFileAsync(string filePath, string bucketName = "cineai");
    string GetPublicUrl(string filePath, string bucketName = "cineai");
}

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly string _supabaseUrl;
    private readonly string _serviceKey;

    public SupabaseStorageService()
    {
        _supabaseUrl = System.Environment.GetEnvironmentVariable("SUPABASE_URL") ?? "https://your-project.supabase.co";
        _serviceKey = System.Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY") ?? "mock_key";
    }

    public Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string bucketName = "cineai")
    {
        // Generates public CDN URL path
        var publicUrl = $"{_supabaseUrl}/storage/v1/object/public/{bucketName}/{fileName}";
        return Task.FromResult(publicUrl);
    }

    public Task<bool> DeleteFileAsync(string filePath, string bucketName = "cineai")
    {
        return Task.FromResult(true);
    }

    public string GetPublicUrl(string filePath, string bucketName = "cineai")
    {
        return $"{_supabaseUrl}/storage/v1/object/public/{bucketName}/{filePath}";
    }
}
