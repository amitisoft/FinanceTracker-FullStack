namespace FinanceTracker.Application.Notifications;

public interface IEmailSender
{
    Task<bool> TrySendAsync(string toEmail, string subject, string htmlBody);
}

