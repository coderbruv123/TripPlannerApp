import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import TripResults from "./components/TripResults";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { TripPlannerAccountSettings } from "./pages/TripPlannerAccountSettings";
import AdminDashboard from "./pages/Admin/Dashboard";
import UsersPage from "./pages/Admin/Userpage";
import Recommendations from "./pages/Admin/Recommendations";
import SavedTripsPage from "./pages/SavedTripsPage";
import StaysPage from "./pages/StaysPage";
import { LOGOUT_EVENT } from "./utils/authEvents";

/**
 * The axios interceptor can't reach the router, so it raises LOGOUT_EVENT.
 * Listening here keeps the redirect client-side (no page reload).
 */
function LogoutWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const onLogout = () => navigate("/login", { replace: true });

    window.addEventListener(LOGOUT_EVENT, onLogout);

    return () => window.removeEventListener(LOGOUT_EVENT, onLogout);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LogoutWatcher />

      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/trip" element={<TripResults />} />
          <Route path="/saved-trips" element={<SavedTripsPage />} />
          <Route path="/stays" element={<StaysPage />} />
          <Route path="/profile" element={<TripPlannerAccountSettings />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />}/>
          <Route path="/admin/recommendations" element={<Recommendations />}/>
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
