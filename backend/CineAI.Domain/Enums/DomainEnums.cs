namespace CineAI.Domain.Enums;

public enum ProjectStyle
{
    Cinematic,
    Anime,
    Commercial,
    Documentary,
    SciFi,
    Cyberpunk,
    Fantasy,
    Realistic
}

public enum AspectRatio
{
    Widescreen_16_9,
    Vertical_9_16,
    Square_1_1,
    Standard_4_3
}

public enum GenerationStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}

public enum JobStatus
{
    Queued,
    Processing,
    Completed,
    Failed,
    Cancelled
}

public enum CreditTransactionType
{
    Deduct,
    TopUp,
    Refund,
    Bonus
}
