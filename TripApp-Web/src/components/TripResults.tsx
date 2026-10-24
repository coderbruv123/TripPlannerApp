import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import type { Geometry } from "geojson";

import {
  ArrowLeft,
  Bike,
  Bookmark,
  BookmarkCheck,
  BusFront,
  CalendarDays,
  CarFront,
  Check,
  CircleDot,
  Download,
  Footprints,
  Info,
  Loader2,
  MapPin,
  Moon,
  Plane,
  Plus,
  Route as RouteIcon,
  Share2,
  TrainFront,
  Sun,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

import Navbar from "./Navbar";
import DestinationCombobox from "./planner/DestinationCombobox";

import { searchTrips } from "../api/trips";
import { buildTripUrl, parseTripParams } from "../utils/tripUrl";
import {
  countNights,
  formatDay,
  formatDistance,
  formatDuration,
  formatPrice,
  formatRange,
  travellersLabel,
} from "../utils/format";
import { downloadCalendar } from "../utils/ics";
import { isTripSaved, saveTrip } from "../utils/tripStore";
import { toggleTheme, useTheme } from "../utils/theme";

import type {
  AddedStop,
  Destination,
  FlightOption,
  RouteOption,
  TripPlan,
} from "../types/trip";

type Position = [number, number];

const STOPS_KEY = (query: string) => `tp.stops:${query}`;

function modeIcon(type: string) {
  const key = type.toLowerCase();

  if (key.includes("walk") || key.includes("foot")) return Footprints;
  if (key.includes("cycl") || key.includes("bike")) return Bike;
  if (key.includes("bus") || key.includes("coach")) return BusFront;
  if (key.includes("train") || key.includes("rail")) return TrainFront;
  if (key.includes("flight") || key.includes("plane")) return Plane;

  return CarFront;
}

function extractCoordinates(geometry: unknown): Position[] {
  const typed = geometry as {
    type?: string;
    coordinates?: unknown;
  };

  const coordinates = typed.coordinates;

  if (!Array.isArray(coordinates)) return [];

  const positions: Position[] = [];

  const walkLine = (line: unknown[]) => {
    for (const point of line) {
      if (
        Array.isArray(point) &&
        typeof point[0] === "number" &&
        typeof point[1] === "number"
      ) {
        positions.push([point[0], point[1]]);
      }
    }
  };

  if (typed.type === "Point") {
    walkLine(coordinates);
    return positions;
  }

  for (const line of coordinates) {
    if (Array.isArray(line)) walkLine(line);
  }

  return positions;
}

function readStops(query: string): Record<number, AddedStop[]> {
  try {
    const raw = localStorage.getItem(STOPS_KEY(query));

    return raw ? (JSON.parse(raw) as Record<number, AddedStop[]>) : {};
  } catch {
    return {};
  }
}

export default function TripResults() {
  const [params] = useSearchParams();

  const query = params.toString();
  const plan = useMemo(() => parseTripParams(params), [params]);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [flight, setFlight] = useState<FlightOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);

  const [extraStops, setExtraStops] = useState<Record<number, AddedStop[]>>(
    () => (plan ? readStops(query) : {})
  );
  const [addStopKey, setAddStopKey] = useState(0);

  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // One app-wide theme: the navbar toggle and this one stay in sync.
  const dark = useTheme() === "dark";

  const mapRef = useRef<MapRef | null>(null);
  const mapPaneRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- fetch routes ---------------- */

  useEffect(() => {
    if (!plan) return;

    let cancelled = false;

    setLoading(true);
    setError(null);

    searchTrips(plan.origin, plan.destination)
      .then((result) => {
        if (cancelled) return;

        setRoutes(result.routes);
        setFlight(result.flight ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        console.error(err);
        setError("Couldn't load routes for this trip. Try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plan, reloadKey]);

  /* ---------------- derived ---------------- */

  const days = useMemo(() => {
    const from = plan?.dates?.from;

    if (!from) return [null];

    const to = plan?.dates?.to ?? from;
    const total = Math.min(
      21,
      Math.max(
        1,
        Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
      )
    );

    return Array.from({ length: total }, (_, index) => {
      const date = new Date(from);
      date.setDate(date.getDate() + index);

      return date;
    });
  }, [plan]);

  const safeDay = Math.min(activeDay, days.length - 1);

  const availableRoutes = routes.filter((route) => route.available);

  const selectedRoute =
    availableRoutes.find((route) => route.type === selectedType) ??
    availableRoutes[0] ??
    null;

  const fastest = availableRoutes.reduce<RouteOption | null>((best, route) => {
    if (route.durationMinutes == null) return best;
    if (!best || best.durationMinutes == null) return route;

    return route.durationMinutes < best.durationMinutes ? route : best;
  }, null);

  const cheapest = availableRoutes.reduce<RouteOption | null>((best, route) => {
    if (route.estimatedPrice == null) return best;
    if (!best || best.estimatedPrice == null) return route;

    return route.estimatedPrice < best.estimatedPrice ? route : best;
  }, null);

  const budgetNumber = Number(plan?.budget ?? "");
  const hasBudget = Number.isFinite(budgetNumber) && budgetNumber > 0;
  const travellers = (plan?.adults ?? 0) + (plan?.children ?? 0);

  const transportCost = selectedRoute?.estimatedPrice ?? null;
  const remaining =
    hasBudget && transportCost !== null ? budgetNumber - transportCost : null;

  const routeGeometry = useMemo(() => {
    if (!selectedRoute?.geometry) return null;

    try {
      return JSON.parse(selectedRoute.geometry) as unknown;
    } catch {
      return null;
    }
  }, [selectedRoute]);

  const routeBounds = useMemo(() => {
    if (!routeGeometry) return null;

    const points = extractCoordinates(routeGeometry);

    if (points.length === 0) return null;

    let south = Infinity;
    let north = -Infinity;
    let west = Infinity;
    let east = -Infinity;

    for (const [longitude, latitude] of points) {
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
    }

    return new LngLatBounds([south, west], [north, east]);
  }, [routeGeometry]);

  useEffect(() => {
    if (!mapRef.current || !routeBounds) return;

    mapRef.current.fitBounds(routeBounds, { padding: 70, duration: 600 });
  }, [routeBounds]);

  /* MapLibre only listens to window resizes. The workspace reflows on its
     own (panels, mobile sheet), so keep the canvas in sync with its box. */
  useEffect(() => {
    const node = mapPaneRef.current;

    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  /* ---------------- persistence ---------------- */

  useEffect(() => {
    if (!plan) return;

    setSaved(isTripSaved(query));
  }, [plan, query]);

  useEffect(() => {
    if (!plan) return;

    try {
      localStorage.setItem(STOPS_KEY(query), JSON.stringify(extraStops));
    } catch {
      /* storage blocked — stops stay for this session only */
    }
  }, [extraStops, plan, query]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 2600);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ---------------- actions ---------------- */

  const stopsForDay = extraStops[safeDay] ?? [];

  const addStop = (destination: Destination | null) => {
    if (!destination) return;

    setExtraStops((current) => ({
      ...current,
      [safeDay]: [
        ...(current[safeDay] ?? []),
        {
          id: `${destination.latitude}-${destination.longitude}-${Date.now()}`,
          name: destination.name,
          country: destination.country,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      ],
    }));

    setAddStopKey((value) => value + 1);
    setToast(`Added ${destination.name} to day ${safeDay + 1}`);
  };

  const removeStop = (id: string) => {
    setExtraStops((current) => ({
      ...current,
      [safeDay]: (current[safeDay] ?? []).filter((stop) => stop.id !== id),
    }));
  };

  const handleSave = () => {
    if (!plan) return;

    if (saved) {
      setToast("This trip is already saved");
      return;
    }

    saveTrip({
      id: query,
      title: plan.destination.name,
      country: plan.destination.country,
      from: plan.dates?.from
        ? plan.dates.from.toISOString().slice(0, 10)
        : undefined,
      to: plan.dates?.to ? plan.dates.to.toISOString().slice(0, 10) : undefined,
      travelers: plan.adults + plan.children,
      budget: plan.budget,
      url: `${window.location.pathname}?${query}`,
      savedAt: new Date().toISOString(),
    });

    setSaved(true);
    setToast("Saved — find it under Saved trips");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Link copied — it reopens this exact trip");
    } catch {
      setToast("Couldn't copy the link. Select the address bar instead.");
    }
  };

  const handleExport = () => {
    if (!plan) return;

    downloadCalendar(plan);
    setToast("Calendar file downloaded");
  };

  /* ---------------- states ---------------- */

  if (!plan) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />

        <div className="mx-auto max-w-[560px] px-4 py-24 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand">
            <MapPin className="h-6 w-6" />
          </span>

          <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-navy">
            This trip link is incomplete
          </h1>

          <p className="mt-2 text-[13.5px] text-muted">
            A trip needs a destination and a starting point. Start a new plan and
            the link will carry everything else.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-strong"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the planner
          </Link>
        </div>
      </div>
    );
  }

  const planUrl = buildTripUrl(plan as TripPlan);

  return (
    <main className="min-h-screen bg-canvas pb-20 lg:pb-0">
      <Navbar />

      <div className="mx-auto max-w-[1560px] px-4 py-4 sm:px-6">
        {/* trip header */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={planUrl.replace("/trip", "/")}
            aria-label="Back to planner"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-muted transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-[19px] font-bold tracking-[-0.02em] text-navy">
              {plan.destination.name}
              {plan.destination.country ? (
                <span className="ml-2 text-[14px] font-medium text-muted">
                  {plan.destination.country}
                </span>
              ) : null}
            </h1>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
              <span>{formatRange(plan.dates)}</span>

              {countNights(plan.dates) > 0 && (
                <>
                  <span className="text-faint">·</span>
                  <span>{countNights(plan.dates)} nights</span>
                </>
              )}

              <span className="text-faint">·</span>
              <span>{travellersLabel(plan.adults, plan.children)}</span>

              {saved && (
                <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-strong">
                  Saved
                </span>
              )}
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toggleTheme()}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              title={dark ? "Light theme" : "Dark theme"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:border-brand-100 hover:text-brand-strong"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition ${
                saved
                  ? "border-brand-100 bg-brand-50 text-brand-strong"
                  : "border-line bg-surface text-ink hover:border-brand-100 hover:text-brand-strong"
              }`}
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {saved ? "Saved" : "Save"}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand-100 hover:text-brand-strong"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand-100 hover:text-brand-strong"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* workspace */}
        <div className="mt-3 grid gap-3.5 lg:h-[calc(100vh-190px)] lg:min-h-[560px] lg:grid-cols-[340px_minmax(0,1fr)_352px]">
          {/* ---------------- itinerary ---------------- */}
          <section
            id="trip-plan"
            className="order-2 flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-line bg-surface lg:order-1"
            aria-label="Trip plan"
          >
            <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
              <div className="min-w-0">
                <h2 className="text-[14px] font-bold text-ink">Trip plan</h2>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {plan.origin.label} → {plan.destination.name}
                </p>
              </div>

              <span className="ml-auto shrink-0 rounded-md border border-line bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">
                {days.length} {days.length === 1 ? "day" : "days"}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-line-soft px-3 py-2.5">
              {days.map((date, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveDay(index)}
                  aria-pressed={index === safeDay}
                  className={`flex min-w-[52px] flex-col items-center rounded-lg border px-2 py-1 transition ${
                    index === safeDay
                      ? "border-brand bg-brand text-white"
                      : "border-line text-muted hover:border-brand-100 hover:text-brand-strong"
                  }`}
                >
                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-[0.05em] ${
                      index === safeDay ? "text-white/80" : "text-faint"
                    }`}
                  >
                    Day
                  </span>
                  <span
                    className={`text-[13px] font-extrabold ${
                      index === safeDay ? "text-white" : "text-ink"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`text-[9.5px] ${
                      index === safeDay ? "text-white/80" : "text-faint"
                    }`}
                  >
                    {date
                      ? date.toLocaleDateString("en-GB", { weekday: "short" })
                      : "—"}
                  </span>
                </button>
              ))}
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
              {/* route */}
              <div className="relative">
                <div className="absolute bottom-3 left-[9px] top-4 w-px bg-brand-100" />

                <div className="relative flex gap-2.5 pb-3">
                  <span className="z-[1] mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 border-[#2E90FA] bg-[#EAF3FF]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2E90FA]" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-faint">
                      Start
                    </p>
                    <p className="truncate text-[13px] font-bold text-ink">
                      {plan.origin.label}
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-2.5 pb-3">
                  <span className="z-[1] mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 border-brand bg-brand-50">
                    <MapPin className="h-2.5 w-2.5 text-brand" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-faint">
                      Arrive
                    </p>
                    <p className="truncate text-[13px] font-bold text-ink">
                      {plan.destination.name}
                    </p>

                    {selectedRoute && (
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-muted">
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-1.5 py-0.5 font-semibold text-body">
                          {(() => {
                            const Icon = modeIcon(selectedRoute.type);
                            return <Icon className="h-3 w-3 text-brand" />;
                          })()}
                          {formatDuration(selectedRoute.durationMinutes)}
                        </span>
                        <span>{formatDistance(selectedRoute.distanceKm)}</span>
                        <span className="text-faint">·</span>
                        <span>{formatPrice(selectedRoute.estimatedPrice)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* day stops */}
              <div className="mt-4 flex items-center gap-2 border-t border-line-soft pt-3">
                <h3 className="text-[12px] font-bold text-ink">
                  {days[safeDay]
                    ? formatDay(days[safeDay])
                    : `Day ${safeDay + 1}`}
                </h3>

                <span className="text-[11px] text-muted">
                  {stopsForDay.length}{" "}
                  {stopsForDay.length === 1 ? "place" : "places"}
                </span>
              </div>

              {stopsForDay.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-line bg-canvas px-4 py-5 text-center">
                  <p className="text-[12.5px] font-semibold text-ink">
                    Nothing planned for this day yet
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    Search a place below to add the first stop.
                  </p>
                </div>
              ) : (
                <ol className="mt-3 space-y-2">
                  {stopsForDay.map((stop, index) => (
                    <li
                      key={stop.id}
                      className="group flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] font-extrabold text-brand-strong">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-ink">
                          {stop.name}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {stop.country}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStop(stop.id)}
                        aria-label={`Remove ${stop.name}`}
                        className="rounded-md p-1 text-faint transition hover:bg-danger-50 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-3 rounded-xl border border-dashed border-line bg-canvas px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white">
                    <Plus className="h-3.5 w-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <DestinationCombobox
                      key={addStopKey}
                      compact
                      selected={null}
                      onSelect={addStop}
                      placeholder="Add a place to this day"
                      ariaLabel={`Add a place to day ${safeDay + 1}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* budget */}
            <div className="border-t border-line-soft px-4 py-3.5">
              {hasBudget ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-faint">
                      Budget
                    </p>

                    <p className="text-[12px] text-muted">
                      ${budgetNumber.toLocaleString()} total
                    </p>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted">Selected transport</span>
                      <span className="font-semibold text-ink">
                        {formatPrice(transportCost)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted">Per traveler</span>
                      <span className="font-semibold text-ink">
                        ${Math.round(budgetNumber / Math.max(1, travellers)).toLocaleString()}
                      </span>
                    </div>

                    {remaining !== null && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted">Left after transport</span>
                        <span
                          className={`font-semibold ${
                            remaining < 0 ? "text-danger" : "text-brand-strong"
                          }`}
                        >
                          ${Math.round(remaining).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {remaining !== null && transportCost !== null && (
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                      <div
                        className={`h-full rounded-full ${
                          remaining < 0 ? "bg-danger" : "bg-brand"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((transportCost / budgetNumber) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  )}

                  <p className="mt-2 text-[10.5px] text-faint">
                    Stays and activities aren't priced yet — only what the router
                    actually knows is counted.
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] text-muted">No budget set for this trip.</p>

                  <Link
                    to="/"
                    className="text-[12px] font-semibold text-brand-strong hover:underline"
                  >
                    Add one
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* ---------------- map ---------------- */}
          <div
            ref={mapPaneRef}
            className="relative order-1 min-h-[38vh] overflow-hidden rounded-[18px] border border-line bg-surface lg:order-2 lg:min-h-0"
          >
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: plan.destination.longitude,
                latitude: plan.destination.latitude,
                zoom: 11,
              }}
              mapStyle={
                dark
                  ? "https://tiles.openfreemap.org/styles/dark"
                  : "https://tiles.openfreemap.org/styles/bright"
              }
              style={{ width: "100%", height: "100%" }}
              attributionControl={false}
            >
              <NavigationControl position="top-right" showCompass={false} />

              {routeGeometry && (
                <Source
                  id="trip-route"
                  type="geojson"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: routeGeometry as Geometry,
                  }}
                >
                  <Layer
                    id="trip-route-casing"
                    type="line"
                    paint={{
                      "line-color": "#ffffff",
                      "line-width": 9,
                      "line-opacity": 0.85,
                    }}
                    layout={{ "line-cap": "round", "line-join": "round" }}
                  />
                  <Layer
                    id="trip-route-line"
                    type="line"
                    paint={{
                      "line-color": "#0E9384",
                      "line-width": 5,
                      "line-opacity": 0.95,
                    }}
                    layout={{ "line-cap": "round", "line-join": "round" }}
                  />
                </Source>
              )}

              <Marker
                longitude={plan.origin.longitude}
                latitude={plan.origin.latitude}
                anchor="center"
              >
                <span
                  className="block h-4 w-4 rounded-full border-2 border-white bg-[#2E90FA]"
                  style={{ boxShadow: "0 0 0 5px rgba(46,144,250,0.25)" }}
                />
              </Marker>

              <Marker
                longitude={plan.destination.longitude}
                latitude={plan.destination.latitude}
                anchor="bottom"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand text-white shadow-lg">
                  <MapPin className="h-4 w-4" />
                </span>
              </Marker>
            </Map>

            <div className="absolute left-3 top-3 z-10 flex items-center gap-2.5 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-[var(--shadow-card)] backdrop-blur">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#2E90FA]" />
                <span className="h-px w-4 border-t-2 border-dashed border-brand" />
                <MapPin className="h-3.5 w-3.5 text-brand" />
              </span>

              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-ink">
                  {plan.origin.label} → {plan.destination.name}
                </p>
                <p className="truncate text-[10.5px] text-muted">
                  {loading
                    ? "Loading route…"
                    : selectedRoute
                    ? `${selectedRoute.name} · ${formatDuration(
                        selectedRoute.durationMinutes
                      )} · ${formatDistance(selectedRoute.distanceKm)}`
                    : "No route selected"}
                </p>
              </div>
            </div>

            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-1 right-2 z-10 rounded bg-white/80 px-1.5 py-0.5 text-[9.5px] text-[#2F4A50] hover:underline"
            >
              © OpenStreetMap contributors · OpenFreeMap
            </a>

            {loading && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-surface/60 backdrop-blur-[1px]">
                <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-muted shadow-[var(--shadow-card)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Finding routes
                </span>
              </div>
            )}
          </div>

          {/* ---------------- getting there ---------------- */}
          <section
            id="getting-there"
            className="order-3 flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-line bg-surface"
            aria-label="Getting there"
          >
            <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
              <div>
                <h2 className="text-[14px] font-bold text-ink">Getting there</h2>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {availableRoutes.length} option
                  {availableRoutes.length === 1 ? "" : "s"} available
                </p>
              </div>

              <span className="ml-auto grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand">
                <RouteIcon className="h-4 w-4" />
              </span>
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
              {error && (
                <div className="mb-2 rounded-xl border border-danger/20 bg-danger-50 px-3 py-2.5">
                  <p className="text-[12px] font-medium text-danger">{error}</p>

                  <button
                    type="button"
                    onClick={() => setReloadKey((value) => value + 1)}
                    className="mt-1.5 text-[11.5px] font-bold text-danger underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {loading && (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="h-[58px] animate-pulse rounded-xl border border-line bg-canvas"
                    />
                  ))}
                </div>
              )}

              {!loading &&
                routes.map((route) => {
                  const Icon = modeIcon(route.type);
                  const isSelected = selectedRoute?.type === route.type;

                  return (
                    <button
                      key={`${route.type}-${route.name}`}
                      type="button"
                      disabled={!route.available}
                      onClick={() => setSelectedType(route.type)}
                      aria-pressed={isSelected}
                      className={`mb-2 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                        !route.available
                          ? "cursor-not-allowed border-line bg-canvas opacity-60"
                          : isSelected
                          ? "border-brand bg-brand-50 shadow-[inset_0_0_0_1px_var(--color-brand)]"
                          : "border-line bg-surface hover:border-brand-100 hover:bg-brand-50/40"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border ${
                          isSelected
                            ? "border-brand-100 bg-surface text-brand-strong"
                            : "border-line-soft bg-canvas text-body"
                        }`}
                      >
                        <Icon className="h-[17px] w-[17px]" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-bold text-ink">
                            {route.name || route.type}
                          </span>

                          {route.available && fastest?.type === route.type && (
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-brand-strong">
                              Fastest
                            </span>
                          )}

                          {route.available &&
                            cheapest?.type === route.type &&
                            fastest?.type !== route.type && (
                              <span className="rounded bg-sky-brand-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#175cd3]">
                                Cheapest
                              </span>
                            )}
                        </span>

                        <span
                          className={`mt-0.5 block text-[11.5px] leading-snug text-muted ${
                            route.available ? "truncate" : "line-clamp-2"
                          }`}
                          title={route.message ?? undefined}
                        >
                          {route.available
                            ? `${formatDuration(route.durationMinutes)} · ${formatDistance(
                                route.distanceKm
                              )}`
                            : route.message ?? "Not available for this route"}
                        </span>
                      </span>

                      <span className="shrink-0 text-right">
                        <span className="block text-[12px] font-bold text-ink">
                          {formatPrice(route.estimatedPrice)}
                        </span>
                        <span className="block text-[10px] text-muted">
                          {route.provider ?? "estimated"}
                        </span>
                      </span>

                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                          isSelected
                            ? "border-brand bg-brand"
                            : "border-line bg-surface"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                      </span>
                    </button>
                  );
                })}

              {!loading && flight && (
                <div className="mb-2 rounded-xl border border-line bg-canvas px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-line-soft bg-surface text-body">
                      <Plane className="h-[17px] w-[17px]" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                        Flight
                        <span className="rounded bg-line px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted">
                          {flight.available ? "Available" : "Not yet"}
                        </span>
                      </p>

                      <p className="mt-0.5 truncate text-[11.5px] text-muted">
                        {flight.message ?? "Flight search is not available yet."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!loading && routes.length === 0 && !error && (
                <p className="rounded-xl border border-dashed border-line bg-canvas px-3 py-4 text-center text-[12px] text-muted">
                  No transport options came back for this pair of points.
                </p>
              )}
            </div>

            <div className="border-t border-line-soft px-4 py-3">
              <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-faint">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Distances and durations come from the routing provider. A missing
                fare is shown as “Fare unavailable”, never as $0.
              </p>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-faint" />
                  {travellersLabel(plan.adults, plan.children)}
                </span>

                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-faint" />
                  {formatRange(plan.dates)}
                </span>

                <span className="inline-flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-faint" />
                  {hasBudget ? `$${budgetNumber.toLocaleString()}` : "No budget"}
                </span>
              </div>

              {plan.interests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {plan.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10.5px] font-semibold text-muted"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* mobile quick nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-surface px-2 pb-1.5 pt-1.5 shadow-[0_-6px_20px_-12px_rgba(12,27,51,0.4)] lg:hidden">
        {[
          { label: "Map", target: "map", icon: MapPin },
          { label: "Plan", target: "trip-plan", icon: CircleDot },
          { label: "Getting there", target: "getting-there", icon: RouteIcon },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() =>
              document
                .getElementById(item.target)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-semibold text-muted"
          >
            <item.icon className="h-[17px] w-[17px]" />
            {item.label}
          </button>
        ))}
      </nav>

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg lg:bottom-6"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
