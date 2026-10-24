
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";
import api from "./../api/axiosInstance";
import { persistAuth } from "../api/authUtils";

interface LoginResponse {
  errorCode?: string;
  message?: string;
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    userId: string;
    email?: string;
    username?: string;
    role?: string;
  };
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      const data = response.data.data;

      // Store JWT tokens + user info
      persistAuth({
        token: data.token,
        refreshToken: data.refreshToken,
        userId: data.userId,
        email: data.email,
        username: data.username,
        role: data.role,
      });

      // Admins (Admin and SuperAdmin) go to the admin dashboard, everyone else home
      navigate(
        data.role === "Admin" || data.role === "SuperAdmin"
          ? "/admin/dashboard"
          : "/",
        { replace: true }
      );
    } catch (error: unknown) {
      console.error("Login failed:", error);

      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };

      if (axiosError.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">

      {/* Main Container */}
      <div className="w-full max-w-[1280px] overflow-hidden rounded-[40px] bg-surface shadow-card flex flex-col md:flex-row md:h-[700px]">

        {/* ================= LEFT : LOGIN FORM ================= */}
        <div className="w-full md:w-1/2 bg-canvas p-6 md:p-12 flex items-center">

          <div className="max-w-[400px] w-full mx-auto">

            {/* Brand */}
            <div className="flex items-center gap-2 mb-8">
              <Plane
                size={32}
                className="text-brand-strong"
              />

              <span className="text-2xl font-extrabold text-brand-strong">
                TripPlanner
              </span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-ink">
                Welcome back
              </h1>

              <p className="mt-2 text-base leading-6 text-body">
                Sign in to continue planning your next adventure.
              </p>
            </div>


            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-danger-50 border border-danger/30 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-ink"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="w-full bg-transparent border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-lg px-4 py-3 text-sm text-ink placeholder:text-faint outline-none transition disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">

                <label
                  htmlFor="password"
                  className="text-xs font-medium text-ink"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full bg-transparent border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-lg px-4 py-3 text-sm text-ink placeholder:text-faint outline-none transition disabled:opacity-50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy hover:opacity-90 dark:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-brand-ink font-semibold py-3 rounded-full transition mt-2 shadow-md"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>

            {/* Sign Up */}
            <div className="mt-8 text-center">
              <p className="text-sm text-body">
                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="text-brand-strong font-semibold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* ================= RIGHT : IMAGE ================= */}
        <div className="hidden md:block md:w-1/2 relative bg-[#dce9ff]">

          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80')",
            }}
          />

          {/* Dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/70 to-transparent" />

          {/* Caption */}
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <blockquote className="text-xl md:text-2xl font-semibold mb-2">
              "Adventure awaits. Plan perfectly."
            </blockquote>

            <p className="text-sm opacity-90">
              Organize your next journey with precision.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
