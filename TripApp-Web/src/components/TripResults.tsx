import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Compass,
  MapPin,
  Plane,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

type SelectedDateRange = {
  from?: Date;
  to?: Date;
};

type Destination = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};
type RouteOption = {
  type: string;
  name: string;
  available: boolean;
  distanceKm?: number;
  durationMinutes?: number;
  estimatedPrice?: number;
  provider?: string;
  geometry?: string;
  message?: string;
};

type FlightOption = {
  available: boolean;
  airline?: string;
  duration?: number;
  estimatedPrice?: number;
  message?: string;
};

type TripState = {
  destination?: Destination;

  origin?: {
    latitude: number;
    longitude: number;
  };

  budget?: string;
  adults?: number;
  children?: number;
  selectedDates?: SelectedDateRange;

  routes?: RouteOption[];
  flight?: FlightOption;
};

function formatDate(value?: Date) {
  if (!value) return "TBD";
  return value.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export default function TripResults() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const tripState = (state as TripState | undefined) ?? {};

  const destination = tripState.destination ?? {
    name: "Santorini",
    country: "Greece",
    latitude: 36.3932,
    longitude: 25.4615,
  };

  const budgetValue = tripState.budget?.trim();
  const adults = tripState.adults ?? 2;
  const children = tripState.children ?? 0;
  const travelers = adults + children;
  const selectedDates = tripState.selectedDates;
const userLocation = tripState.origin ?? null;
const routes = tripState.routes ?? [];

const availableRoutes = routes.filter(
  (route) => route.available
);

const [selectedRoute, setSelectedRoute] =
  useState<RouteOption | null>(
    availableRoutes[0] ?? null
  );
  let routeGeometry = null;

if (selectedRoute?.geometry) {
  try {
    routeGeometry = JSON.parse(selectedRoute.geometry);
  } catch (error) {
    console.error("Failed to parse route geometry:", error);
  }
}
  const parsedBudget = Number(budgetValue);
  const estimatedBudget = Number.isFinite(parsedBudget) && parsedBudget > 0
    ? parsedBudget
    : 1800;

  const stayCost = Math.round(estimatedBudget * 0.4);
  const flightCost = Math.round(estimatedBudget * 0.25);
  const activityCost = Math.round(estimatedBudget * 0.2);
  const foodCost = Math.round(estimatedBudget * 0.15);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <button
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          Back to planner
        </button>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
          <div className="grid gap-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-700 p-8 text-white lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
                <Sparkles size={16} />
                Recommended trip plan
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
                Your {travelers}-traveler escape to {destination.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
                We mapped out a balanced itinerary with a comfortable stay, scenic activities, and flexible budget pacing for your upcoming journey.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <div className="rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                  <span className="font-semibold">Destination:</span> {destination.name}, {destination.country}
                </div>
                <div className="rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                  <span className="font-semibold">Dates:</span> {formatDate(selectedDates?.from)} - {formatDate(selectedDates?.to)}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-200">
                Budget snapshot
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Estimated total</span>
                  <span className="text-xl font-semibold">${estimatedBudget}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Stay</span>
                  <span>${stayCost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Flights</span>
                  <span>${flightCost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Activities</span>
                  <span>${activityCost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Food</span>
                  <span>${foodCost}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
       <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">

  {/* Transport options */}

  <div className="border-b border-slate-200 p-6">

    <h2 className="text-2xl font-bold">
      How do you want to travel?
    </h2>

    <p className="mt-1 text-slate-500">
      Choose a travel method to see its route.
    </p>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

      {routes.map((route) => {

        const isSelected =
          selectedRoute?.type === route.type;

        return (
          <button
            key={route.type}
            disabled={!route.available}
            onClick={() => {
              if (route.available) {
                setSelectedRoute(route);
              }
            }}
            className={`rounded-2xl border p-4 text-left transition ${
              !route.available
                ? "cursor-not-allowed bg-slate-100 opacity-50"
                : isSelected
                ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
            }`}
          >

            <div className="flex items-center justify-between">

              <span className="font-semibold">
                {route.type}
              </span>

              {isSelected && (
                <span className="text-xs font-semibold text-indigo-600">
                  Selected
                </span>
              )}

            </div>

            {route.available ? (
              <>
                <p className="mt-2 text-sm text-slate-500">
                  {route.distanceKm?.toFixed(1)} km
                </p>

                <p className="text-sm text-slate-500">
                  {Math.round(route.durationMinutes ?? 0)} min
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Not available yet
              </p>
            )}

          </button>
        );

      })}

      {/* Flight */}

      {tripState.flight && (
        <button
          disabled={!tripState.flight.available}
          className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 p-4 text-left opacity-50"
        >
          <div className="flex items-center justify-between">

            <span className="font-semibold">
              Flight
            </span>

            <Plane size={18} />

          </div>

          <p className="mt-2 text-sm text-slate-500">
            {tripState.flight.available
              ? "Available"
              : "Not available yet"}
          </p>

        </button>
      )}

    </div>

  </div>

  <div className="h-[500px]">

  
<Map
  initialViewState={{
    longitude: destination.longitude,
    latitude: destination.latitude,
    zoom: 8,
  }}
  style={{ width: "100%", height: "100%" }}
  mapStyle="https://demotiles.maplibre.org/style.json"
>

  {/* Selected route */}
  {routeGeometry && (
    <Source
      id="selected-route"
      type="geojson"
      data={{
        type: "Feature",
        properties: {},
        geometry: routeGeometry,
      }}
    >
      <Layer
        id="selected-route-line"
        type="line"
        paint={{
          "line-color": "#4f46e5",
          "line-width": 5,
          "line-opacity": 0.8,
        }}
      />
    </Source>
  )}

  {/* Starting point */}
  {userLocation && (
    <Marker
      longitude={userLocation.longitude}
      latitude={userLocation.latitude}
      anchor="bottom"
    >
      <div className="h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-200" />
    </Marker>
  )}

  {/* Destination */}
  <Marker
    longitude={destination.longitude}
    latitude={destination.latitude}
    anchor="bottom"
  >
    <MapPin
      className="text-red-600"
      fill="red"
    />
  </Marker>

</Map>
  </div>

  <div className="grid gap-4 border-t border-slate-200 p-6 md:grid-cols-2">

    <div>

      <p className="font-semibold">
        Destination
      </p>

      <p className="text-slate-500">
        {destination.name}, {destination.country}
      </p>

    </div>

    <div>

      <p className="font-semibold">
        Starting Point
      </p>

      <p className="text-slate-500">
        {userLocation
          ? "Current Location Detected"
          : "Location permission not granted"}
      </p>

    </div>

  </div>

</section>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">
                    Core itinerary
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    A relaxed 4-day experience
                  </h2>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  Best fit
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    title: "Day 1 — Arrival and waterfront stroll",
                    description: "Check into a boutique stay near the city center and enjoy an easy evening around the marina.",
                  },
                  {
                    title: "Day 2 — Scenic landmarks and local eats",
                    description: "Visit iconic viewpoints, grab a guided food walk, and leave space for leisurely breaks.",
                  },
                  {
                    title: "Day 3 — Adventure and beach time",
                    description: "Book a half-day excursion and spend the afternoon relaxing at a seaside spot.",
                  },
                  {
                    title: "Day 4 — Flexible departure day",
                    description: "Use the final day for shopping, brunch, or one last cultural stop before heading home.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">
                Trip highlights
              </p>
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <Plane className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Flight recommendation</h3>
                    <p className="text-sm text-slate-600">Aim for morning departures to maximize your first-day energy.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Stay near the center</h3>
                    <p className="text-sm text-slate-600">Choose a hotel within walking distance of main attractions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <Compass className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Best local experiences</h3>
                    <p className="text-sm text-slate-600">Book one guided tour and one flexible day for spontaneous exploring.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900">
                <Users size={18} />
                <h3 className="font-semibold">Travelers</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {adults} adults and {children} children are included in this plan.
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <CalendarDays size={16} />
                <span>Stay flexible around {formatDate(selectedDates?.from)} to {formatDate(selectedDates?.to)}.</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Wallet size={16} />
                <span>Budget-friendly pacing with room for dining and extras.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
