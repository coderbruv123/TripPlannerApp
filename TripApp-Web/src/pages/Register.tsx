import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";
import api from "./../api/axiosInstance";

interface RegisterResponse {
  errorCode?: string;
  message?: string;
  success: boolean;
}

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post<RegisterResponse>("/auth/register", {
        username: fullName.trim(),
        email,
        password,
      });

      navigate("/login", { replace: true });
    } catch (err: unknown) {
      console.error("Registration failed:", err);

      const axiosError = err as {
        response?: { data?: { message?: string } };
      };

      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError("Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">

      {/* Main Container */}
      <div className="w-full max-w-[1280px] overflow-hidden rounded-[40px] bg-surface shadow-card flex flex-col md:flex-row md:min-h-[700px]">

        {/* ================= LEFT : IMAGE ================= */}
        <div className="hidden md:block md:w-1/2 relative bg-[#dce9ff]">

          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80')",
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/25" />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/80 to-transparent" />

          {/* Caption */}
          <div className="absolute bottom-12 left-10 right-10 text-white">

            <h2 className="text-3xl font-bold mb-4">
              Discover your next adventure.
            </h2>

            <p className="text-sm leading-6 opacity-90 max-w-md">
              Plan destinations, explore routes, manage your trips,
              and organize your next journey with TripPlanner.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <div className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-full bg-white/10 backdrop-blur-sm text-sm">
                ✓ Smart trip planning
              </div>

              <div className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-full bg-white/10 backdrop-blur-sm text-sm">
                ✓ Explore destinations
              </div>

            </div>
          </div>
        </div>

        {/* ================= RIGHT : SIGN UP ================= */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 lg:p-16">

          <div className="max-w-[440px] w-full mx-auto">

            {/* Brand */}
            <div className="flex items-center gap-2 mb-10">

              <Plane
                size={30}
                className="text-brand-strong"
              />

              <span className="text-2xl font-extrabold text-brand-strong">
                TripPlanner
              </span>

            </div>

            {/* Header */}
            <div className="mb-8">

              <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-ink">
                Create an account
              </h1>

              <p className="mt-2 text-base leading-6 text-body">
                Enter your details to start planning your next adventure.
              </p>

            </div>

            {/* Signup Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              {/* Error */}
              {error && (
                <div className="rounded-full border border-danger/30 bg-danger-50 px-5 py-3 text-sm text-danger">
                  {error}
                </div>
              )}


              {/* Full Name */}
              <div>

                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-ink mb-2"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-transparent border border-line rounded-full py-3 px-5 text-sm text-ink placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
                />

              </div>

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-ink mb-2"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-transparent border border-line rounded-full py-3 px-5 text-sm text-ink placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
                />

              </div>

              {/* Password */}
              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-ink mb-2"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="w-full bg-transparent border border-line rounded-full py-3 px-5 text-sm text-ink placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
                />

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-strong hover:bg-brand dark:bg-brand-50 dark:hover:bg-brand-100 dark:text-brand-ink disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition-colors shadow-sm mt-2"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

            </form>

            {/* Login */}
            <p className="mt-8 text-center text-sm text-body">

              Already have an account?{" "}

              <Link
                to="/login"
                className="text-brand-strong font-semibold hover:underline"
              >
                Log in
              </Link>

            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

