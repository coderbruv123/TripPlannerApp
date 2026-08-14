import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import TripResults from "./components/TripResults";
import Hotels from "./pages/Hotels";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { TripPlannerAccountSettings } from "./pages/TripPlannerAccountSettings";
import AdminDashboard from "./pages/Admin/Dashboard";
import UsersPage from "./pages/Admin/Userpage";
import AdminHotels from "./pages/Admin/Hotels";

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
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/profile" element={<TripPlannerAccountSettings />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
