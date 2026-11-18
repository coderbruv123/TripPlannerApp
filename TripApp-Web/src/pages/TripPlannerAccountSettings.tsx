import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ChevronDown,
  Compass,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  changePassword,
  getMe,
  revokeRefreshToken,
  updateProfile as updateProfileApi,
} from "../api/auth";
import type { AuthUser } from "../api/authUtils";
import { clearAuth, getUserName } from "../api/authUtils";
import { getInitials } from "../utils/userInitials";
import { toggleTheme, useTheme } from "../utils/theme";

type Profile = {
  fullName: string;
  nickname: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  location: string;
};

const EMPTY_PROFILE: Profile = {
  fullName: "",
  nickname: "",
  email: "",
  phone: "",
  address: "",
  occupation: "",
  location: "",
};

const LOCATIONS = ["United States", "Canada", "United Kingdom", "Nepal"];

type ProfileKey = keyof Profile;

type ProfileState = {
  key: number;
  profile: Profile;
  baseline: Profile;
  error: string | null;
};

type Notice = { kind: "success" | "error"; text: string };

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function profileFromUser(user: AuthUser): Profile {
  return {
    fullName: text(user.username),
    nickname: text(user.nickname),
    email: text(user.email),
    phone: text(user.phone),
    address: text(user.address),
    occupation: text(user.occupation),
    location: text(user.location),
  };
}

function saveErrorMessage(code?: string, message?: string): string {
  switch (code) {
    case "EMAIL_EXISTS":
      return "That email is already in use. Try a different address.";
    case "USERNAME_EXISTS":
      return "That full name is already taken. Try another one.";
    default:
      return message || "Could not save your profile. Please try again.";
  }
}

function readableError(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { errorCode?: string; message?: string }
      | undefined;

    return saveErrorMessage(data?.errorCode, data?.message);
  }

  return error instanceof Error
    ? error.message
    : "Could not save your profile. Please try again.";
}

const sidebarItems = [
  {
    label: "Profile",
    icon: UserRound,
    targetId: "profile-section",
  },
  {
    label: "Security",
    icon: Settings,
    targetId: "security-section",
  },
];

export const TripPlannerAccountSettings = () => {
  const navigate = useNavigate();

  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [activeItem, setActiveItem] = useState("Profile");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const profileLoaded = profileState !== null && profileState.key === profileReloadKey;
  const profile = profileState && profileLoaded ? profileState.profile : EMPTY_PROFILE;
  const profileLoadError = profileState && profileLoaded ? profileState.error : null;

  const displayName = (profileLoaded && profile.fullName) || getUserName();
  const initials = getInitials(displayName);
  const theme = useTheme();

  /* Load the real account on mount (and on retry). State is keyed by the
     reload id so a late response from an old request can't win. */
  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((user) => {
        if (cancelled) return;

        const loaded = profileFromUser(user);
        setProfileState({
          key: profileReloadKey,
          profile: loaded,
          baseline: loaded,
          error: null,
        });
        localStorage.setItem("userName", loaded.fullName);
        localStorage.setItem("userEmail", loaded.email);
      })
      .catch(() => {
        if (!cancelled) {
          setProfileState({
            key: profileReloadKey,
            profile: EMPTY_PROFILE,
            baseline: EMPTY_PROFILE,
            error: "Couldn't load your profile. Check your connection and try again.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profileReloadKey]);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const logout = () => {
    revokeRefreshToken();
    clearAuth();
    navigate("/login", { replace: true });
  };

  const updateProfileField = (field: ProfileKey, value: string) => {
    setProfileState((current) =>
      current && current.key === profileReloadKey
        ? { ...current, profile: { ...current.profile, [field]: value } }
        : current
    );
    setNotice(null);
    setProfileError(null);
  };

  const saveProfile = async () => {
    if (!profileLoaded || savingProfile) return;

    const fullName = profile.fullName.trim();
    const email = profile.email.trim();

    if (!fullName) {
      setProfileError("Full name is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError("Enter a valid email address.");
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setNotice(null);

    try {
      const result = await updateProfileApi({
        username: fullName,
        email,
        nickname: profile.nickname,
        phone: profile.phone,
        address: profile.address,
        occupation: profile.occupation,
        location: profile.location,
      });

      if (!result.success) {
        setProfileError(saveErrorMessage(result.errorCode, result.message));
        return;
      }

      const returned = result.data;
      const nextProfile = returned
        ? profileFromUser(returned)
        : { ...profile, fullName, email };

      localStorage.setItem("userName", nextProfile.fullName || fullName);
      localStorage.setItem("userEmail", nextProfile.email || email);

      setProfileState((current) =>
        current && current.key === profileReloadKey
          ? { ...current, profile: nextProfile, baseline: nextProfile }
          : current
      );
      setNotice({
        kind: "success",
        text: result.message || "Profile changes saved",
      });
    } catch (error) {
      setProfileError(readableError(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setUpdatingPassword(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (result.success) {
        setPasswordMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.message || "Could not update password.");
      }
    } catch {
      setPasswordError("Could not update password. Please try again.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const discardProfile = () => {
    if (!profileLoaded) return;

    setProfileState((current) =>
      current && current.key === profileReloadKey
        ? { ...current, profile: current.baseline }
        : current
    );
    setProfileError(null);
    setNotice({ kind: "success", text: "Changes discarded" });
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface px-5 shadow-[0_2px_12px_rgba(15,31,61,0.05)] sm:px-8">
        <Link to="/"
          className="flex items-center gap-2.5"
          aria-label="TripPlanner home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-50 text-brand">
            <Compass size={21} strokeWidth={2.3} />
          </span>

          <span className="text-[17px] font-bold tracking-[-0.4px]">
            TripPlanner
          </span>
        </Link>

        <nav
          className="flex items-center gap-1.5"
          aria-label="Account actions"
        >
          <div className="ml-1 hidden h-8 w-px bg-line sm:block" />

          <button
            type="button"
            onClick={() => toggleTheme()}
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
          >
            {theme === "dark" ? (
              <Sun size={17} strokeWidth={1.8} />
            ) : (
              <Moon size={17} strokeWidth={1.8} />
            )}
          </button>

          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand bg-brand-50 text-[13px] font-bold text-brand-strong"
          >
            {initials}
          </span>

          <span className="hidden pl-1 text-[13px] font-semibold text-ink sm:block">
            {displayName}
          </span>
        </nav>
      </header>


      {/* ================= MAIN LAYOUT ================= */}

      <div className="flex min-h-[calc(100vh-64px)]">

        {/* ================= SIDEBAR ================= */}

        <aside
          className={`fixed inset-y-16 left-0 z-20 w-[260px] border-r border-line bg-surface p-6 shadow-[3px_0_14px_rgba(15,31,61,0.03)] transition-transform md:sticky md:top-16 md:block md:translate-x-0 ${
            mobileNavOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="mb-7 flex items-center justify-between md:hidden">
            <strong className="text-sm">
              Account menu
            </strong>

            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
            Account
          </p>

          <nav
            aria-label="Account settings navigation"
            className="space-y-1"
          >
            {sidebarItems.map(
              ({ label, icon: Icon, targetId }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActiveItem(label);
                    setMobileNavOpen(false);
                    document.getElementById(targetId)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  aria-current={
                    activeItem === label
                      ? "page"
                      : undefined
                  }
                  className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                    activeItem === label
                      ? "bg-brand-50 text-brand-strong"
                      : "text-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                  />

                  <span>{label}</span>
                </button>
              )
            )}
          </nav>

          <div className="my-6 border-t border-line" />

          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-danger transition hover:bg-danger-50 focus:outline-none focus:ring-2 focus:ring-danger/30"
          >
            <LogOut
              size={18}
              strokeWidth={1.8}
            
            />

            <span>Log out</span>
          </button>
        </aside>

        {/* ================= CONTENT ================= */}

        <main
          id="profile"
          className="w-full min-w-0 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-11"
        >
          <div className="mx-auto max-w-[900px]">

            {/* Page heading */}

            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[27px] font-bold tracking-[-0.8px]">
                  Account Settings
                </h1>

                <p className="mt-1.5 text-[14px] text-faint">
                  Manage your profile and preferences
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open account menu"
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-muted md:hidden"
              >
                <span className="text-lg">☰</span>
              </button>
            </div>

            <div className="border-t border-line" />

            {/* ================= PROFILE ================= */}

            <section
              id="profile-section"
              className="scroll-mt-24 py-8"
              aria-labelledby="profile-heading"
            >
              <h2
                id="profile-heading"
                className="text-[21px] font-bold tracking-[-0.4px]"
              >
                Profile
              </h2>

              {!profileLoaded ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
                  Loading your profile…
                </div>
              ) : profileLoadError ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-[13px] text-red-600">{profileLoadError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileState(null);
                      setProfileReloadKey((key) => key + 1);
                    }}
                    className="text-[13px] font-semibold text-red-600 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {notice && (
                    <p
                      role="status"
                      className={`mt-4 rounded-lg px-4 py-2.5 text-[13px] font-medium ${
                        notice.kind === "success"
                          ? "bg-brand-50 text-brand-strong"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {notice.text}
                    </p>
                  )}

                  {profileError && (
                    <p
                      role="alert"
                      className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600"
                    >
                      {profileError}
                    </p>
                  )}

                  {/* Profile fields */}
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-medium text-muted">
                        Full Name
                      </span>
                      <input
                        value={profile.fullName}
                        disabled={savingProfile}
                        onChange={(event) =>
                          updateProfileField("fullName", event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-medium text-muted">
                        Nickname
                      </span>
                      <input
                        value={profile.nickname}
                        disabled={savingProfile}
                        onChange={(event) =>
                          updateProfileField("nickname", event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[12px] font-medium text-muted">
                          Email
                        </span>
                        <input
                          type="email"
                          value={profile.email}
                          disabled={savingProfile}
                          onChange={(event) =>
                            updateProfileField("email", event.target.value)
                          }
                          className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[12px] font-medium text-muted">
                          Phone
                        </span>
                        <input
                          value={profile.phone}
                          disabled={savingProfile}
                          onChange={(event) =>
                            updateProfileField("phone", event.target.value)
                          }
                          className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-medium text-muted">
                        Address
                      </span>
                      <input
                        value={profile.address}
                        disabled={savingProfile}
                        onChange={(event) =>
                          updateProfileField("address", event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[12px] font-medium text-muted">
                          Occupation
                        </span>
                        <input
                          value={profile.occupation}
                          disabled={savingProfile}
                          onChange={(event) =>
                            updateProfileField("occupation", event.target.value)
                          }
                          className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[12px] font-medium text-muted">
                          Location
                        </span>
                        <span className="relative block">
                          <select
                            value={profile.location}
                            disabled={savingProfile}
                            onChange={(event) =>
                              updateProfileField("location", event.target.value)
                            }
                            className="h-11 w-full appearance-none rounded-lg border border-line bg-surface px-3 pr-9 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                          >
                            {profile.location &&
                              !LOCATIONS.includes(profile.location) && (
                                <option value={profile.location}>
                                  {profile.location}
                                </option>
                              )}
                            {LOCATIONS.map((location) => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-3.5 text-faint"
                          />
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={discardProfile}
                      disabled={savingProfile}
                      className="h-10 rounded-full border border-line bg-surface px-5 text-[13px] font-semibold text-muted transition hover:bg-canvas focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
                    >
                      Discard
                    </button>

                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={savingProfile}
                      className="h-10 rounded-full bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_5px_12px_rgba(0,191,165,0.18)] transition hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
                    >
                      {savingProfile ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* ================= SECURITY ================= */}

            <div className="border-t border-line" />

            <section
              id="security-section"
              className="scroll-mt-24 py-8"
              aria-labelledby="security-heading"
            >
              <h2
                id="security-heading"
                className="text-[21px] font-bold tracking-[-0.4px]"
              >
                Security
              </h2>

              <div className="mt-6 max-w-[640px] space-y-4">

                {passwordError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                    {passwordError}
                  </div>
                )}

                {passwordMessage && (
                  <div className="rounded-lg border border-brand/30 bg-brand-50 px-4 py-3 text-[13px] text-brand-strong">
                    {passwordMessage}
                  </div>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted">
                    Current password
                  </span>

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(e.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted">
                    New password
                  </span>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted">
                    Confirm new password
                  </span>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                </label>

              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={updatingPassword}
                  className="h-10 rounded-full bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_5px_12px_rgba(0,191,165,0.18)] transition hover:bg-brand-strong disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  {updatingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};