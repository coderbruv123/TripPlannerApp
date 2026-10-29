import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Compass,
  Globe2,
  MapPin,
  Search,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { clearSavedTrips, listSavedTrips, loadSavedTrips, removeSavedTrip, subscribeSavedTripsChanged } from "../utils/tripStore";
import { formatSavedRange, travellersLabel } from "../utils/format";
import type { SavedTrip } from "../types/trip";

type SortKey = "recent" | "departure" | "budget" | "name";
type TimeFilter = "all" | "upcoming" | "past";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently saved" },
  { value: "departure", label: "Departure date" },
  { value: "budget", label: "Budget (high → low)" },
  { value: "name", label: "Name A–Z" },
];

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const GRADIENTS = [
  "linear-gradient(135deg, #0E5E5A 0%, #0B3A46 100%)",
  "linear-gradient(135deg, #2E90FA 0%, #0B1B33 100%)",
  "linear-gradient(135deg, #F79009 0%, #7A2E0E 100%)",
  "linear-gradient(135deg, #7A5AF8 0%, #0B1B33 100%)",
  "linear-gradient(135deg, #0E9384 0%, #7FD6C9 100%)",
  "linear-gradient(135deg, #D92D20 0%, #7A271A 100%)",
];

function gradientFor(title: string): string {
  const sum = [...title].reduce((total, char) => total + char.charCodeAt(0), 0);

  return GRADIENTS[sum % GRADIENTS.length];
}

function startOfToday(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function departureDate(trip: SavedTrip): Date | null {
  if (!trip.from) return null;

  const date = new Date(`${trip.from}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isUpcoming(trip: SavedTrip): boolean {
  const date = departureDate(trip);

  return date ? date >= startOfToday() : false;
}

function savedAgo(value: string): string {
  const saved = new Date(value);

  if (Number.isNaN(saved.getTime())) return "Saved";

  const days = Math.floor((Date.now() - saved.getTime()) / 86_400_000);

  if (days <= 0) return "Saved today";
  if (days === 1) return "Saved yesterday";
  if (days < 30) return `Saved ${days} days ago`;

  return `Saved ${saved.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

function budgetValue(trip: SavedTrip): number {
  const parsed = Number(trip.budget);

  return Number.isFinite(parsed) ? parsed : -1;
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${tone}`}>
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">
          {label}
        </p>
        <p className="mt-0.5 text-[20px] font-extrabold leading-tight text-ink">{value}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted">{hint}</p>
      </div>
    </div>
  );
}

export default function SavedTripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  useEffect(() => {
    loadSavedTrips().then((trips) => setTrips(trips));

    const unsubscribe = subscribeSavedTripsChanged(() =>
      setTrips(listSavedTrips())
    );

    return () => unsubscribe();
  }, []);

  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const countries = useMemo(
    () => new Set(trips.map((trip) => trip.country).filter(Boolean)),
    [trips]
  );

  const upcoming = useMemo(() => trips.filter(isUpcoming), [trips]);

  const nextDeparture = useMemo(() => {
    const dates = upcoming
      .map(departureDate)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return "No dates set";

    return dates[0].toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [upcoming]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = trips.filter((trip) => {
      const matchesQuery =
        needle.length === 0 ||
        `${trip.title} ${trip.country}`.toLowerCase().includes(needle);

      if (!matchesQuery) return false;

      if (timeFilter === "upcoming") return isUpcoming(trip);
      if (timeFilter === "past") {
        const date = departureDate(trip);

        return date ? date < startOfToday() : false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "departure") {
        const left = departureDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const right = departureDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        return left - right;
      }

      if (sort === "budget") return budgetValue(b) - budgetValue(a);
      if (sort === "name") return a.title.localeCompare(b.title);

      return a.savedAt < b.savedAt ? 1 : -1;
    });
  }, [trips, query, timeFilter, sort]);

  const remove = async (id: string) => {
    const trips = await removeSavedTrip(id);
    setTrips(trips);
  };

  const clearAll = () => {
    if (!window.confirm("Remove every saved trip from this browser?")) return;

    setTrips(clearSavedTrips());
  };

  const hasFilters = query.trim().length > 0 || timeFilter !== "all";

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <main className="mx-auto max-w-[1320px] px-4 pb-14 pt-9 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">
              <Compass className="h-3.5 w-3.5" />
              Your trips
            </span>

            <h1 className="mt-2 text-[clamp(1.8rem,3.2vw,2.4rem)] font-extrabold leading-tight tracking-[-0.03em] text-navy">
              Saved trips
            </h1>

            <p className="mt-2 max-w-[54ch] text-[14px] leading-relaxed text-muted">
              Every itinerary you kept from this browser. Reopen one with its
              dates, travellers and budget still filled in.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-strong"
          >
            Plan a new trip
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Compass className="h-[18px] w-[18px]" />}
            label="Trips saved"
            value={trips.length}
            hint={trips.length === 1 ? "1 itinerary in this browser" : `${trips.length} itineraries in this browser`}
            tone="bg-brand-50 text-brand"
          />
          <StatCard
            icon={<Globe2 className="h-[18px] w-[18px]" />}
            label="Countries"
            value={countries.size}
            hint={countries.size === 1 ? "One country covered" : "Across your saved trips"}
            tone="bg-sky-brand-50 text-sky-brand"
          />
          <StatCard
            icon={<CalendarClock className="h-[18px] w-[18px]" />}
            label="Upcoming"
            value={upcoming.length}
            hint={`Next: ${nextDeparture}`}
            tone="bg-accent-50 text-accent"
          />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-surface p-2.5 shadow-[var(--shadow-card)]">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
              aria-hidden="true"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by destination or country"
              aria-label="Search saved trips"
              className="h-9 w-full rounded-lg border border-line bg-canvas pl-8 pr-2.5 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:bg-surface"
            />
          </div>

          <div className="flex rounded-lg border border-line bg-canvas p-0.5" role="group" aria-label="Filter by trip date">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setTimeFilter(filter.value)}
                aria-pressed={timeFilter === filter.value}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition ${
                  timeFilter === filter.value
                    ? "bg-surface text-ink shadow-[var(--shadow-card)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Sort saved trips"
            className="h-9 rounded-lg border border-line bg-canvas px-2 text-[12.5px] font-semibold text-body outline-none transition focus:border-brand"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {trips.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-muted transition hover:bg-danger-50 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear all
            </button>
          )}
        </div>

        <p className="mt-3 text-[12px] text-muted" aria-live="polite">
          Showing {visible.length} of {trips.length} saved {trips.length === 1 ? "trip" : "trips"}
        </p>

        {trips.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-dashed border-line bg-surface px-6 py-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand">
              <MapPin className="h-5 w-5" />
            </span>

            <h2 className="mt-4 text-[16px] font-bold text-ink">No saved trips yet</h2>

            <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-relaxed text-muted">
              Plan a trip from the home page, then hit Save in the trip workspace —
              it will show up here with its dates and budget.
            </p>

            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-strong"
            >
              Start planning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-dashed border-line bg-surface px-6 py-12 text-center">
            <h2 className="text-[15px] font-bold text-ink">No trips match those filters</h2>

            <p className="mt-1 text-[12.5px] text-muted">
              Try a different search term or switch back to all trips.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTimeFilter("all");
                }}
                className="mt-4 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((trip) => {
              const upcomingTrip = isUpcoming(trip);

              return (
                <article
                  key={trip.id}
                  className="group flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-[var(--shadow-float)]"
                >
                  <div
                    className="relative flex h-[76px] items-center gap-3 px-4"
                    style={{ background: gradientFor(trip.title) }}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-[11px] border border-white/25 bg-white/15 text-[12px] font-extrabold text-white backdrop-blur">
                      {trip.title.slice(0, 2).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-bold leading-tight text-white">
                        {trip.title}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-white/80">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {trip.country || "Destination"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        upcomingTrip
                          ? "bg-white text-[#05463F]"
                          : "bg-black/25 text-white/85"
                      }`}
                    >
                      {upcomingTrip ? "Upcoming" : "Past"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <dl className="space-y-1.5 text-[12.5px] text-body">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
                        {formatSavedRange(trip.from, trip.to)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
                        {travellersLabel(trip.travelers, 0)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
                        {trip.budget ? `$${trip.budget} budget` : "No budget set"}
                      </div>
                    </dl>

                    <p className="mt-3 text-[11.5px] text-faint">{savedAgo(trip.savedAt)}</p>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-3.5">
                      <Link
                        to={trip.url}
                        className="inline-flex items-center gap-1.5 rounded-lg text-[12.5px] font-semibold text-brand-strong hover:underline"
                      >
                        Open trip
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => remove(trip.id)}
                        aria-label={`Remove ${trip.title}`}
                        title="Remove trip"
                        className="grid h-8 w-8 place-items-center rounded-md text-faint transition hover:bg-danger-50 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
