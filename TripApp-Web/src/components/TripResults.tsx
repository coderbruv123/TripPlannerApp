// import "maplibre-gl/dist/maplibre-gl.css";
// import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";import { useLocation, useNavigate } from "react-router-dom";
// import {
//   ArrowLeft,
//   CalendarDays,
//   Compass,
//   MapPin,
//   Plane,
//   Sparkles,
//   Users,
//   Wallet,
// } from "lucide-react";
// import { useState } from "react";

// type SelectedDateRange = {
//   from?: Date;
//   to?: Date;
// };

// type Destination = {
//   name: string;
//   country: string;
//   latitude: number;
//   longitude: number;
// };
// type RouteOption = {
//   type: string;
//   name: string;
//   available: boolean;
//   distanceKm?: number;
//   durationMinutes?: number;
//   estimatedPrice?: number;
//   provider?: string;
//   geometry?: string;
//   message?: string;
// };

// type FlightOption = {
//   available: boolean;
//   airline?: string;
//   duration?: number;
//   estimatedPrice?: number;
//   message?: string;
// };

// type TripState = {
//   destination?: Destination;

//   origin?: {
//     latitude: number;
//     longitude: number;
//   };

//   budget?: string;
//   adults?: number;
//   children?: number;
//   selectedDates?: SelectedDateRange;

//   routes?: RouteOption[];
//   flight?: FlightOption;
// };

// function formatDate(value?: Date) {
//   if (!value) return "TBD";
//   return value.toLocaleDateString("en", {
//     month: "short",
//     day: "numeric",
//   });
// }

// export default function TripResults() {
//   const navigate = useNavigate();
//   const { state } = useLocation();
//   const tripState = (state as TripState | undefined) ?? {};

//   const destination = tripState.destination ?? {
//     name: "Santorini",
//     country: "Greece",
//     latitude: 36.3932,
//     longitude: 25.4615,
//   };

//   const budgetValue = tripState.budget?.trim();
//   const adults = tripState.adults ?? 2;
//   const children = tripState.children ?? 0;
//   const travelers = adults + children;
//   const selectedDates = tripState.selectedDates;
// const userLocation = tripState.origin ?? null;
// const routes = tripState.routes ?? [];

// const availableRoutes = routes.filter(
//   (route) => route.available
// );

// const [selectedRoute, setSelectedRoute] =
//   useState<RouteOption | null>(
//     availableRoutes[0] ?? null
//   );
//   let routeGeometry = null;

// if (selectedRoute?.geometry) {
//   try {
//     routeGeometry = JSON.parse(selectedRoute.geometry);
//   } catch (error) {
//     console.error("Failed to parse route geometry:", error);
//   }
// }
//   const parsedBudget = Number(budgetValue);
//   const estimatedBudget = Number.isFinite(parsedBudget) && parsedBudget > 0
//     ? parsedBudget
//     : 1800;

//   const stayCost = Math.round(estimatedBudget * 0.4);
//   const flightCost = Math.round(estimatedBudget * 0.25);
//   const activityCost = Math.round(estimatedBudget * 0.2);
//   const foodCost = Math.round(estimatedBudget * 0.15);

//   return (
//     <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 lg:px-10">
//       <div className="mx-auto flex max-w-7xl flex-col gap-6">
//         <button
//           onClick={() => navigate(-1)}
//           className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
//         >
//           <ArrowLeft size={16} />
//           Back to planner
//         </button>

//         <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
//           <div className="grid gap-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-700 p-8 text-white lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
//                 <Sparkles size={16} />
//                 Recommended trip plan
//               </div>
//               <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
//                 Your {travelers}-traveler escape to {destination.name}
//               </h1>
//               <p className="mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
//                 We mapped out a balanced itinerary with a comfortable stay, scenic activities, and flexible budget pacing for your upcoming journey.
//               </p>

//               <div className="mt-6 flex flex-wrap gap-3 text-sm">
//                 <div className="rounded-full bg-white/10 px-3 py-2 backdrop-blur">
//                   <span className="font-semibold">Destination:</span> {destination.name}, {destination.country}
//                 </div>
//                 <div className="rounded-full bg-white/10 px-3 py-2 backdrop-blur">
//                   <span className="font-semibold">Dates:</span> {formatDate(selectedDates?.from)} - {formatDate(selectedDates?.to)}
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-[28px] border border-white/20 bg-white/10 p-6 backdrop-blur">
//               <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-200">
//                 Budget snapshot
//               </p>
//               <div className="mt-4 space-y-3 text-sm">
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-200">Estimated total</span>
//                   <span className="text-xl font-semibold">${estimatedBudget}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-200">Stay</span>
//                   <span>${stayCost}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-200">Flights</span>
//                   <span>${flightCost}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-200">Activities</span>
//                   <span>${activityCost}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-200">Food</span>
//                   <span>${foodCost}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">

//   {/* Transport options */}

//   <div className="border-b border-slate-200 p-6">

//     <h2 className="text-2xl font-bold">
//       How do you want to travel?
//     </h2>

//     <p className="mt-1 text-slate-500">
//       Choose a travel method to see its route.
//     </p>

//     <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

//       {routes.map((route) => {

//         const isSelected =
//           selectedRoute?.type === route.type;

//         return (
//           <button
//             key={route.type}
//             disabled={!route.available}
//             onClick={() => {
//               if (route.available) {
//                 setSelectedRoute(route);
//               }
//             }}
//             className={`rounded-2xl border p-4 text-left transition ${
//               !route.available
//                 ? "cursor-not-allowed bg-slate-100 opacity-50"
//                 : isSelected
//                 ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
//                 : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
//             }`}
//           >

//             <div className="flex items-center justify-between">

//               <span className="font-semibold">
//                 {route.type}
//               </span>

//               {isSelected && (
//                 <span className="text-xs font-semibold text-indigo-600">
//                   Selected
//                 </span>
//               )}

//             </div>

//             {route.available ? (
//               <>
//                 <p className="mt-2 text-sm text-slate-500">
//                   {route.distanceKm?.toFixed(1)} km
//                 </p>

//                 <p className="text-sm text-slate-500">
//                   {Math.round(route.durationMinutes ?? 0)} min
//                 </p>
//               </>
//             ) : (
//               <p className="mt-2 text-sm text-slate-500">
//                 Not available yet
//               </p>
//             )}

//           </button>
//         );

//       })}

//       {/* Flight */}

//       {tripState.flight && (
//         <button
//           disabled={!tripState.flight.available}
//           className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 p-4 text-left opacity-50"
//         >
//           <div className="flex items-center justify-between">

//             <span className="font-semibold">
//               Flight
//             </span>

//             <Plane size={18} />

//           </div>

//           <p className="mt-2 text-sm text-slate-500">
//             {tripState.flight.available
//               ? "Available"
//               : "Not available yet"}
//           </p>

//         </button>
//       )}

//     </div>

//   </div>

//   <div className="h-[500px]">

  
// <Map
//   initialViewState={{
//     longitude: destination.longitude,
//     latitude: destination.latitude,
//     zoom: 8,
//   }}
//   style={{ width: "100%", height: "100%" }}
//   mapStyle="https://demotiles.maplibre.org/style.json"
// >

//   {/* Selected route */}
//   {routeGeometry && (
//     <Source
//       id="selected-route"
//       type="geojson"
//       data={{
//         type: "Feature",
//         properties: {},
//         geometry: routeGeometry,
//       }}
//     >
//       <Layer
//         id="selected-route-line"
//         type="line"
//         paint={{
//           "line-color": "#4f46e5",
//           "line-width": 5,
//           "line-opacity": 0.8,
//         }}
//       />
//     </Source>
//   )}

//   {/* Starting point */}
//   {userLocation && (
//     <Marker
//       longitude={userLocation.longitude}
//       latitude={userLocation.latitude}
//       anchor="bottom"
//     >
//       <div className="h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-200" />
//     </Marker>
//   )}

//   {/* Destination */}
//   <Marker
//     longitude={destination.longitude}
//     latitude={destination.latitude}
//     anchor="bottom"
//   >
//     <MapPin
//       className="text-red-600"
//       fill="red"
//     />
//   </Marker>

// </Map>
//   </div>

//   <div className="grid gap-4 border-t border-slate-200 p-6 md:grid-cols-2">

//     <div>

//       <p className="font-semibold">
//         Destination
//       </p>

//       <p className="text-slate-500">
//         {destination.name}, {destination.country}
//       </p>

//     </div>

//     <div>

//       <p className="font-semibold">
//         Starting Point
//       </p>

//       <p className="text-slate-500">
//         {userLocation
//           ? "Current Location Detected"
//           : "Location permission not granted"}
//       </p>

//     </div>

//   </div>

// </section>
//         <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
//           <div className="space-y-4">
//             <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">
//                     Core itinerary
//                   </p>
//                   <h2 className="mt-2 text-2xl font-semibold text-slate-900">
//                     A relaxed 4-day experience
//                   </h2>
//                 </div>
//                 <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
//                   Best fit
//                 </div>
//               </div>

//               <div className="mt-6 space-y-4">
//                 {[
//                   {
//                     title: "Day 1 — Arrival and waterfront stroll",
//                     description: "Check into a boutique stay near the city center and enjoy an easy evening around the marina.",
//                   },
//                   {
//                     title: "Day 2 — Scenic landmarks and local eats",
//                     description: "Visit iconic viewpoints, grab a guided food walk, and leave space for leisurely breaks.",
//                   },
//                   {
//                     title: "Day 3 — Adventure and beach time",
//                     description: "Book a half-day excursion and spend the afternoon relaxing at a seaside spot.",
//                   },
//                   {
//                     title: "Day 4 — Flexible departure day",
//                     description: "Use the final day for shopping, brunch, or one last cultural stop before heading home.",
//                   },
//                 ].map((item) => (
//                   <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                     <h3 className="font-semibold text-slate-900">{item.title}</h3>
//                     <p className="mt-1 text-sm text-slate-600">{item.description}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           <div className="space-y-4">
//             <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
//               <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">
//                 Trip highlights
//               </p>
//               <div className="mt-5 space-y-3">
//                 <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
//                   <Plane className="mt-0.5 h-5 w-5 text-indigo-600" />
//                   <div>
//                     <h3 className="font-semibold text-slate-900">Flight recommendation</h3>
//                     <p className="text-sm text-slate-600">Aim for morning departures to maximize your first-day energy.</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
//                   <MapPin className="mt-0.5 h-5 w-5 text-indigo-600" />
//                   <div>
//                     <h3 className="font-semibold text-slate-900">Stay near the center</h3>
//                     <p className="text-sm text-slate-600">Choose a hotel within walking distance of main attractions.</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
//                   <Compass className="mt-0.5 h-5 w-5 text-indigo-600" />
//                   <div>
//                     <h3 className="font-semibold text-slate-900">Best local experiences</h3>
//                     <p className="text-sm text-slate-600">Book one guided tour and one flexible day for spontaneous exploring.</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
//               <div className="flex items-center gap-2 text-slate-900">
//                 <Users size={18} />
//                 <h3 className="font-semibold">Travelers</h3>
//               </div>
//               <p className="mt-3 text-sm text-slate-600">
//                 {adults} adults and {children} children are included in this plan.
//               </p>

//               <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
//                 <CalendarDays size={16} />
//                 <span>Stay flexible around {formatDate(selectedDates?.from)} to {formatDate(selectedDates?.to)}.</span>
//               </div>

//               <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
//                 <Wallet size={16} />
//                 <span>Budget-friendly pacing with room for dining and extras.</span>
//               </div>
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
import "maplibre-gl/dist/maplibre-gl.css";

import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
} from "react-map-gl/maplibre";

import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import {
  ArrowRight,
  Bookmark,
  BusFront,
  CarFront,
  ChevronRight,
  Compass,
  Expand,
  Globe2,
  MapPin,
  Moon,
  Plane,
  Plus,
  Search,
  Sun,
  TentTree,
  UserRound,
  X,
  CalendarDays,
  Users,
  Wallet,
  Hotel,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

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

type Stop = {
  id: string;
  number: string;
  name: string;
  country?: string;

  transport?: string;
  detail?: string;

  tone?: "orange" | "teal";
  icon?: "mixed" | "plane";
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value?: Date) {
  if (!value) return "TBD";

  return value.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(minutes?: number) {
  if (!minutes) return "TBD";

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TripPlannerMap() {
  const navigate = useNavigate();

  const { state } = useLocation();

  const tripState = (state as TripState | undefined) ?? {};

  /* =======================================================
     THEME
  ======================================================= */

  const [darkMode, setDarkMode] = useState(false);

  /* =======================================================
     SAVE
  ======================================================= */

  const [saved, setSaved] = useState(false);

  /* =======================================================
     NAV
  ======================================================= */

  const [activeNav, setActiveNav] = useState("compass");

  /* =======================================================
     DESTINATION
  ======================================================= */

  const destination = tripState.destination ?? {
    name: "Santorini",
    country: "Greece",
    latitude: 36.3932,
    longitude: 25.4615,
  };

  /* =======================================================
     ORIGIN
  ======================================================= */

  const userLocation = tripState.origin ?? null;

  /* =======================================================
     TRAVELERS
  ======================================================= */

  const adults = tripState.adults ?? 2;
  const children = tripState.children ?? 0;
  const travelers = adults + children;

  /* =======================================================
     DATES
  ======================================================= */

  const selectedDates = tripState.selectedDates;

  /* =======================================================
     BUDGET
  ======================================================= */

  const parsedBudget = Number(tripState.budget);

  const estimatedBudget =
    Number.isFinite(parsedBudget) && parsedBudget > 0
      ? parsedBudget
      : 1800;

  /* =======================================================
     ROUTES
  ======================================================= */

  const routes = tripState.routes ?? [];

  const availableRoutes = routes.filter(
    (route) => route.available
  );

  const [selectedRoute, setSelectedRoute] =
    useState<RouteOption | null>(
      availableRoutes[0] ?? null
    );

  /* =======================================================
     FLIGHT
  ======================================================= */

  const flight = tripState.flight;

  /* =======================================================
     ADD DESTINATION
  ======================================================= */

  const [newDestination, setNewDestination] = useState("");

  const [searched, setSearched] = useState(false);

  /* =======================================================
     MAP ROUTE GEOMETRY
  ======================================================= */

  const routeGeometry = useMemo(() => {
    if (!selectedRoute?.geometry) {
      return null;
    }

    try {
      return JSON.parse(selectedRoute.geometry);
    } catch (error) {
      console.error(
        "Failed to parse route geometry:",
        error
      );

      return null;
    }
  }, [selectedRoute]);

  /* =======================================================
     STOPS
  ======================================================= */

  const stops: Stop[] = [
    {
      id: "destination",
      number: "1",
      name: destination.name,
      country: destination.country,
      transport: selectedRoute?.name,
      detail: selectedRoute
        ? `${formatDuration(
            selectedRoute.durationMinutes
          )} · ${
            selectedRoute.estimatedPrice
              ? `from $${selectedRoute.estimatedPrice}`
              : "price unavailable"
          }`
        : "Select a transport option",
      tone: "orange",
      icon: "mixed",
    },
  ];

  /* =======================================================
     THEME COLORS
  ======================================================= */

  const theme = {
    page: darkMode ? "#0D1117" : "#F5F5F7",

    header: darkMode ? "#0D1117" : "#FFFFFF",

    panel: darkMode ? "#111720" : "#FFFFFF",

    card: darkMode ? "#1E1E2E" : "#FFFFFF",

    cardSecondary: darkMode
      ? "#181F29"
      : "#FFFFFF",

    border: darkMode
      ? "#2A2A3E"
      : "#E5E5E5",

    text: darkMode
      ? "#FFFFFF"
      : "#0F1F3D",

    muted: darkMode
      ? "#8993A2"
      : "#888888",

    primary: "#00BFA5",

    primaryHover: "#28D3BA",

    route: darkMode
      ? "#00BFA5"
      : "#4F46E5",
  };

  /* =======================================================
     NAVIGATION ITEMS
  ======================================================= */

  const navItems = [
    {
      id: "compass",
      icon: Compass,
      label: "Explore",
    },
    {
      id: "person",
      icon: UserRound,
      label: "Travelers",
    },
    {
      id: "camp",
      icon: TentTree,
      label: "Camping",
    },
    {
      id: "pin",
      icon: MapPin,
      label: "Places",
    },
  ];

  /* =======================================================
     HOTEL HANDLER
  ======================================================= */

  function handleHotels() {
    /*
      Later this can navigate to:

      /hotels

      and pass:

      destination
      selectedDates
      travelers
      budget

      Example:

      navigate("/hotels", {
        state: {
          destination,
          selectedDates,
          adults,
          children,
          budget: estimatedBudget
        }
      });
    */

    navigate("/hotels", {
      state: {
        destination,
        selectedDates,
        adults,
        children,
        budget: estimatedBudget,
      },
    });
  }

  /* =======================================================
     REMOVE DESTINATION
  ======================================================= */

  function removeDestination() {
    /*
      Currently your TripState only contains one destination.

      When multi-stop support is added, this should update
      the destinations array instead.
    */

    console.log("Remove destination:", destination.name);
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSearch() {
    setSearched(true);

    /*
      Later this can call your destination backend.

      Example:

      GET /api/Destinations?search=...
    */
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        backgroundColor: theme.page,
        color: theme.text,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className="flex h-16 items-center gap-5 border-b px-6"
        style={{
          backgroundColor: theme.header,
          borderColor: theme.border,
        }}
      >
        {/* LOGO */}

        <div className="flex w-[220px] shrink-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              backgroundColor: theme.primary,
              color: darkMode ? "#071B1B" : "#FFFFFF",
            }}
          >
            <Compass
              size={21}
              strokeWidth={2.7}
            />
          </span>

          <span className="text-[19px] font-bold tracking-[-0.04em]">
            TripPlanner
          </span>
        </div>

        {/* DESTINATION PATH */}

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-2"
          aria-label="Trip destinations"
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-10 min-w-[180px] max-w-[260px] items-center justify-between rounded-full border px-4 text-[14px] font-semibold"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <span className="truncate">
                {destination.name}
              </span>

              <button
                onClick={removeDestination}
                aria-label={`Remove ${destination.name}`}
                className="ml-2"
                style={{
                  color: theme.muted,
                }}
              >
                <X size={15} />
              </button>
            </div>

            <ArrowRight
              size={16}
              style={{
                color: theme.muted,
              }}
            />
          </div>

          <button
            aria-label="More destinations"
            className="flex h-10 w-11 items-center justify-center rounded-full border text-lg font-bold"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.muted,
            }}
          >
            •••
          </button>

          <button
            onClick={handleSearch}
            className="ml-1 flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-bold transition"
            style={{
              backgroundColor: theme.primary,
              color: darkMode
                ? "#071B1B"
                : "#FFFFFF",
            }}
          >
            <Search size={16} />

            <span>
              {searched ? "Updated" : "Search"}
            </span>
          </button>
        </nav>

        {/* THEME */}

        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full border transition"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          {darkMode ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>

        {/* SIGN IN */}

        <button
          onClick={() => navigate("/login")}
          className="w-[100px] rounded-full border px-4 py-2 text-[13px] font-semibold transition"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          Sign in
        </button>
      </header>

      {/* =====================================================
          BODY
      ===================================================== */}

      <section className="flex h-[calc(100vh-64px)] min-h-[720px]">
        {/* ===================================================
            LEFT ICON BAR
        =================================================== */}

        <aside
          className="flex w-12 shrink-0 flex-col items-center justify-between border-r py-7"
          style={{
            backgroundColor: theme.header,
            borderColor: theme.border,
          }}
        >
          <div className="flex flex-col items-center gap-7">
            {navItems.map(
              ({
                id,
                icon: Icon,
                label,
              }) => {
                const active =
                  activeNav === id;

                return (
                  <button
                    key={id}
                    onClick={() =>
                      setActiveNav(id)
                    }
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition"
                    style={{
                      backgroundColor: active
                        ? darkMode
                          ? "#123C3A"
                          : "#DDF7F2"
                        : "transparent",

                      color: active
                        ? theme.primary
                        : theme.muted,
                    }}
                  >
                    <Icon
                      size={21}
                      strokeWidth={
                        active ? 2.7 : 2
                      }
                    />
                  </button>
                );
              }
            )}
          </div>

          <button
            aria-label="World"
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              color: theme.muted,
            }}
          >
            <Globe2 size={21} />
          </button>
        </aside>

        {/* ===================================================
            TRIP SIDEBAR
        =================================================== */}

        <aside
          className="z-10 w-[380px] shrink-0 overflow-y-auto border-r px-7 py-7"
          style={{
            backgroundColor: theme.panel,
            borderColor: theme.border,
          }}
        >
          {/* HEADER */}

          <div className="mb-7 flex items-start justify-between">
            <div>
              <h1 className="text-[21px] font-bold tracking-[-0.035em]">
                Trip overview
              </h1>

              <p
                className="mt-1 text-[13px]"
                style={{
                  color: theme.muted,
                }}
              >
                {travelers} travelers
                <span className="mx-1">·</span>
                Budget ${estimatedBudget}
              </p>
            </div>

            <button
              onClick={() =>
                setSaved(!saved)
              }
              className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-bold transition"
              style={{
                backgroundColor: saved
                  ? darkMode
                    ? "#27313B"
                    : "#E6F8F5"
                  : theme.primary,

                color: saved
                  ? theme.primary
                  : darkMode
                  ? "#071B1B"
                  : "#FFFFFF",
              }}
            >
              <Bookmark
                size={16}
                fill={
                  saved
                    ? "currentColor"
                    : "none"
                }
              />

              <span>
                {saved ? "Saved" : "Save"}
              </span>
            </button>
          </div>

          {/* =================================================
              DESTINATION TIMELINE
          ================================================= */}

          <div className="relative pb-4">
            <div
              className="absolute bottom-8 left-[19px] top-5 w-px"
              style={{
                backgroundColor: darkMode
                  ? "#0D8F80"
                  : "#8ADFD2",
              }}
            />

            {stops.map((stop) => (
              <article
                key={stop.id}
                className="relative mb-5 flex gap-4"
              >
                {/* NUMBER */}

                <div
                  className="z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 text-sm font-bold shadow-sm"
                  style={{
                    backgroundColor: darkMode
                      ? "#123C3A"
                      : "#0F1F3D",

                    color: darkMode
                      ? "#00BFA5"
                      : "#FFFFFF",

                    borderColor:
                      theme.panel,
                  }}
                >
                  {stop.number}
                </div>

                <div className="min-w-0 flex-1">
                  {/* DESTINATION CARD */}

                  <div
                    className="rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor:
                        theme.card,
                      borderColor:
                        theme.border,
                    }}
                  >
                    <h2 className="truncate text-[15px] font-bold">
                      {stop.name}
                    </h2>

                    <p
                      className="mt-1 text-xs"
                      style={{
                        color: theme.muted,
                      }}
                    >
                      {stop.country}
                    </p>

                    <button
                      onClick={handleHotels}
                      className="mt-2 flex items-center gap-1 text-[13px] font-semibold"
                      style={{
                        color: theme.primary,
                      }}
                    >
                      <Hotel size={14} />

                      View hotels

                      <span className="text-base">
                        ›
                      </span>
                    </button>
                  </div>

                  {/* TRANSPORT */}

                  {stop.transport && (
                    <div
                      className="mt-3 flex items-center gap-3 rounded-xl border px-4 py-3.5"
                      style={{
                        backgroundColor:
                          theme.cardSecondary,
                        borderColor:
                          theme.border,
                      }}
                    >
                      <span
                        className={
                          stop.tone === "orange"
                            ? "flex items-center gap-1 text-[#FF7043]"
                            : "text-[#00BFA5]"
                        }
                      >
                        {stop.icon ===
                        "mixed" ? (
                          <>
                            <BusFront
                              size={21}
                              strokeWidth={2.6}
                            />

                            <CarFront
                              size={20}
                              strokeWidth={2.6}
                            />
                          </>
                        ) : (
                          <Plane
                            size={21}
                            strokeWidth={2.5}
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold">
                          {stop.transport}
                        </h3>

                        <p
                          className="mt-1 text-[12px]"
                          style={{
                            color: theme.muted,
                          }}
                        >
                          {stop.detail}
                        </p>
                      </div>

                      <ChevronRight
                        size={20}
                        style={{
                          color: theme.primary,
                        }}
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}

            {/* ADD DESTINATION */}

            <div
              className="ml-[54px] flex items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-sm"
              style={{
                backgroundColor: darkMode
                  ? "#151C25"
                  : "#F5F5F7",

                borderColor: darkMode
                  ? "#3A4552"
                  : "#D4D8DC",

                color: theme.muted,
              }}
            >
              <button
                aria-label="Add destination"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    theme.primary,
                  color: darkMode
                    ? "#071B1B"
                    : "#FFFFFF",
                }}
              >
                <Plus size={18} />
              </button>

              <input
                value={newDestination}
                onChange={(event) =>
                  setNewDestination(
                    event.target.value
                  )
                }
                placeholder="Add destination"
                aria-label="Add destination"
                className="min-w-0 flex-1 bg-transparent outline-none"
                style={{
                  color: theme.text,
                }}
              />
            </div>
          </div>

          {/* =================================================
              TRIP INFORMATION
          ================================================= */}

          <div className="mt-6 space-y-3">
            {/* TRAVELERS */}

            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor:
                  theme.cardSecondary,
                borderColor:
                  theme.border,
              }}
            >
              <div className="flex items-center gap-2">
                <Users size={17} />

                <span className="font-semibold">
                  Travelers
                </span>
              </div>

              <p
                className="mt-2 text-sm"
                style={{
                  color: theme.muted,
                }}
              >
                {adults} adults
                {children > 0 &&
                  ` · ${children} children`}
              </p>
            </div>

            {/* DATES */}

            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor:
                  theme.cardSecondary,
                borderColor:
                  theme.border,
              }}
            >
              <div className="flex items-center gap-2">
                <CalendarDays size={17} />

                <span className="font-semibold">
                  Travel dates
                </span>
              </div>

              <p
                className="mt-2 text-sm"
                style={{
                  color: theme.muted,
                }}
              >
                {formatDate(
                  selectedDates?.from
                )}{" "}
                —{" "}
                {formatDate(
                  selectedDates?.to
                )}
              </p>
            </div>

            {/* BUDGET */}

            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor:
                  theme.cardSecondary,
                borderColor:
                  theme.border,
              }}
            >
              <div className="flex items-center gap-2">
                <Wallet size={17} />

                <span className="font-semibold">
                  Budget
                </span>
              </div>

              <p
                className="mt-2 text-sm"
                style={{
                  color: theme.muted,
                }}
              >
                ${estimatedBudget} estimated total
              </p>
            </div>
          </div>
        </aside>

        {/* ===================================================
            MAP AREA
        =================================================== */}

        <section
          className="relative min-w-0 flex-1 overflow-hidden"
          aria-label="Trip route map"
        >
          <Map
            initialViewState={{
              longitude:
                destination.longitude,
              latitude:
                destination.latitude,
              zoom: 8,
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
            mapStyle={
              darkMode
                ? "https://tiles.openfreemap.org/styles/dark"
                : "https://tiles.openfreemap.org/styles/bright"
            }
          >
            <NavigationControl
              position="top-right"
            />

            {/* ===============================================
                SELECTED ROUTE
            =============================================== */}

            {routeGeometry && (
              <Source
                id="selected-route"
                type="geojson"
                data={{
                  type: "Feature",
                  properties: {},
                  geometry:
                    routeGeometry,
                }}
              >
                <Layer
                  id="selected-route-line"
                  type="line"
                  paint={{
                    "line-color":
                      theme.route,
                    "line-width": 5,
                    "line-opacity": 0.85,
                  }}
                />
              </Source>
            )}

            {/* ===============================================
                ORIGIN
            =============================================== */}

            {userLocation && (
              <Marker
                longitude={
                  userLocation.longitude
                }
                latitude={
                  userLocation.latitude
                }
                anchor="bottom"
              >
                <div
                  className="h-4 w-4 rounded-full border-2 border-white"
                  style={{
                    backgroundColor:
                      "#2563EB",
                    boxShadow:
                      "0 0 0 5px rgba(37,99,235,0.25)",
                  }}
                />
              </Marker>
            )}

            {/* ===============================================
                DESTINATION
            =============================================== */}

            <Marker
              longitude={
                destination.longitude
              }
              latitude={
                destination.latitude
              }
              anchor="bottom"
            >
              <MapPin
                size={34}
                className="text-red-600"
                fill="red"
              />
            </Marker>
          </Map>

          {/* =================================================
              MAP DESTINATION CARD
          ================================================= */}

          <div
            className="absolute left-6 top-6 max-w-[330px] rounded-2xl border p-4 shadow-xl backdrop-blur"
            style={{
              backgroundColor: darkMode
                ? "rgba(30,30,46,0.92)"
                : "rgba(255,255,255,0.94)",

              borderColor: theme.border,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor:
                    darkMode
                      ? "#123C3A"
                      : "#DDF7F2",
                  color: theme.primary,
                }}
              >
                <MapPin size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold">
                  {destination.name}
                </h2>

                <p
                  className="text-sm"
                  style={{
                    color: theme.muted,
                  }}
                >
                  {destination.country}
                </p>
              </div>
            </div>

            <button
              onClick={handleHotels}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold"
              style={{
                backgroundColor:
                  theme.primary,
                color: darkMode
                  ? "#071B1B"
                  : "#FFFFFF",
              }}
            >
              <Hotel size={16} />

              View hotels
            </button>
          </div>

          {/* =================================================
              TRANSPORT SELECTOR
          ================================================= */}

          <div
            className="absolute bottom-6 left-6 right-6 rounded-2xl border p-4 shadow-xl backdrop-blur"
            style={{
              backgroundColor: darkMode
                ? "rgba(17,23,32,0.94)"
                : "rgba(255,255,255,0.95)",

              borderColor: theme.border,
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold">
                  How do you want to travel?
                </h2>

                <p
                  className="text-xs"
                  style={{
                    color: theme.muted,
                  }}
                >
                  Choose an available transport
                  option.
                </p>
              </div>

              {selectedRoute && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor:
                      darkMode
                        ? "#123C3A"
                        : "#DDF7F2",
                    color:
                      theme.primary,
                  }}
                >
                  {selectedRoute.type}
                </span>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {routes.map((route) => {
                const isSelected =
                  selectedRoute?.type ===
                  route.type;

                return (
                  <button
                    key={route.type}
                    disabled={!route.available}
                    onClick={() => {
                      if (route.available) {
                        setSelectedRoute(
                          route
                        );
                      }
                    }}
                    className="min-w-[180px] rounded-xl border p-3 text-left transition"
                    style={{
                      backgroundColor:
                        !route.available
                          ? darkMode
                            ? "#151C25"
                            : "#F5F5F7"
                          : isSelected
                          ? darkMode
                            ? "#123C3A"
                            : "#DDF7F2"
                          : theme.card,

                      borderColor:
                        isSelected
                          ? theme.primary
                          : theme.border,

                      opacity:
                        !route.available
                          ? 0.5
                          : 1,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {route.type}
                      </span>

                      {isSelected && (
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color:
                              theme.primary,
                          }}
                        >
                          Selected
                        </span>
                      )}
                    </div>

                    {route.available ? (
                      <>
                        <p
                          className="mt-2 text-xs"
                          style={{
                            color:
                              theme.muted,
                          }}
                        >
                          {formatDuration(
                            route.durationMinutes
                          )}
                        </p>

                        <p
                          className="text-xs"
                          style={{
                            color:
                              theme.muted,
                          }}
                        >
                          {route.distanceKm?.toFixed(
                            1
                          )}{" "}
                          km
                        </p>

                        {route.estimatedPrice !==
                          undefined && (
                          <p
                            className="mt-1 text-sm font-semibold"
                            style={{
                              color:
                                theme.primary,
                            }}
                          >
                            From $
                            {
                              route.estimatedPrice
                            }
                          </p>
                        )}
                      </>
                    ) : (
                      <p
                        className="mt-2 text-xs"
                        style={{
                          color:
                            theme.muted,
                        }}
                      >
                        Not available
                      </p>
                    )}
                  </button>
                );
              })}

              {/* FLIGHT */}

              {flight && (
                <button
                  disabled={!flight.available}
                  className="min-w-[180px] rounded-xl border p-3 text-left"
                  style={{
                    backgroundColor:
                      flight.available
                        ? theme.card
                        : darkMode
                        ? "#151C25"
                        : "#F5F5F7",

                    borderColor:
                      theme.border,

                    opacity:
                      flight.available
                        ? 1
                        : 0.5,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Flight
                    </span>

                    <Plane size={18} />
                  </div>

                  <p
                    className="mt-2 text-xs"
                    style={{
                      color: theme.muted,
                    }}
                  >
                    {flight.available
                      ? flight.airline ??
                        "Available"
                      : "Not available"}
                  </p>

                  {flight.available &&
                    flight.estimatedPrice !==
                      undefined && (
                      <p
                        className="mt-1 text-sm font-semibold"
                        style={{
                          color:
                            theme.primary,
                        }}
                      >
                        From $
                        {
                          flight.estimatedPrice
                        }
                      </p>
                    )}
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              MAP EXPAND
          ================================================= */}

          <button
            aria-label="Expand map"
            className="absolute right-6 top-20 flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg"
            style={{
              backgroundColor:
                theme.card,
              borderColor:
                theme.border,
            }}
          >
            <Expand size={19} />
          </button>

          {/* MAP ATTRIBUTION */}

          <div
            className="absolute bottom-1 right-6 text-[10px]"
            style={{
              color: theme.muted,
            }}
          >
            Map data © 2026 TripPlanner
          </div>
        </section>
      </section>
    </main>
  );
}