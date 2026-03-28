using System.Net;
using System.Net.Mail;
using FinanceTracker.Application.Notifications;
using Microsoft.Extensions.Configuration;

namespace FinanceTracker.Infrastructure.Security;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<bool> TrySendAsync(string toEmail, string subject, string htmlBody)
    {
        var host = _configuration["Smtp:Host"];
        var portValue = _configuration["Smtp:Port"];
        var username = _configuration["Smtp:Username"];
        var password = _configuration["Smtp:Password"];
        var from = _configuration["Smtp:From"];
        var enableSslValue = _configuration["Smtp:EnableSsl"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            Console.WriteLine($"[Email] SMTP not configured. Skipping send to {toEmail}. Subject: {subject}");
            return false;
        }

        var port = 587;
        if (int.TryParse(portValue, out var parsedPort))
            port = parsedPort;

        var enableSsl = true;
        if (bool.TryParse(enableSslValue, out var parsedSsl))
            enableSsl = parsedSsl;

        try
        {
            using var message = new MailMessage(from, toEmail)
            {
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl
            };

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                client.Credentials = new NetworkCredential(username, password);

            await client.SendMailAsync(message);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Email] Failed to send email to {toEmail}: {ex.Message}");
            return false;
        }
    }
}

