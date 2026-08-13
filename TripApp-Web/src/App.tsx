import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import TripResults from "./components/TripResults";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { TripPlannerAccountSettings } from "./pages/TripPlannerAccountSettings";
import AdminDashboard from "./pages/Admin/Dashboard";
import UsersPage from "./pages/Admin/Userpage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
        {/* <Route> */}
          <Route path="/" element={<Home />} />
          <Route path="/trip" element={<TripResults />} />
          <Route path="/profile" element={<TripPlannerAccountSettings />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
