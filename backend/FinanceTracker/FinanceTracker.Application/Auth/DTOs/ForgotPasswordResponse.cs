namespace FinanceTracker.Application.Auth.DTOs;

public class ForgotPasswordResponse
{
    public string Message { get; set; } = string.Empty;
    public string? ResetToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
