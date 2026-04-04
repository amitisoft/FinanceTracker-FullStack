import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/appLayout";
import ProtectedRoute from "../routes/protectedRoute";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import DashboardPage from "../pages/DashboardPage";
import AccountsPage from "../pages/AccountsPage";
import CategoriesPage from "../pages/CategoriesPage";
import TransactionsPage from "../pages/TransactionsPage";
import BudgetsPage from "../pages/BudgetsPage";
import GoalsPage from "../pages/GoalsPage";
import RecurringPage from "../pages/RecurringPage";
import ReportsPage from "../pages/ReportsPage";
import RulesPage from "../pages/RulesPage";
import SharedAccountsPage from "../pages/SharedAccountsPage";
import InsightsPage from "../pages/InsightsPage";
import HealthScorePage from "../pages/HealthScorePage";
import SettingsPage from "../pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/accounts", element: <AccountsPage /> },
          { path: "/categories", element: <CategoriesPage /> },
          { path: "/transactions", element: <TransactionsPage /> },
          { path: "/budgets", element: <BudgetsPage /> },
          { path: "/goals", element: <GoalsPage /> },
          { path: "/recurring", element: <RecurringPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/rules", element: <RulesPage /> },
          { path: "/shared", element: <SharedAccountsPage /> },
          { path: "/insights", element: <InsightsPage /> },
          { path: "/health-score", element: <HealthScorePage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
