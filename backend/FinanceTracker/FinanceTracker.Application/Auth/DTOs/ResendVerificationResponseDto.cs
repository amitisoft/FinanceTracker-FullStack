namespace FinanceTracker.Application.Auth.DTOs;

public class ResendVerificationResponseDto
{
    public string Message { get; set; } = string.Empty;

    public bool EmailSent { get; set; }

    // Hackathon/dev fallback when SMTP is not configured.
    public string? VerificationUrl { get; set; }
}

