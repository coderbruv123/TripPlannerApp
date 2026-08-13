import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log({
      fullName,
      email,
      password,
    });

    // Backend registration will be connected here later.
    // navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">

      {/* Main Container */}
      <div className="w-full max-w-[1280px] overflow-hidden rounded-[40px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:min-h-[700px]">

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
                className="text-[#006b5f]"
              />

              <span className="text-2xl font-extrabold text-[#006b5f]">
                TripPlanner
              </span>

            </div>

            {/* Header */}
            <div className="mb-8">

              <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-[#0b1c30]">
                Create an account
              </h1>

              <p className="mt-2 text-base leading-6 text-[#3c4947]">
                Enter your details to start planning your next adventure.
              </p>

            </div>

            {/* Social Login */}
            <div className="flex flex-col gap-4 mb-8">

              {/* Google */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[#bbcac6] bg-white hover:bg-[#eff4ff] transition-colors"
              >

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

              {/* Apple */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[#bbcac6] bg-white hover:bg-[#eff4ff] transition-colors"
              >

                <span className="text-xl">
                  
                </span>

                <span className="font-semibold text-[#0b1c30]">
                  Continue with Apple
                </span>

              </button>

            </div>

            {/* Divider */}
            <div className="relative flex items-center mb-8">

              <div className="flex-grow border-t border-[#bbcac6]" />

              <span className="mx-4 text-xs font-medium text-[#3c4947] whitespace-nowrap">
                OR SIGN UP WITH EMAIL
              </span>

              <div className="flex-grow border-t border-[#bbcac6]" />

            </div>

            {/* Signup Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >

              {/* Full Name */}
              <div>

                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-[#0b1c30] mb-2"
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
                  className="w-full bg-transparent border border-[#bbcac6] rounded-full py-3 px-5 text-sm text-[#0b1c30] placeholder:text-[#6c7a77] focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 outline-none transition"
                />

              </div>

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#0b1c30] mb-2"
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
                  className="w-full bg-transparent border border-[#bbcac6] rounded-full py-3 px-5 text-sm text-[#0b1c30] placeholder:text-[#6c7a77] focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 outline-none transition"
                />

              </div>

              {/* Password */}
              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[#0b1c30] mb-2"
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
                  className="w-full bg-transparent border border-[#bbcac6] rounded-full py-3 px-5 text-sm text-[#0b1c30] placeholder:text-[#6c7a77] focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 outline-none transition"
                />

              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-[#006b5f] hover:bg-[#005048] text-white font-semibold py-3 rounded-full transition-colors shadow-sm mt-2"
              >
                Create Account
              </button>

            </form>

            {/* Login */}
            <p className="mt-8 text-center text-sm text-[#3c4947]">

              Already have an account?{" "}

              <Link
                to="/login"
                className="text-[#006b5f] font-semibold hover:underline"
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

