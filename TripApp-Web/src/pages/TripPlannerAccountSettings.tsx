import { useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Compass,
  Headphones,
  Heart,
  LogOut,
  Search,
  Settings,
  UserRound,
  Plus,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
const avatarUrl =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

type Profile = {
  fullName: string;
  nickname: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  location: string;
};

const defaultProfile: Profile = {
  fullName: localStorage.getItem("userName") || "Undefined",
  nickname: "None",
  email: localStorage.getItem("userEmail") || "Undefined",
  phone: "+1 (555) 123-4567",
  address: "San Francisco, CA 94102",
  occupation: "Adventure Traveler",
  location: "United States",
};

type ProfileKey = keyof Profile;

type SavedJourney = {
  id: string;
  mode: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  estimatedPrice: number | null;
  savedAt: string;
  journey: {
    mode: string;
    legs: { mode: string }[];
    totalDistanceKm: number;
    totalDurationMinutes: number;
    estimatedPrice: number | null;
  };
};

const sidebarItems = [
  {
    label: "Profile",
    icon: UserRound,
  },
  {
    label: "My Trips",
    icon: BriefcaseBusiness,
  },
  {
    label: "Saved Places",
    icon: Heart,
  },
  {
    label: "Notifications",
    icon: Bell,
  },
  {
    label: "Help & Support",
    icon: Headphones,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

export const TripPlannerAccountSettings = () => {
  /*
   * Theme state removed for now: connect this state to your
   * Settings page later if a theme toggle is needed.
   */
const logout = () => {
  localStorage.removeItem("token");
  window.location.reload();
}
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  const [activeItem, setActiveItem] = useState("Profile");

  const [savedMessage, setSavedMessage] = useState("");

  const [showNotifications, setShowNotifications] = useState(false);

  const [showSearch, setShowSearch] = useState(false);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigate = useNavigate();

  const [savedJourneys, setSavedJourneys] = useState<
    SavedJourney[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/journeys/saved")
      .then((response) => {
        if (!cancelled) {
          setSavedJourneys(response.data || []);
        }
      })
      .catch((error) => {
        console.error("Failed to load saved journeys", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const removeSavedJourney = async (id: string) => {
    try {
      await api.delete(`/journeys/saved/${id}`);
      setSavedJourneys((current) =>
        current.filter((journey) => journey.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete saved journey", error);
      alert("Failed to delete journey.");
    }
  };

  const updateProfile = (
    field: ProfileKey,
    value: string
  ) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSavedMessage("");
  };

  const saveProfile = () => {
    setSavedMessage("Profile changes saved");

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2800);
  };

  const discardProfile = () => {
    setProfile(defaultProfile);

    setSavedMessage("Changes discarded");

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2800);
  };

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] font-sans text-[#0F1F3D]"
      style={{
        background: "rgb(239, 239, 239)",
      }}
    >
      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E9E9EC] bg-white px-5 shadow-[0_2px_12px_rgba(15,31,61,0.05)] sm:px-8">
        <Link to="/"
          className="flex items-center gap-2.5"
          aria-label="TripPlanner home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F8F6] text-[#00BFA5]">
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
          {/* Search */}

          <button
            type="button"
            onClick={() =>
              setShowSearch((current) => !current)
            }
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#F5F5F7] hover:text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
          >
            {showSearch ? (
              <X size={18} strokeWidth={1.8} />
            ) : (
              <Search size={18} strokeWidth={1.8} />
            )}
          </button>

          {/* Notifications */}

          <button
            type="button"
            onClick={() =>
              setShowNotifications((current) => !current)
            }
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#F5F5F7] hover:text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
          >
            <Bell size={18} strokeWidth={1.8} />

            <span className="absolute right-[7px] top-[6px] h-1.5 w-1.5 rounded-full bg-[#FF4444]" />
          </button>

          <div className="ml-1 hidden h-8 w-px bg-[#E9E9EC] sm:block" />

          <img
            src={avatarUrl}
            alt="Portrait of Alex Johnson"
            className="ml-1 h-9 w-9 rounded-full border-2 border-[#00BFA5] object-cover"
          />

          <span className="hidden pl-1 text-[13px] font-semibold text-[#0F1F3D] sm:block">
            Alex Johnson
          </span>

          {/* Notifications popup */}

          {showNotifications && (
            <div
              role="status"
              className="absolute right-5 top-[58px] w-64 rounded-xl border border-[#E5E5E5] bg-white p-4 text-sm shadow-[0_12px_30px_rgba(15,31,61,0.12)] sm:right-8"
            >
              <strong className="block text-[#0F1F3D]">
                Notifications
              </strong>

              <span className="mt-1 block text-[#667085]">
                Your Yosemite trip is ready to review.
              </span>
            </div>
          )}
        </nav>
      </header>

      {/* ================= SEARCH ================= */}

      {showSearch && (
        <div className="border-b border-[#E5E5E5] bg-white px-5 py-3 sm:px-8">
          <label className="mx-auto flex max-w-xl items-center gap-2 rounded-lg border border-[#DCDDE2] px-3 py-2 text-sm text-[#888] shadow-sm">
            <Search size={16} />

            <input
              autoFocus
              type="search"
              placeholder="Search your trips and places"
              className="w-full bg-transparent outline-none placeholder:text-[#A0A3AA]"
              aria-label="Search your trips and places"
            />
          </label>
        </div>
      )}

      {/* ================= MAIN LAYOUT ================= */}

      <div className="flex min-h-[calc(100vh-64px)]">

        {/* ================= SIDEBAR ================= */}

        <aside
          className={`fixed inset-y-16 left-0 z-20 w-[260px] border-r border-[#E5E5E5] bg-white p-6 shadow-[3px_0_14px_rgba(15,31,61,0.03)] transition-transform md:sticky md:top-16 md:block md:translate-x-0 ${
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

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A0A3AA]">
            Account
          </p>

          <nav
            aria-label="Account settings navigation"
            className="space-y-1"
          >
            {sidebarItems.map(
              ({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActiveItem(label);
                    setMobileNavOpen(false);
                  }}
                  aria-current={
                    activeItem === label
                      ? "page"
                      : undefined
                  }
                  className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40 ${
                    activeItem === label
                      ? "bg-[#E8F8F6] text-[#008F7C]"
                      : "text-[#666] hover:bg-[#F7F7F8] hover:text-[#0F1F3D]"
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

          <div className="my-6 border-t border-[#E9E9EC]" />

          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-[#FF4444] transition hover:bg-[#FFF2F2] focus:outline-none focus:ring-2 focus:ring-[#FF4444]/30"
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

                <p className="mt-1.5 text-[14px] text-[#888]">
                  Manage your profile and preferences
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open account menu"
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-[#E0E0E0] bg-white text-[#667085] md:hidden"
              >
                <span className="text-lg">☰</span>
              </button>
            </div>

            <div className="border-t border-[#E1E1E4]" />

            {/* ================= MY TRIPS (SAVED JOURNEYS) ================= */}

            {activeItem === "My Trips" && (
              <section
                className="py-8"
                aria-labelledby="my-trips-heading"
              >
                <h2
                  id="my-trips-heading"
                  className="text-[21px] font-bold tracking-[-0.4px]"
                >
                  My Trips
                </h2>

                <p className="mt-1.5 text-[14px] text-[#888]">
                  Journeys you saved from your searches
                </p>

                {savedJourneys.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-[#D6D8DE] bg-white p-8 text-center">
                    <p className="text-[14px] text-[#888]">
                      No saved journeys yet. Search for a trip
                      and press "Save" to keep it here.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-6 space-y-3">
                    {savedJourneys.map((journey) => (
                      <li
                        key={journey.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/trip", {
                              state: {
                                journeys: journey.journey
                                  ? [journey.journey]
                                  : [],
                              },
                            })
                          }
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F8F6] text-[#008F7C]">
                            <BriefcaseBusiness
                              size={18}
                              strokeWidth={1.8}
                            />
                          </span>
                          <span className="min-w-0">
                            <strong className="block truncate text-[14px] text-[#0F1F3D]">
                              {journey.journey
                                ? journey.journey.mode
                                : journey.mode}{" "}
                              trip
                            </strong>
                            <span className="block text-[13px] text-[#888]">
                              {journey.journey
                                ? journey.journey.legs
                                    .map((leg) => leg.mode)
                                    .join(" + ")
                                : journey.mode}
                              {journey.estimatedPrice != null &&
                                ` • $${journey.estimatedPrice.toFixed(0)}`}{" "}
                              • Saved on{" "}
                              {new Date(
                                journey.savedAt
                              ).toLocaleDateString()}
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeSavedJourney(journey.id)
                          }
                          aria-label="Delete saved journey"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#A0A3AA] transition hover:bg-[#FFF2F2] hover:text-[#FF4444]"
                        >
                          <X size={17} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* ================= PROFILE ================= */}

            {activeItem === "Profile" && (

            <section
              className="py-8"
              aria-labelledby="profile-heading"
            >
              <h2
                id="profile-heading"
                className="text-[21px] font-bold tracking-[-0.4px]"
              >
                Profile
              </h2>

              {/* Avatar */}

              <div className="my-6 flex items-center gap-5">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Portrait of Alex Johnson"
                    className="h-20 w-20 rounded-full border-[3px] border-[#00BFA5] object-cover shadow-[0_4px_14px_rgba(15,31,61,0.10)]"
                  />

                  <button
                    type="button"
                    aria-label="Edit avatar"
                    className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#00BFA5] text-white shadow-sm"
                  >
                    <Plus
                      size={13}
                      strokeWidth={2.5}
                    />
                  </button>
                </div>

                <p className="max-w-[330px] text-[13px] leading-5 text-[#888]">
                  Update your avatar by clicking the image.
                  288x288 px recommended in PNG or JPG
                  format only.
                </p>
              </div>

              {/* Profile fields */}

              <div className="space-y-4">

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                    Full Name
                  </span>

                  <input
                    value={profile.fullName}
                    onChange={(event) =>
                      updateProfile(
                        "fullName",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                    Nickname
                  </span>

                  <input
                    value={profile.nickname}
                    onChange={(event) =>
                      updateProfile(
                        "nickname",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                      Email
                    </span>

                    <input
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        updateProfile(
                          "email",
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                      Phone
                    </span>

                    <input
                      value={profile.phone}
                      onChange={(event) =>
                        updateProfile(
                          "phone",
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                    />
                  </label>

                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                    Address
                  </span>

                  <input
                    value={profile.address}
                    onChange={(event) =>
                      updateProfile(
                        "address",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                      Occupation
                    </span>

                    <input
                      value={profile.occupation}
                      onChange={(event) =>
                        updateProfile(
                          "occupation",
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                      Location
                    </span>

                    <span className="relative block">

                      <select
                        value={profile.location}
                        onChange={(event) =>
                          updateProfile(
                            "location",
                            event.target.value
                          )
                        }
                        className="h-11 w-full appearance-none rounded-lg border border-[#E0E0E0] bg-white px-3 pr-9 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                      >
                        <option>
                          United States
                        </option>
                        <option>Canada</option>
                        <option>
                          United Kingdom
                        </option>
                        <option>Nepal</option>
                      </select>

                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-3.5 text-[#888]"
                      />

                    </span>
                  </label>

                </div>
              </div>

              {/* Buttons */}

              <div className="mt-7 flex flex-wrap items-center justify-end gap-3">

                <span
                  role="status"
                  className="mr-auto text-[13px] font-medium text-[#00A891]"
                >
                  {savedMessage}
                </span>

                <button
                  type="button"
                  onClick={discardProfile}
                  className="h-10 rounded-full border border-[#26334A] bg-white px-5 text-[13px] font-semibold text-[#4D5868] transition hover:bg-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
                >
                  Discard
                </button>

                <button
                  type="button"
                  onClick={saveProfile}
                  className="h-10 rounded-full bg-[#00BFA5] px-5 text-[13px] font-semibold text-white shadow-[0_5px_12px_rgba(0,191,165,0.18)] transition hover:bg-[#00A891] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
                >
                  Save Changes
                </button>

              </div>
            </section>
            )}

            {/* ================= SECURITY ================= */}

            {activeItem === "Profile" && (
            <>
            <div className="border-t border-[#E1E1E4]" />

            <section
              className="py-8"
              aria-labelledby="security-heading"
            >
              <h2
                id="security-heading"
                className="text-[21px] font-bold tracking-[-0.4px]"
              >
                Security
              </h2>

              <div className="mt-6 max-w-[640px] space-y-4">

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                    Current password
                  </span>

                  <input
                    type="password"
                    defaultValue="password"
                    className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                    New password
                  </span>

                  <input
                    type="password"
                    defaultValue="password"
                    className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#666]">
                    Confirm new password
                  </span>

                  <input
                    type="password"
                    defaultValue="password"
                    className="h-11 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-[14px] text-[#0F1F3D] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#00BFA5]/10"
                  />
                </label>

              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setSavedMessage(
                      "Password updated securely"
                    )
                  }
                  className="h-10 rounded-full bg-[#00BFA5] px-5 text-[13px] font-semibold text-white shadow-[0_5px_12px_rgba(0,191,165,0.18)] transition hover:bg-[#00A891] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
                >
                  Update Password
                </button>
              </div>
            </section>
            </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};