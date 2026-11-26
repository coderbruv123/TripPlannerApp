import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Phone,
  Search,
  Star,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DestinationCombobox from "../components/planner/DestinationCombobox";
import { searchHotels, type HotelResult } from "../api/hotels";
import type { Destination } from "../types/trip";
import { formatDistance, formatPrice } from "../utils/format";

type SearchState = {
  key: string;
  hotels: HotelResult[];
  error: string | null;
  notice?: string;
  stale?: boolean;
  cached?: boolean;
};

type StaySort = "distance" | "stars" | "name";

function searchKey(destination: Destination, radiusKm: number): string {
  return `${destination.latitude}|${destination.longitude}|${radiusKm}`;
}

function staysStatus(state: SearchState | null): {
  label: string;
  tone: "live" | "cached" | "stale";
} | null {
  if (!state || state.error) return null;
  if (state.stale) {
    return { label: "Temporarily unavailable · showing saved results", tone: "stale" };
  }
  if (state.cached) {
    return { label: "Cached results", tone: "cached" };
  }
  return { label: "Live open data", tone: "live" };
}

export default function StaysPage() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [filterText, setFilterText] = useState("");
  const [sort, setSort] = useState<StaySort>("distance");
  const [state, setState] = useState<SearchState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const activeKey = destination ? searchKey(destination, radiusKm) : "";
  const active = state !== null && state.key === activeKey ? state : null;
  const loading = Boolean(destination) && !active;
  const hotels = active?.hotels ?? [];
  const error = active?.error ?? null;
  const status = staysStatus(active);

  const visibleHotels = useMemo(() => {
    const needle = filterText.trim().toLowerCase();

    const filtered = hotels.filter((hotel) => {
      if (!needle) return true;
      const haystack = `${hotel.name} ${hotel.address ?? ""} ${hotel.type ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "stars") {
        const as = a.stars ?? -1;
        const bs = b.stars ?? -1;
        if (as !== bs) return bs - as;
      }

      if (sort === "name") {
        const byName = a.name.localeCompare(b.name);
        if (byName !== 0) return byName;
      }

      return a.distanceKm - b.distanceKm;
    });
  }, [hotels, filterText, sort]);

  useEffect(() => {
    if (!destination) {
      setRefreshing(false);
      return;
    }

    const key = searchKey(destination, radiusKm);
    let cancelled = false;
    setRefreshing(true);

    searchHotels({
      latitude: destination.latitude,
      longitude: destination.longitude,
      radiusKm,
      limit: 12,
    })
      .then((result) => {
        if (!cancelled) {
          setState({
            key,
            hotels: result.hotels,
            error: null,
            notice: result.notice,
            stale: result.stale === true,
            cached: result.cached === true || result.stale === true,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => {
            const prevActive = prev !== null && prev.key === key ? prev : null;
            // On refresh failure, keep previous results visible with an inline error.
            if (prevActive && prevActive.hotels.length > 0 && !prevActive.error) {
              return {
                ...prevActive,
                notice:
                  err instanceof Error
                    ? err.message
                    : "Open stay data is temporarily unavailable. Please try again in a moment.",
                stale: true,
                cached: true,
              };
            }

            return {
              key,
              hotels: [],
              error:
                err instanceof Error
                  ? err.message
                  : "Open stay data is temporarily unavailable. Please try again in a moment.",
            };
          });
        }
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination, radiusKm, reloadKey]);

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <main className="mx-auto max-w-[1320px] px-4 pb-14 pt-9 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">
              <BedDouble className="h-3.5 w-3.5" />
              Places to stay
            </span>

            <h1 className="mt-2 text-[clamp(1.8rem,3.2vw,2.4rem)] font-extrabold leading-tight tracking-[-0.03em] text-navy">
              Stays
            </h1>

            <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-muted">
              Search real open-data hotels near a city or airport. Results come
              from OpenStreetMap, so prices may be unavailable until live fares
              are connected.
            </p>
          </div>

          {destination && active && !error && hotels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {status && (
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    status.tone === "stale"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : status.tone === "cached"
                      ? "border-sky-200 bg-sky-50 text-sky-800"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      status.tone === "stale"
                        ? "bg-amber-500"
                        : status.tone === "cached"
                        ? "bg-sky-500"
                        : "bg-emerald-500",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  {status.label}
                </span>
              )}
              <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-muted">
                {visibleHotels.length} of {hotels.length}{" "}
                {hotels.length === 1 ? "stay" : "stays"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-surface p-2.5 shadow-[var(--shadow-card)]">
          <div className="min-w-[260px] flex-1 rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
              Destination
            </p>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <DestinationCombobox
                  selected={destination}
                  onSelect={setDestination}
                  placeholder="Search a city or airport"
                  ariaLabel="Search destination for stays"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
            <MapPin className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
            <span className="sr-only">Search radius</span>
            <select
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              aria-label="Search radius"
              className="h-9 rounded-lg border border-line bg-canvas px-2 text-[12.5px] font-semibold text-body outline-none transition focus:border-brand"
            >
              {[5, 10, 20, 30].map((radius) => (
                <option key={radius} value={radius}>
                  Within {radius} km
                </option>
              ))}
            </select>
          </label>

          <input
            type="search"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Filter results by name"
            aria-label="Filter loaded stays by name"
            className="h-9 min-w-[180px] flex-1 rounded-lg border border-line bg-canvas px-3 text-[12.5px] text-ink outline-none transition placeholder:text-faint focus:border-brand sm:flex-none"
          />

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as StaySort)}
            aria-label="Sort stays"
            className="h-9 rounded-lg border border-line bg-canvas px-2 text-[12.5px] font-semibold text-body outline-none transition focus:border-brand"
          >
            <option value="distance">Sort: Distance</option>
            <option value="stars">Sort: Stars</option>
            <option value="name">Sort: Name</option>
          </select>

          <button
            type="button"
            onClick={() => {
              if (!destination) return;
              setReloadKey((value) => value + 1);
            }}
            disabled={!destination || loading || refreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
          >
            {loading || refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            {refreshing ? "Refreshing" : "Search stays"}
          </button>
        </div>

        <div className="mt-4">
          {!destination ? (
            <div className="rounded-[20px] border border-dashed border-line bg-surface px-6 py-12 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
                <BedDouble className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-[15px] font-bold text-ink">
                Search for a place to stay
              </h2>
              <p className="mt-1 text-[12.5px] text-muted">
                Pick a city or airport above to load real nearby hotels.
              </p>
            </div>
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="h-[168px] animate-pulse rounded-[18px] border border-line bg-surface"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[20px] border border-danger/20 bg-danger-50 px-6 py-8 text-center">
              <h2 className="text-[15px] font-bold text-danger">
                Couldn't load stays
              </h2>
              <p className="mt-1 text-[12.5px] text-danger/80">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                disabled={refreshing}
                className="mt-4 rounded-lg border border-danger/30 bg-surface px-3 py-2 text-[12.5px] font-semibold text-danger transition hover:bg-danger-50 disabled:opacity-50"
              >
                {refreshing ? "Retrying..." : "Try again"}
              </button>
            </div>
          ) : hotels.length === 0 ? (
            active?.notice || active?.stale ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-6 py-8 text-center">
                <h2 className="text-[15px] font-bold text-amber-900">
                  Open stay data is temporarily unavailable
                </h2>
                <p className="mt-1 text-[12.5px] text-amber-800">
                  {active.notice ??
                    "Live open-data stay results couldn't be loaded right now. Please try again in a moment."}
                </p>
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  disabled={refreshing}
                  className="mt-4 rounded-lg border border-amber-300 bg-surface px-3 py-2 text-[12.5px] font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  {refreshing ? "Refreshing..." : "Try again"}
                </button>
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-line bg-surface px-6 py-12 text-center">
                <h2 className="text-[15px] font-bold text-ink">
                  No hotels found nearby
                </h2>
                <p className="mt-1 text-[12.5px] text-muted">
                  Try a larger radius or a different destination.
                </p>
              </div>
            )
          ) : visibleHotels.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-line bg-surface px-6 py-12 text-center">
              <h2 className="text-[15px] font-bold text-ink">
                No stays match your filters
              </h2>
              <p className="mt-1 text-[12.5px] text-muted">
                Clear the name filter or change sorting to see the real results.
              </p>
              <button
                type="button"
                onClick={() => setFilterText("")}
                className="mt-4 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <>
              {active && status && status.tone !== "live" && (
                <div
                  className={[
                    "mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[11.5px]",
                    status.tone === "stale"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-sky-200 bg-sky-50 text-sky-800",
                  ].join(" ")}
                >
                  <p>
                    {active.notice ??
                      (status.tone === "stale"
                        ? "Live open-data is temporarily unavailable. Showing saved results."
                        : "Showing cached open-data results for faster loading.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((value) => value + 1)}
                    disabled={refreshing}
                    className="font-semibold underline disabled:opacity-50"
                  >
                    {refreshing ? "Refreshing..." : "Retry"}
                  </button>
                </div>
              )}
              <div
                className={[
                  "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity",
                  refreshing ? "opacity-60" : "opacity-100",
                ].join(" ")}
              >
              {visibleHotels.map((hotel) => (
                <article
                  key={hotel.id}
                  className="flex flex-col rounded-[18px] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-100"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                      <BedDouble className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14.5px] font-bold text-ink" title={hotel.name}>
                        {hotel.name}
                      </h3>
                      <p className="mt-0.5 truncate text-[12px] text-muted" title={hotel.address ?? undefined}>
                        {hotel.address ?? hotel.type ?? "Address not listed"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-faint" />
                      {formatDistance(hotel.distanceKm)} away
                    </span>

                    {hotel.stars != null && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#FDB022] text-[#FDB022]" />
                        {hotel.stars}-star
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-line-soft pt-3">
                    <div>
                      <p className="text-[18px] font-extrabold text-ink">
                        {hotel.estimatedPricePerNight != null &&
                        hotel.estimatedPricePerNight > 0
                          ? formatPrice(hotel.estimatedPricePerNight)
                          : "Price unavailable"}
                      </p>
                      <p className="text-[11px] text-muted">per night · indicative when shown</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {hotel.phone && (
                        <a
                          href={`tel:${hotel.phone}`}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-brand-100 hover:text-brand-strong"
                          aria-label={`Call ${hotel.name}`}
                          title="Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {hotel.website && (
                        <a
                          href={hotel.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink transition hover:border-brand-100 hover:text-brand-strong"
                        >
                          Website
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              </div>
            </>
          )}
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-[11px] text-faint">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Real stay data from OpenStreetMap via the app backend. Prices are
          unavailable unless a live fare source is connected.
        </p>
      </main>

      <Footer />
    </div>
  );
}
