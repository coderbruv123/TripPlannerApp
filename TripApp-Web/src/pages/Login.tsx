
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
  email?: string;
  username?: string;
  role?: string;}
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
      console.log("Login successful:", response.data);
      persistAuth({
        token: response.data.data.token,
        role: response.data.data.role,
        email: response.data.data.email,
        username: response.data.data.username,
      });

      // Redirect admins to the admin dashboard, everyone else home
      navigate(
        response.data.data.role === "Admin"
          ? "/admin/dashboard"
          : "/",
        { replace: true }
      );
    } catch (error: any) {
      console.error("Login failed:", error);

      if (error.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">

      {/* Main Container */}
      <div className="w-full max-w-[1280px] overflow-hidden rounded-[40px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:h-[700px]">

        {/* ================= LEFT : LOGIN FORM ================= */}
        <div className="w-full md:w-1/2 bg-[#f8f9ff] p-6 md:p-12 flex items-center">

          <div className="max-w-[400px] w-full mx-auto">

            {/* Brand */}
            <div className="flex items-center gap-2 mb-8">
              <Plane
                size={32}
                className="text-[#006b5f]"
              />

              <span className="text-2xl font-extrabold text-[#006b5f]">
                TripPlanner
              </span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-[#0b1c30]">
                Welcome back
              </h1>

              <p className="mt-2 text-base leading-6 text-[#3c4947]">
                Sign in to continue planning your next adventure.
              </p>
            </div>

            {/* Social Login */}
            <div className="flex flex-col gap-4 mb-8">

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[#bbcac6] bg-white hover:bg-[#eff4ff] transition-colors"
              >
                {/* Google */}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.54 13.69A5.86 5.86 0 0 1 6.23 12c0-.59.1-1.16.31-1.69V7.78H3.3A9.6 9.6 0 0 0 2.4 12c0 1.53.37 2.98.9 4.22l3.24-2.53Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.37 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8 9.46 6.28 12 6.28Z"
                  />
                </svg>

                <span className="font-semibold text-[#0b1c30]">
                  Continue with Google
                </span>
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[#bbcac6] bg-white hover:bg-[#eff4ff] transition-colors"
              >
                {/* Facebook */}
                <svg
                  className="w-5 h-5 text-[#1877F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 6.02 4.388 11.027 10.125 11.927v-8.438H7.078v-3.489h3.047V9.41c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.515c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.489h-2.796V24C19.612 23.1 24 18.093 24 12.073Z" />
                </svg>

                <span className="font-semibold text-[#0b1c30]">
                  Continue with Facebook
                </span>
              </button>

            </div>

            {/* Divider */}
            <div className="relative flex items-center mb-8">
              <div className="flex-grow border-t border-[#bbcac6]" />

              <span className="mx-4 text-xs font-medium text-[#3c4947]">
                OR
              </span>

              <div className="flex-grow border-t border-[#bbcac6]" />
            </div>

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-[#0b1c30]"
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
                  className="w-full bg-transparent border border-[#bbcac6] focus:border-[#006b5f] focus:ring-1 focus:ring-[#006b5f] rounded-lg px-4 py-3 text-sm text-[#0b1c30] placeholder:text-[#3c4947]/50 outline-none transition disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">

                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="text-xs font-medium text-[#0b1c30]"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#006b5f] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full bg-transparent border border-[#bbcac6] focus:border-[#006b5f] focus:ring-1 focus:ring-[#006b5f] rounded-lg px-4 py-3 text-sm text-[#0b1c30] placeholder:text-[#3c4947]/50 outline-none transition disabled:opacity-50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a1c1e] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition mt-2 shadow-md"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>

            {/* Sign Up */}
            <div className="mt-8 text-center">
              <p className="text-sm text-[#3c4947]">
                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="text-[#006b5f] font-semibold hover:underline"
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
