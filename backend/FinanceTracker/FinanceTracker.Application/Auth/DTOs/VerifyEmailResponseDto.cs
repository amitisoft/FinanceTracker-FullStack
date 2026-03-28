namespace FinanceTracker.Application.Auth.DTOs;

public class VerifyEmailResponseDto
{
    public bool Verified { get; set; }

    public string Message { get; set; } = string.Empty;
}

