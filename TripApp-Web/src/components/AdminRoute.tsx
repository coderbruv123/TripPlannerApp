import { Navigate, Outlet } from "react-router-dom";
import { isAdmin, isLoggedIn } from "../api/authUtils";

export default function AdminRoute() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
