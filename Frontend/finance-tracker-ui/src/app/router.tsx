import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/appLayout";
import ProtectedRoute from "../routes/protectedRoute";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import AccountsPage from "../pages/AccountsPage";
import CategoriesPage from "../pages/CategoriesPage";
import TransactionsPage from "../pages/TransactionsPage";
import BudgetsPage from "../pages/BudgetsPage";
import GoalsPage from "../pages/GoalsPage";
import RecurringPage from "../pages/RecurringPage";
import ReportsPage from "../pages/ReportsPage";

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
        ],
      },
    ],
  },
]);