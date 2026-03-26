namespace FinanceTracker.Application.Forecast.DTOs
{
    public  class ForecastDailyPointDto
    {
        public DateTime Date { get; set; }
        public Decimal projectedBalance { get; set; }
    }
}
