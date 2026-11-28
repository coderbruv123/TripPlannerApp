import "maplibre-gl/dist/maplibre-gl.css";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import MapGL, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
} from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import type { Geometry } from "geojson";

import {
  ArrowLeft,
  BedDouble,
  Bike,
  Bookmark,
  BookmarkCheck,
  BusFront,
  CalendarDays,
  CarFront,
  Check,
  CircleDot,
  Download,
  ExternalLink,
  Footprints,
  Info,
  MapPin,
  Moon,
  Plane,
  Plus,
  Route as RouteIcon,
  Share2,
  Star,
  TrainFront,
  Sun,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import HummingbirdLoader from "./HummingbirdLoader";

import Navbar from "./Navbar";
import BudgetBreakdown from "./BudgetBreakdown";
import DestinationCombobox from "./planner/DestinationCombobox";

import { searchTrips } from "../api/trips";
import { searchHotels, type HotelResult } from "../api/hotels";
import { fetchItineraryLegs, type ItineraryLeg } from "../api/itinerary";
import { buildTripUrl, parseTripParams } from "../utils/tripUrl";
import {
  flightSearchUrl,
  routeSearchLabel,
  routeSearchUrl,
  staysSearchUrl,
} from "../utils/travelLinks";
import {
  countNights,
  formatDay,
  formatDistance,
  formatDuration,
  formatIndicativePrice,
  formatPrice,
  formatRange,
  travellersLabel,
} from "../utils/format";
import { downloadCalendar } from "../utils/ics";
import {
  isSavedTrip,
  listSavedTrips,
  loadSavedTrips,
  saveTrip,
  loadItineraryStops,
  addStopToTrip,
  deleteStopFromTrip,
} from "../utils/tripStore";
import { getToken } from "../api/authUtils";
import { toggleTheme, useTheme } from "../utils/theme";

import type {
  AddedStop,
  Destination,
  FlightOption,
  RouteOption,
  TripPlan,
  ItineraryStop,
} from "../types/trip";

type Position = [number, number];

// Stable, trip-unique key for the in-browser stops cache. Two plans that
// produce the identical URL query collide on `tp.stops:<query>`, so each
// plan gets its own short token while it is unsaved. Signed-in trips never
// write here anyway (savedTripId != null skips the write).
const guestTripToken = new Map<string, string>();

function stopsKey(plan: TripPlan | null, query: string): string {
  if (!plan) return `tp.stops:shared-guest`;
  const signature = [
    plan.destination.name,
    plan.origin.label,
    String(plan.destination.latitude),
    String(plan.origin.latitude),
  ].join("|");
  if (!guestTripToken.has(signature)) {
    guestTripToken.set(signature, `g${Math.random().toString(36).slice(2, 9)}`);
  }
  return `tp.stops:${guestTripToken.get(signature)}:${query}`;
}

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
    geometries?: unknown[];
  };

  if (typed.type === "GeometryCollection" && Array.isArray(typed.geometries)) {
    return typed.geometries.flatMap((child) => extractCoordinates(child));
  }

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

  // Point and LineString hold position arrays directly; MultiLineString /
  // Polygon hold arrays of position arrays.
  if (typed.type === "Point" || typed.type === "LineString") {
    walkLine(coordinates as unknown[]);
    return positions;
  }

  for (const line of coordinates) {
    if (Array.isArray(line)) walkLine(line);
  }

  return positions;
}

function readStops(plan: TripPlan | null, query: string): Record<number, AddedStop[]> {
  try {
    const raw = localStorage.getItem(stopsKey(plan, query));

    return raw ? (JSON.parse(raw) as Record<number, AddedStop[]>) : {};
  } catch {
    return {};
  }
}

export default function TripResults() {
  const [params] = useSearchParams();

  const query = params.toString();
  const plan = useMemo(() => parseTripParams(params), [params]);
  // Saved-trip links carry the row id so the account trip (and its saved
  // budget) resolves even when the stored URL is legacy or slightly different.
  const savedTripIdParam = params.get("tripId")?.trim() || null;

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [flight, setFlight] = useState<FlightOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedRouteChoice, setSelectedRouteChoice] = useState<RouteOption | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [routeSort, setRouteSort] = useState<
    "recommended" | "fastest" | "cheapest" | "fewest"
  >("recommended");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [routeModeFilter, setRouteModeFilter] = useState<string | "all">("all");

  const [extraStops, setExtraStops] = useState<Record<number, AddedStop[]>>(
    () => (plan ? readStops(plan, query) : {})
  );
  const [addStopKey, setAddStopKey] = useState(0);
  const [stopActionPending, setStopActionPending] = useState(false);

  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Account-scoped itinerary stops (backend). null until the trip is saved to
  // the account, after which the day list renders from the server itinerary.
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [serverStops, setServerStops] = useState<Record<number, ItineraryStop[]>>({});
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

  const routeModes = useMemo(
    () => Array.from(new Set(routes.map((route) => route.type))),
    [routes]
  );

  const routeSegmentCount = (route: RouteOption): number => {
    const segments = Array.isArray(route.segments) ? route.segments.length : 0;

    if (segments > 0) return segments;

    return route.available ? 1 : Number.MAX_SAFE_INTEGER;
  };

  const budgetNumber = Number(plan?.budget ?? "");
  const hasBudget = Number.isFinite(budgetNumber) && budgetNumber > 0;
  const travellers = (plan?.adults ?? 0) + (plan?.children ?? 0);

  type Recommendation = {
    score: number;
    reasons: string[];
    isBestOverall: boolean;
    transfers: number;
    budgetFit: "within" | "over" | "unknown";
  };

  const recommendations = useMemo(() => {
    const map = new Map<RouteOption, Recommendation>();
    const available = routes.filter((route) => route.available);

    const transfersFor = (route: RouteOption): number => {
      const segments = Array.isArray(route.segments) ? route.segments.length : 0;

      if (segments > 0) return Math.max(0, segments - 1);

      return 0;
    };

    const knownDurations = available
      .map((route) => route.durationMinutes)
      .filter((value): value is number => value != null && Number.isFinite(value));
    const knownPrices = available
      .map((route) => route.estimatedPrice)
      .filter((value): value is number => value != null && Number.isFinite(value));
    const transferValues = available.map(transfersFor);

    const minDuration = Math.min(...knownDurations);
    const maxDuration = Math.max(...knownDurations);
    const minPrice = Math.min(...knownPrices);
    const maxPrice = Math.max(...knownPrices);
    const minTransfers = Math.min(...transferValues);
    const maxTransfers = Math.max(...transferValues);

    const normalize = (value: number, min: number, max: number, fallback = 0.5) => {
      if (!Number.isFinite(value)) return fallback;
      if (max <= min) return 1;

      return 1 - (value - min) / (max - min);
    };

    const wTime = hasBudget ? 0.35 : 0.44;
    const wCost = hasBudget ? 0.3 : 0.37;
    const wTransfers = hasBudget ? 0.15 : 0.19;
    const wBudget = hasBudget ? 0.2 : 0;

    for (const route of routes) {
      const transfers = transfersFor(route);
      const price = route.estimatedPrice;
      const duration = route.durationMinutes;

      const budgetFit: Recommendation["budgetFit"] =
        !hasBudget || price == null
          ? "unknown"
          : price <= budgetNumber
          ? "within"
          : "over";

      if (!route.available) {
        map.set(route, {
          score: -1,
          reasons: [],
          isBestOverall: false,
          transfers,
          budgetFit,
        });
        continue;
      }

      const timeScore =
        duration != null && Number.isFinite(duration)
          ? normalize(duration, minDuration, maxDuration, 0.5)
          : 0.45;

      const costScore =
        price != null && Number.isFinite(price)
          ? normalize(price, minPrice, maxPrice, 0.5)
          : 0.45;

      const transferScore = normalize(transfers, minTransfers, maxTransfers, 1);

      let budgetScore = 0.5;

      if (hasBudget && price != null && Number.isFinite(price)) {
        if (price <= budgetNumber) {
          budgetScore = 1;
        } else {
          const overRatio = (price - budgetNumber) / Math.max(budgetNumber, 1);
          budgetScore = Math.max(0, 1 - overRatio * 0.8);
        }
      }

      const score =
        wTime * timeScore +
        wCost * costScore +
        wTransfers * transferScore +
        wBudget * budgetScore;

      map.set(route, {
        score,
        reasons: [],
        isBestOverall: false,
        transfers,
        budgetFit,
      });
    }

    const bestOverall = available.reduce<RouteOption | null>((best, route) => {
      if (!best) return route;

      const a = map.get(route)!;
      const b = map.get(best)!;

      if (a.score !== b.score) return a.score > b.score ? route : best;

      if (a.transfers !== b.transfers) {
        return a.transfers < b.transfers ? route : best;
      }

      const ad = route.durationMinutes ?? Number.POSITIVE_INFINITY;
      const bd = best.durationMinutes ?? Number.POSITIVE_INFINITY;

      if (ad !== bd) return ad < bd ? route : best;

      const ap = route.estimatedPrice ?? Number.POSITIVE_INFINITY;
      const bp = best.estimatedPrice ?? Number.POSITIVE_INFINITY;

      if (ap !== bp) return ap < bp ? route : best;

      return routes.indexOf(route) < routes.indexOf(best) ? route : best;
    }, null);

    if (bestOverall) {
      const rec = map.get(bestOverall)!;
      const reasons: string[] = [];

      if (fastest !== bestOverall && cheapest !== bestOverall) {
        reasons.push("Best balance");
      } else if (fastest === bestOverall && cheapest === bestOverall) {
        reasons.push("Best balance");
      }

      if (fastest === bestOverall) reasons.push("Fastest");
      if (cheapest === bestOverall && reasons.length < 2) reasons.push("Cheapest");

      if (
        rec.transfers === minTransfers &&
        maxTransfers !== minTransfers &&
        reasons.length < 2
      ) {
        reasons.push(rec.transfers === 0 ? "Direct route" : "Fewest transfers");
      }

      if (hasBudget && rec.budgetFit === "within" && reasons.length < 2) {
        reasons.push("Within budget");
      } else if (hasBudget && rec.budgetFit === "over" && reasons.length < 2) {
        reasons.push("Over budget");
      }

      if (reasons.length === 0) reasons.push("Best overall");

      map.set(bestOverall, {
        ...rec,
        isBestOverall: true,
        reasons: reasons.slice(0, 2),
      });
    }

    return map;
  }, [routes, fastest, cheapest, hasBudget, budgetNumber]);

  const displayedRoutes = useMemo(() => {
    const modeFiltered =
      routeModeFilter === "all"
        ? routes
        : routes.filter((route) => route.type === routeModeFilter);

    const availabilityFiltered = showAvailableOnly
      ? modeFiltered.filter((route) => route.available)
      : modeFiltered;

    const byRecommended = (a: RouteOption, b: RouteOption) =>
      routes.indexOf(a) - routes.indexOf(b);

    const sorted = [...availabilityFiltered];

    if (routeSort === "fastest") {
      sorted.sort((a, b) => {
        const ad = a.durationMinutes ?? Number.POSITIVE_INFINITY;
        const bd = b.durationMinutes ?? Number.POSITIVE_INFINITY;

        if (ad !== bd) return ad - bd;

        return byRecommended(a, b);
      });
    } else if (routeSort === "cheapest") {
      sorted.sort((a, b) => {
        const ap = a.estimatedPrice ?? Number.POSITIVE_INFINITY;
        const bp = b.estimatedPrice ?? Number.POSITIVE_INFINITY;

        if (ap !== bp) return ap - bp;

        return byRecommended(a, b);
      });
    } else if (routeSort === "fewest") {
      sorted.sort((a, b) => {
        const ac = routeSegmentCount(a);
        const bc = routeSegmentCount(b);

        if (ac !== bc) return ac - bc;

        return byRecommended(a, b);
      });
    } else {
      sorted.sort((a, b) => {
        const as = recommendations.get(a)?.score ?? -1;
        const bs = recommendations.get(b)?.score ?? -1;

        if (as !== bs) return bs - as;

        return byRecommended(a, b);
      });
    }

    return sorted;
  }, [routes, routeModeFilter, routeSort, showAvailableOnly, recommendations]);

  const visibleAvailableRoutes = useMemo(
    () => displayedRoutes.filter((route) => route.available),
    [displayedRoutes]
  );

  const selectedRoute = (() => {
    if (
      selectedRouteChoice &&
      visibleAvailableRoutes.includes(selectedRouteChoice)
    ) {
      return selectedRouteChoice;
    }

    if (visibleAvailableRoutes[0]) return visibleAvailableRoutes[0];

    if (selectedRouteChoice && availableRoutes.includes(selectedRouteChoice)) {
      return selectedRouteChoice;
    }

    return availableRoutes[0] ?? null;
  })();

  useEffect(() => {
    if (routeModeFilter !== "all" && !routeModes.includes(routeModeFilter)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRouteModeFilter("all");
    }
  }, [routeModeFilter, routeModes]);

  useEffect(() => {
    if (visibleAvailableRoutes.length === 0) return;

    if (!selectedRouteChoice || !visibleAvailableRoutes.includes(selectedRouteChoice)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRouteChoice(visibleAvailableRoutes[0]);
    }
  }, [visibleAvailableRoutes, selectedRouteChoice]);

  const transportCost = selectedRoute?.estimatedPrice ?? null;
  const remaining =
    hasBudget && transportCost !== null ? budgetNumber - transportCost : null;

  const overallRouteGeometry = useMemo(() => {
    if (!selectedRoute?.geometry) return null;

    try {
      return JSON.parse(selectedRoute.geometry) as unknown;
    } catch {
      return null;
    }
  }, [selectedRoute]);

  const isFlightRoute =
    selectedRoute?.type?.toLowerCase().includes("flight") ?? false;

  type RenderedRouteSegment = {
    geometry: unknown;
    kind: "flight" | "ground";
  };

  const routeSegmentGeometries = useMemo<RenderedRouteSegment[]>(() => {
    if (!isFlightRoute || !Array.isArray(selectedRoute?.segments)) return [];

    const rendered: RenderedRouteSegment[] = [];

    selectedRoute.segments.forEach((segment) => {
      if (!segment.geometry) return;

      try {
        const geometry = JSON.parse(segment.geometry) as unknown;
        const key = `${segment.type ?? ""} ${segment.name ?? ""}`.toLowerCase();
        const kind = /(flight|plane|fly)/i.test(key) ? "flight" : "ground";

        rendered.push({ geometry, kind });
      } catch {
        // Ignore malformed segment geometry and keep other segments/fallbacks.
      }
    });

    return rendered;
  }, [isFlightRoute, selectedRoute]);

  const hasSegmentRoute = routeSegmentGeometries.length > 0;

  const routeBounds = useMemo(() => {
    const geometries = hasSegmentRoute
      ? routeSegmentGeometries.map((segment) => segment.geometry)
      : overallRouteGeometry
      ? [overallRouteGeometry]
      : [];

    const points = geometries.flatMap((geometry) => extractCoordinates(geometry));

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

    // MapLibre bounds are [lng, lat], not [lat, lng].
    return new LngLatBounds([west, south], [east, north]);
  }, [hasSegmentRoute, overallRouteGeometry, routeSegmentGeometries]);

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

    setSaved(savedTripIdParam !== null || isSavedTrip(query));
  }, [plan, query, savedTripIdParam]);

  useEffect(() => {
    if (!plan || savedTripId !== null) return;

    try {
      localStorage.setItem(stopsKey(plan, query), JSON.stringify(extraStops));
    } catch {
      /* storage blocked — stops stay for this session only */
    }
  }, [extraStops, plan, query, savedTripId]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 2600);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ---------------- live stays near the destination ---------------- */

  const destinationKey = plan
    ? `${plan.destination.latitude}|${plan.destination.longitude}`
    : "";

  const [hotelState, setHotelState] = useState<{
    key: string;
    hotels: HotelResult[];
    failed: boolean;
    errorMessage?: string;
    notice?: string;
    stale?: boolean;
    cached?: boolean;
  } | null>(null);
  const [hotelReloadKey, setHotelReloadKey] = useState(0);
  const [hotelRefreshing, setHotelRefreshing] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

  useEffect(() => {
    if (!plan || !destinationKey) {
      setHotelRefreshing(false);
      return;
    }

    let cancelled = false;
    setHotelRefreshing(true);

    searchHotels({
      latitude: plan.destination.latitude,
      longitude: plan.destination.longitude,
      radiusKm: 8,
      limit: 4,
    })
      .then((result) => {
        if (!cancelled) {
          setHotelState({
            key: destinationKey,
            hotels: result.hotels,
            failed: false,
            notice: result.notice,
            stale: result.stale === true,
            cached: result.cached === true || result.stale === true,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHotelState((prev) => {
            const prevActive =
              prev !== null && prev.key === destinationKey ? prev : null;
            if (prevActive && prevActive.hotels.length > 0 && !prevActive.failed) {
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
              key: destinationKey,
              hotels: [],
              failed: true,
              errorMessage:
                err instanceof Error
                  ? err.message
                  : "Open stay data is temporarily unavailable. Please try again in a moment.",
            };
          });
        }
      })
      .finally(() => {
        if (!cancelled) setHotelRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plan, destinationKey, hotelReloadKey]);

  const hotelsMatch = hotelState !== null && hotelState.key === destinationKey;
  const nearbyHotels = hotelsMatch ? hotelState.hotels : [];
  const hotelsFailed = Boolean(hotelsMatch && hotelState.failed);
  const hotelsLoading = Boolean(destinationKey) && !hotelsMatch;
  const hotelStatus =
    hotelsMatch && !hotelsFailed && nearbyHotels.length > 0
      ? hotelState?.stale
        ? { label: "Saved results", tone: "stale" as const }
        : hotelState?.cached
        ? { label: "Cached", tone: "cached" as const }
        : { label: "Live", tone: "live" as const }
      : null;

  /* ---------------- actions ---------------- */

  const stopsForDay =
    savedTripId !== null ? (serverStops[safeDay] ?? []) : (extraStops[safeDay] ?? []);

  /* ---------------- travel legs between ordered stops ---------------- */

  const [legState, setLegState] = useState<{
    tripId: string;
    dayIndex: number;
    stopKey: string;
    legs: ItineraryLeg[];
    failed: boolean;
  } | null>(null);

  const legStopKey = stopsForDay.map((stop) => stop.id).join("|");

  useEffect(() => {
    if (!savedTripId || !legStopKey) return;

    let cancelled = false;

    fetchItineraryLegs(savedTripId, safeDay)
      .then((legs) => {
        if (!cancelled) {
          setLegState({
            tripId: savedTripId,
            dayIndex: safeDay,
            stopKey: legStopKey,
            legs,
            failed: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLegState({
            tripId: savedTripId,
            dayIndex: safeDay,
            stopKey: legStopKey,
            legs: [],
            failed: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [savedTripId, safeDay, legStopKey]);

  const legContextMatches =
    legState !== null &&
    legState.tripId === savedTripId &&
    legState.dayIndex === safeDay &&
    legState.stopKey === legStopKey;
  const legs = legContextMatches ? legState.legs : [];
  const legsFailed = Boolean(legContextMatches && legState.failed);
  const legsLoading = Boolean(savedTripId) && Boolean(legStopKey) && !legContextMatches && !legsFailed;

  const legForPair = (fromId: string, toId: string) =>
    legs.find((leg) => leg.fromStopId === fromId && leg.toStopId === toId);

  const addStop = async (destination: Destination | null) => {
    if (!destination || stopActionPending) return;

    setStopActionPending(true);

    try {
      if (savedTripId !== null) {
        // New stops go to the account itinerary instead of localStorage.
        const stop = await addStopToTrip(savedTripId, {
          dayIndex: safeDay,
          name: destination.name,
          country: destination.country,
          latitude: destination.latitude,
          longitude: destination.longitude,
          kind: "place",
        });

        setServerStops((current) => ({
          ...current,
          [safeDay]: [...(current[safeDay] ?? []), stop],
        }));
      } else {
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
      }

      setAddStopKey((value) => value + 1);
      setToast(`Added ${destination.name} to day ${safeDay + 1}`);
    } catch {
      setToast(`Couldn't add ${destination.name}. Try again.`);
    } finally {
      setStopActionPending(false);
    }
  };

  const removeStop = async (id: string, name: string) => {
    if (stopActionPending) return;

    setStopActionPending(true);

    try {
      if (savedTripId !== null) {
        await deleteStopFromTrip(savedTripId, id);
        setServerStops((current) => ({
          ...current,
          [safeDay]: (current[safeDay] ?? []).filter((s) => s.id !== id),
        }));
      } else {
        setExtraStops((current) => ({
          ...current,
          [safeDay]: (current[safeDay] ?? []).filter((stop) => stop.id !== id),
        }));
      }

      setToast(`Removed ${name} from day ${safeDay + 1}`);
    } catch {
      setToast(`Couldn't remove ${name}. Try again.`);
    } finally {
      setStopActionPending(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;

    if (saved) {
      setToast("This trip is already saved");
      return;
    }

    await saveTrip({
      id: query,
      title: plan.destination.name,
      country: plan.destination.country,
      from: plan.dates?.from
        ? plan.dates.from.toISOString().slice(0, 10)
        : undefined,
      to: plan.dates?.to ? plan.dates.to.toISOString().slice(0, 10) : undefined,
      travelers: plan.adults + plan.children,
      budget: plan.budget,
      originLat: plan.origin.latitude,
      originLng: plan.origin.longitude,
      destinationLat: plan.destination.latitude,
      destinationLng: plan.destination.longitude,
      url: `${window.location.pathname}?${query}`,
      savedAt: new Date().toISOString(),
    });

    setSaved(true);
    setToast("Saved — find it under Saved trips");

    // Move this trip onto the account (auth) and route its stops through the
    // server itinerary instead of localStorage.
    const trip = listSavedTrips().find(
      (t) => t.url === `${window.location.pathname}?${query}`
    );

    if (trip) {
      // Commit any stops the user already added this session into the server
      // itinerary before we render from the server.
      const pending = extraStops;
      if (Object.keys(pending).length > 0) {
        for (const [dayIndex, stops] of Object.entries(pending)) {
          for (const stop of stops) {
            await addStopToTrip(trip.id, {
              dayIndex: Number(dayIndex),
              name: stop.name,
              country: stop.country,
              latitude: stop.latitude,
              longitude: stop.longitude,
              kind: "place",
            });
          }
        }
      }

      setSavedTripId(trip.id);
      const byDay: Record<number, ItineraryStop[]> = {};
      for (const stop of await loadItineraryStops(trip.id)) {
        (byDay[stop.dayIndex] ??= []).push(stop);
      }
      setServerStops(byDay);
    }
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

  /* ---------------- account itinerary sync ---------------- */

  // Resolve the account trip for this URL (auth or guest) so itinerary stops
  // can live on the server for signed-in users.
  useEffect(() => {
    if (!plan || !saved) return;

    // A saved-trip link carries the id, so use it directly for account trips.
    if (savedTripIdParam && getToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedTripId(savedTripIdParam);
      return;
    }

    loadSavedTrips().then(() => {
      const trips = listSavedTrips();
      const trip =
        trips.find((t) => t.id === savedTripIdParam) ??
        trips.find((t) => t.url === planUrl);

      if (trip && Boolean(getToken())) {
        setSavedTripId(trip.id);
      } else {
        setSavedTripId(null);
      }
    });
  }, [plan, planUrl, saved, savedTripIdParam]);

  // Load the server itinerary once the account trip id is known.
  useEffect(() => {
    if (!plan || !saved || savedTripId === null) return;

    loadItineraryStops(savedTripId).then((stops) => {
      const byDay: Record<number, ItineraryStop[]> = {};
      for (const stop of stops) {
        (byDay[stop.dayIndex] ??= []).push(stop);
      }
      setServerStops(byDay);
    });
  }, [plan, planUrl, saved, savedTripId]);

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
                        <span>
                          {formatIndicativePrice(selectedRoute.estimatedPrice)}
                          {selectedRoute.estimatedPrice != null ? " (USD, indicative)" : ""}
                        </span>
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
                  {stopsForDay.map((stop, index) => {
                    const previous = stopsForDay[index - 1];
                    const leg = previous
                      ? legForPair(previous.id, stop.id)
                      : undefined;

                    return (
                      <Fragment key={stop.id}>
                        {previous && (
                          <li className="pl-8">
                            <div className="flex flex-wrap items-center gap-1.5 border-l border-dashed border-brand-100 pl-3 text-[10.5px] text-muted">
                              {leg ? (
                                leg.available && leg.durationMinutes !== null ? (
                                  <>
                                    <Footprints className="h-3 w-3 text-brand" />
                                    <span>
                                      {formatDuration(leg.durationMinutes)} ·{" "}
                                      {formatDistance(leg.distanceKm)}
                                    </span>
                                    {leg.estimated && (
                                      <span className="rounded bg-line px-1 py-0.5 text-[9px] font-bold uppercase text-muted">
                                        est.
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span title={leg.reason ?? undefined}>
                                    {formatDistance(leg.distanceKm)} · travel time
                                    unavailable
                                  </span>
                                )
                              ) : legsLoading ? (
                                <span>Checking travel time…</span>
                              ) : legsFailed ? (
                                <span>Travel time unavailable</span>
                              ) : (
                                <span>Save this trip to see travel time</span>
                              )}
                            </div>
                          </li>
                        )}

                        <li className="group flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
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
                            onClick={() => removeStop(stop.id, stop.name)}
                            disabled={stopActionPending}
                            aria-label={`Remove ${stop.name}`}
                            className="rounded-md p-1 text-faint transition hover:bg-danger-50 hover:text-danger disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      </Fragment>
                    );
                  })}
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
                      disabled={stopActionPending}
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
                        {transportCost != null
                          ? `${formatIndicativePrice(transportCost)} USD`
                          : formatIndicativePrice(transportCost)}
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
            id="map"
            ref={mapPaneRef}
            className="relative order-1 min-h-[38vh] scroll-mt-24 overflow-hidden rounded-[18px] border border-line bg-surface lg:order-2 lg:min-h-0"
          >
            <MapGL
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
              onClick={() => setSelectedHotelId(null)}
            >
              <NavigationControl position="top-right" showCompass={false} />

              {hasSegmentRoute ? (
                routeSegmentGeometries.map((segment, index) => {
                  const flightSegment = segment.kind === "flight";

                  return (
                    <Source
                      key={`trip-route-segment-${index}`}
                      id={`trip-route-segment-${index}`}
                      type="geojson"
                      data={{
                        type: "Feature",
                        properties: { kind: segment.kind },
                        geometry: segment.geometry as Geometry,
                      }}
                    >
                      <Layer
                        id={`trip-route-segment-casing-${index}`}
                        type="line"
                        paint={{
                          "line-color": "#ffffff",
                          "line-width": flightSegment ? 7 : 6,
                          "line-opacity": 0.85,
                        }}
                        layout={{ "line-cap": "round", "line-join": "round" }}
                      />
                      <Layer
                        id={`trip-route-segment-line-${index}`}
                        type="line"
                        paint={{
                          "line-color": flightSegment ? "#2563EB" : "#667085",
                          "line-width": flightSegment ? 3 : 3,
                          "line-opacity": flightSegment ? 0.95 : 0.8,
                          "line-dasharray": flightSegment ? [2, 2] : [1.5, 2],
                        }}
                        layout={{
                          "line-cap": flightSegment ? "butt" : "round",
                          "line-join": "round",
                        }}
                      />
                    </Source>
                  );
                })
              ) : overallRouteGeometry ? (
                <Source
                  id="trip-route"
                  type="geojson"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: overallRouteGeometry as Geometry,
                  }}
                >
                  <Layer
                    id="trip-route-casing"
                    type="line"
                    paint={{
                      "line-color": "#ffffff",
                      "line-width": isFlightRoute ? 7 : 9,
                      "line-opacity": 0.85,
                    }}
                    layout={{ "line-cap": "round", "line-join": "round" }}
                  />
                  <Layer
                    id="trip-route-line"
                    type="line"
                    paint={{
                      "line-color": isFlightRoute ? "#2563EB" : "#0E9384",
                      "line-width": isFlightRoute ? 3 : 5,
                      "line-opacity": 0.95,
                      ...(isFlightRoute ? { "line-dasharray": [2, 2] } : {}),
                    }}
                    layout={
                      isFlightRoute
                        ? { "line-cap": "butt", "line-join": "round" }
                        : { "line-cap": "round", "line-join": "round" }
                    }
                  />
                </Source>
              ) : null}

              {nearbyHotels.map((hotel) => (
                <Marker
                  key={`hotel-${hotel.id}`}
                  longitude={hotel.longitude}
                  latitude={hotel.latitude}
                  anchor="bottom"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation();
                    setSelectedHotelId((current) =>
                      current === hotel.id ? null : hotel.id
                    );
                  }}
                >
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#F79009] text-white shadow-md transition hover:scale-110"
                    aria-label={`${hotel.name}, ${formatDistance(hotel.distanceKm)} away`}
                    title={hotel.name}
                  >
                    <BedDouble className="h-3.5 w-3.5" />
                  </button>
                </Marker>
              ))}

              {(() => {
                const selectedHotel = nearbyHotels.find(
                  (hotel) => hotel.id === selectedHotelId
                );

                if (!selectedHotel) return null;

                return (
                  <Popup
                    longitude={selectedHotel.longitude}
                    latitude={selectedHotel.latitude}
                    anchor="top"
                    offset={14}
                    onClose={() => setSelectedHotelId(null)}
                    closeButton
                    closeOnClick={false}
                  >
                    <div className="min-w-[180px] px-0.5 py-0.5 text-ink">
                      <p className="text-[12px] font-bold">{selectedHotel.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {formatDistance(selectedHotel.distanceKm)} away
                        {selectedHotel.stars != null ? ` · ${selectedHotel.stars}★` : ""}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-body">
                        {selectedHotel.estimatedPricePerNight != null &&
                        selectedHotel.estimatedPricePerNight > 0
                          ? `${formatPrice(selectedHotel.estimatedPricePerNight)} /night`
                          : "Price unavailable"}
                      </p>
                    </div>
                  </Popup>
                );
              })()}

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
            </MapGL>

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
                  <HummingbirdLoader className="h-7 w-7" />
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
            <div className="border-b border-line-soft px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-[14px] font-bold text-ink">Getting there</h2>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {displayedRoutes.length} shown · {availableRoutes.length} available
                  </p>
                </div>

                <span className="ml-auto grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand">
                  <RouteIcon className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                  <span>Sort</span>
                  <select
                    value={routeSort}
                    onChange={(event) =>
                      setRouteSort(event.target.value as typeof routeSort)
                    }
                    aria-label="Sort route options"
                    className="h-8 rounded-lg border border-line bg-canvas px-2 text-[11.5px] font-semibold text-body outline-none transition focus:border-brand"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="fastest">Fastest</option>
                    <option value="cheapest">Cheapest</option>
                    <option value="fewest">Fewest legs</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => setShowAvailableOnly((value) => !value)}
                  aria-pressed={showAvailableOnly}
                  className={`h-8 rounded-full border px-2.5 text-[11px] font-semibold transition ${
                    showAvailableOnly
                      ? "border-brand bg-brand-50 text-brand-strong"
                      : "border-line bg-canvas text-muted hover:border-brand-100 hover:text-ink"
                  }`}
                >
                  Available only
                </button>

                {routeModes.length > 1 && (
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by mode">
                    <button
                      type="button"
                      onClick={() => setRouteModeFilter("all")}
                      aria-pressed={routeModeFilter === "all"}
                      className={`h-8 rounded-full border px-2.5 text-[11px] font-semibold transition ${
                        routeModeFilter === "all"
                          ? "border-brand bg-brand-50 text-brand-strong"
                          : "border-line bg-canvas text-muted hover:border-brand-100 hover:text-ink"
                      }`}
                    >
                      All
                    </button>
                    {routeModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setRouteModeFilter(mode)}
                        aria-pressed={routeModeFilter === mode}
                        className={`h-8 rounded-full border px-2.5 text-[11px] font-semibold capitalize transition ${
                          routeModeFilter === mode
                            ? "border-brand bg-brand-50 text-brand-strong"
                            : "border-line bg-canvas text-muted hover:border-brand-100 hover:text-ink"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                displayedRoutes.map((route) => {
                  const Icon = modeIcon(route.type);
                  const isSelected = selectedRoute === route;
                  const infeasible =
                    !route.available &&
                    /not feasible|infeasible/i.test(route.message ?? "");
                  const rec = recommendations.get(route);

                  const searchUrl = routeSearchUrl({
                    route,
                    originLabel: plan.origin.label,
                    destinationLabel: plan.destination.name,
                    dates: plan.dates,
                  });
                  const searchLabel = routeSearchLabel(route);

                  return (
                    <div
                      key={`${routes.indexOf(route)}-${route.type}-${route.name}`}
                      className={`mb-2 overflow-hidden rounded-xl border transition ${
                        !route.available
                          ? "border-danger/20 bg-danger-50/40"
                          : isSelected
                          ? "border-brand bg-brand-50 shadow-[inset_0_0_0_1px_var(--color-brand)]"
                          : "border-line bg-surface hover:border-brand-100 hover:bg-brand-50/40"
                      }`}
                    >
                      <button
                        type="button"
                        disabled={!route.available}
                        onClick={() => setSelectedRouteChoice(route)}
                        aria-pressed={isSelected}
                        className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left ${
                          !route.available ? "cursor-not-allowed" : ""
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border ${
                            !route.available
                              ? "border-danger/20 bg-surface text-danger"
                              : isSelected
                              ? "border-brand-100 bg-surface text-brand-strong"
                              : "border-line-soft bg-canvas text-body"
                          }`}
                        >
                          <Icon className="h-[17px] w-[17px]" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-[13px] font-bold text-ink">
                              {route.name || route.type}
                            </span>

                            {!route.available && (
                              <span className="rounded bg-danger-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-danger">
                                {infeasible ? "Not feasible" : "Unavailable"}
                              </span>
                            )}

                            {route.available && rec?.isBestOverall && (
                              <span className="rounded bg-[#FEF0C7] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#93370D]">
                                Best overall
                              </span>
                            )}

                            {route.available && fastest === route && (
                              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-brand-strong">
                                Fastest
                              </span>
                            )}

                            {route.available &&
                              cheapest === route &&
                              fastest !== route && (
                                <span className="rounded bg-sky-brand-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#175cd3]">
                                  Cheapest
                                </span>
                              )}
                          </span>

                          <span
                            className={`mt-0.5 block text-[11.5px] leading-snug ${
                              route.available ? "truncate text-muted" : "text-danger"
                            }`}
                            title={route.message ?? undefined}
                          >
                            {route.available
                              ? `${formatDuration(route.durationMinutes)} · ${formatDistance(
                                  route.distanceKm
                                )}`
                              : route.message ?? "This mode is unavailable for this route."}
                          </span>

                          {route.available && rec && (
                            <>
                              {rec.isBestOverall && rec.reasons.length > 0 && (
                                <span className="mt-1 block text-[10.5px] font-semibold text-[#93370D]">
                                  {rec.reasons.join(" · ")}
                                </span>
                              )}
                              {!rec.isBestOverall &&
                                hasBudget &&
                                rec.budgetFit !== "unknown" && (
                                  <span
                                    className={`mt-1 block text-[10.5px] font-semibold ${
                                      rec.budgetFit === "within"
                                        ? "text-brand-strong"
                                        : "text-danger"
                                    }`}
                                  >
                                    {rec.budgetFit === "within"
                                      ? "Within budget"
                                      : "Over budget"}
                                  </span>
                                )}
                            </>
                          )}

                          {route.available &&
                            Array.isArray(route.segments) &&
                            route.segments.length > 0 && (
                              <span className="mt-2 block space-y-1 border-t border-line-soft pt-2">
                                {route.segments.map((segment, index) => {
                                  const from = segment.from?.trim();
                                  const to = segment.to?.trim();
                                  const endpoints =
                                    from || to ? `${from || "Start"} → ${to || "End"}` : null;
                                  const label =
                                    segment.name?.trim() || segment.type?.trim() || "Segment";
                                  const details = [
                                    segment.durationMinutes != null
                                      ? formatDuration(segment.durationMinutes)
                                      : null,
                                    segment.distanceKm != null
                                      ? formatDistance(segment.distanceKm)
                                      : null,
                                  ].filter(Boolean);

                                  return (
                                    <span
                                      key={`${route.type}-${index}`}
                                      className="flex items-start gap-1.5 text-[10.5px] leading-snug text-muted"
                                    >
                                      {(() => {
                                        const SegmentIcon = modeIcon(
                                          segment.type ?? segment.name ?? route.type
                                        );
                                        return (
                                          <SegmentIcon className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                                        );
                                      })()}
                                      <span className="min-w-0">
                                        <span className="block truncate text-body">
                                          {endpoints ? `${endpoints} · ${label}` : label}
                                        </span>
                                        {(details.length > 0 || segment.message) && (
                                          <span className="block truncate text-faint">
                                            {[details.join(" · "), segment.message]
                                              .filter(Boolean)
                                              .join(" · ")}
                                          </span>
                                        )}
                                      </span>
                                    </span>
                                  );
                                })}
                              </span>
                            )}
                        </span>

                        <span className="mt-0.5 shrink-0 text-right">
                          <span className="block text-[12px] font-bold text-ink">
                            {route.available
                              ? formatIndicativePrice(route.estimatedPrice)
                              : formatPrice(route.estimatedPrice)}
                          </span>
                          <span className="block text-[10px] text-muted">
                            {route.available
                              ? route.estimatedPrice != null
                                ? "Indicative estimate (USD)"
                                : route.provider ?? "Estimate"
                              : "Unavailable"}
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

                      <div className="flex items-center justify-between gap-2 border-t border-line-soft px-3 py-1.5">
                        <span className="text-[10px] text-faint">
                          Estimates only · check live prices and availability
                        </span>
                        <a
                          href={searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-brand-strong transition hover:bg-brand-50 hover:underline"
                          aria-label={`${searchLabel} for ${route.name || route.type} in a new tab`}
                        >
                          {searchLabel}
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  );
                })}

              {!loading && routes.length > 0 && displayedRoutes.length === 0 && !error && (
                <p className="rounded-xl border border-dashed border-line bg-canvas px-3 py-4 text-center text-[12px] text-muted">
                  No routes match these filters. Try showing all modes or turning off “Available only”.
                </p>
              )}

              {!loading &&
                flight &&
                !routes.some(
                  (route) => route.type.toLowerCase().includes("flight") && route.available
                ) && (
                <div className="mb-2 overflow-hidden rounded-xl border border-line bg-canvas">
                  <div className="px-3 py-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-line-soft bg-surface text-body">
                        <Plane className="h-[17px] w-[17px]" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-ink">
                              Flight
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${
                                  flight.available
                                    ? "bg-sky-brand-50 text-[#175cd3]"
                                    : "bg-danger-50 text-danger"
                                }`}
                              >
                                {flight.available ? "Indicative estimate" : "Unavailable"}
                              </span>
                            </p>

                            <p className="mt-0.5 text-[11.5px] text-muted">
                              {flight.available
                                ? [
                                    flight.durationMinutes != null
                                      ? formatDuration(flight.durationMinutes)
                                      : flight.duration != null
                                      ? formatDuration(flight.duration)
                                      : null,
                                    flight.estimatedPrice != null
                                      ? formatIndicativePrice(flight.estimatedPrice)
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "Indicative estimate (USD), not a live fare"
                                : flight.message ?? "Flight option unavailable for this route."}
                            </p>
                          </div>

                          {flight.available && (
                            <span className="shrink-0 text-right">
                              <span className="block text-[12px] font-bold text-ink">
                                {formatIndicativePrice(flight.estimatedPrice)}
                              </span>
                              <span className="block text-[10px] text-muted">
                                Indicative estimate (USD)
                              </span>
                            </span>
                          )}
                        </div>

                        {flight.message && (
                          <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                            {flight.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-line-soft px-3 py-1.5">
                    <span className="text-[10px] text-faint">
                      Estimates only · check live prices and availability
                    </span>
                    <a
                      href={flightSearchUrl({
                        originLabel: plan.origin.label,
                        destinationLabel: plan.destination.name,
                        dates: plan.dates,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-brand-strong transition hover:bg-brand-50 hover:underline"
                      aria-label="Search flights in a new tab"
                    >
                      Search flights
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
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
                Distances and durations come from the routing provider. Route and
                flight prices are indicative estimates (USD), not live fares.
                Missing fares are shown as “Fare unavailable”, never as $0.
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

        {/* ---------------- budget breakdown ---------------- */}
        <section id="budget" aria-label="Budget" className="mt-3.5">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Wallet className="h-4 w-4 text-brand" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              Budget
            </h2>
          </div>

          <BudgetBreakdown
            tripId={savedTripId}
            totalBudget={plan.budget}
            travelers={plan.adults + plan.children}
            onSaved={(message) => setToast(message)}
          />
        </section>

        {/* ---------------- live stays near this destination ---------------- */}
        <section id="stays" aria-label="Nearby stays" className="mt-3.5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-brand" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                  Stays near {plan.destination.name}
                </h2>
              </div>
              {hotelStatus && (
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    hotelStatus.tone === "stale"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : hotelStatus.tone === "cached"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      hotelStatus.tone === "stale"
                        ? "bg-amber-500"
                        : hotelStatus.tone === "cached"
                        ? "bg-sky-500"
                        : "bg-emerald-500",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  {hotelStatus.label}
                </span>
              )}
              {hotelRefreshing && hotelsMatch && (
                <span className="text-[10.5px] text-muted">Updating...</span>
              )}
            </div>

            <a
              href={staysSearchUrl({
                destinationLabel: plan.destination.name,
                dates: plan.dates,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md text-[11px] font-semibold text-brand-strong hover:underline"
              aria-label={`Search stays in ${plan.destination.name} in a new tab`}
            >
              Search stays
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          <div className="rounded-[18px] border border-line bg-surface px-4 py-4">
            {hotelsLoading ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-[112px] animate-pulse rounded-xl border border-line bg-canvas"
                  />
                ))}
              </div>
            ) : hotelsFailed ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-danger/20 bg-danger-50 px-3 py-2.5">
                <p className="text-[12px] text-danger">
                  {hotelsMatch && hotelState?.errorMessage
                    ? hotelState.errorMessage
                    : "Couldn't load nearby stays right now."}
                </p>
                <button
                  type="button"
                  onClick={() => setHotelReloadKey((value) => value + 1)}
                  disabled={hotelRefreshing}
                  className="text-[11.5px] font-bold text-danger underline disabled:opacity-50"
                >
                  {hotelRefreshing ? "Retrying..." : "Retry"}
                </button>
              </div>
            ) : nearbyHotels.length === 0 ? (
              hotelsMatch && (hotelState?.notice || hotelState?.stale) ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-center">
                  <p className="text-[12px] font-medium text-amber-900">
                    {hotelState.notice ??
                      "Open stay data is temporarily unavailable right now."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setHotelReloadKey((value) => value + 1)}
                    disabled={hotelRefreshing}
                    className="mt-2 text-[11.5px] font-bold text-amber-900 underline disabled:opacity-50"
                  >
                    {hotelRefreshing ? "Retrying..." : "Try again"}
                  </button>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-line bg-canvas px-3 py-5 text-center text-[12px] text-muted">
                  No hotels found within 8 km yet. Try a different destination.
                </p>
              )
            ) : (
              <>
                {hotelsMatch && hotelStatus && hotelStatus.tone !== "live" && (
                  <div
                    className={[
                      "mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px]",
                      hotelStatus.tone === "stale"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-sky-200 bg-sky-50 text-sky-800",
                    ].join(" ")}
                  >
                    <p>
                      {hotelState?.notice ??
                        (hotelStatus.tone === "stale"
                          ? "Live open-data is temporarily unavailable. Showing saved results."
                          : "Showing cached open-data results.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setHotelReloadKey((value) => value + 1)}
                      disabled={hotelRefreshing}
                      className="font-semibold underline disabled:opacity-50"
                    >
                      {hotelRefreshing ? "Refreshing..." : "Retry"}
                    </button>
                  </div>
                )}
              <div
                className={[
                  "grid gap-2 sm:grid-cols-2 lg:grid-cols-4 transition-opacity",
                  hotelRefreshing ? "opacity-60" : "opacity-100",
                ].join(" ")}
              >
                {nearbyHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="flex min-w-0 flex-col rounded-xl border border-line bg-canvas px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                        <BedDouble className="h-3.5 w-3.5" />
                      </span>

                      <p
                        className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink"
                        title={hotel.name}
                      >
                        {hotel.name}
                      </p>
                    </div>

                    <p className="mt-2 truncate text-[11px] text-muted" title={hotel.address ?? undefined}>
                      {hotel.address ?? hotel.type ?? "Address not listed"}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted">
                      <span>{formatDistance(hotel.distanceKm)} away</span>
                      {hotel.stars !== null && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-[#FDB022] text-[#FDB022]" />
                          {hotel.stars}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <span className="text-[11.5px] font-semibold text-body">
                        {hotel.estimatedPricePerNight !== null &&
                        hotel.estimatedPricePerNight > 0
                          ? formatPrice(hotel.estimatedPricePerNight)
                          : "Price unavailable"}
                        <span className="font-normal text-muted"> /night</span>
                      </span>

                      {hotel.website && (
                        <a
                          href={hotel.website}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Website for ${hotel.name}`}
                          className="text-brand-strong hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}

            <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-faint">
              <Info className="h-3 w-3 shrink-0" />
              Live places from OpenStreetMap. Fares aren't published for these
              listings, so price stays unavailable rather than becoming $0.
            </p>
          </div>
        </section>
      </div>

      {/* mobile quick nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-surface px-2 pb-1.5 pt-1.5 shadow-[0_-6px_20px_-12px_rgba(12,27,51,0.4)] lg:hidden">
        {[
          { label: "Map", target: "map", icon: MapPin },
          { label: "Plan", target: "trip-plan", icon: CircleDot },
          { label: "Getting there", target: "getting-there", icon: RouteIcon },
          { label: "Budget", target: "budget", icon: Wallet },
          { label: "Stays", target: "stays", icon: BedDouble },
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
