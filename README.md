
# Personal Finance Tracker

Production-ready full-stack web app to track income, expenses, budgets, goals, recurring payments, and trends.

## Live Apps
- Frontend: https://yellow-bay-023f7d200.2.azurestaticapps.net/
- Backend API: https://financetracker-api.lemonsmoke-62aad7f8.centralindia.azurecontainerapps.io/
- Swagger: https://financetracker-api.lemonsmoke-62aad7f8.centralindia.azurecontainerapps.io/swagger

## Features
- JWT auth with refresh tokens
- Accounts (cash/bank/card) and balances
- Categories with icon/color, archive
- Transactions CRUD + filters + keyset pagination
- Budgets with progress/alerts
- Savings goals (contribute/withdraw)
- Recurring transactions + scheduler
- Dashboard (trends, recent, upcoming)
- Reports & charts (Recharts)

## Tech Stack
- Frontend: React + TypeScript, React Router, TanStack Query, Zustand, React Hook Form + Zod, Recharts, Axios
- Backend: ASP.NET Core Web API (net10), EF Core, PostgreSQL
- Infra: Azure Static Web Apps (FE), Azure Container Apps (API), Azure Database for PostgreSQL

## Quick Start (Local)
1) Prereqs: Node 18+, .NET SDK 10, Podman, Git  
2) DB: `podman machine start` then `podman compose -f Infra/podman-compose.yml up -d`  
3) Backend env (or appsettings.Development.json):
```
ConnectionStrings__Default=Host=localhost;Port=5432;Database=pft_dev;Username=pft;Password=pft_dev
Jwt__Key=dev-secret
Jwt__Issuer=finance-tracker
Jwt__Audience=finance-tracker
```
4) Backend: `dotnet run --project backend/FinanceTracker/FinanceTracker.Api` (dev HTTPS ~ https://localhost:7284)  
5) Frontend:
```
cd Frontend/finance-tracker-ui
npm install
echo VITE_API_BASE_URL=https://localhost:5173 > .env
npm run dev
```
App: http://localhost:5173

## Notes
- New user registration seeds default categories.
- Keyset pagination used for transactions.
- Recurring jobs handled in backend scheduler.
