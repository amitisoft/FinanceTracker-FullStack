import { Navigate, Outlet } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function ProtectedRoute() {
  const token = authStore((s) => s.accessToken);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}