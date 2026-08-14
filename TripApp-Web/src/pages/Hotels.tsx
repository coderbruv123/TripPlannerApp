import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  MapPin,
  Star,
  Hotel as HotelIcon,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { useDarkMode } from "../hooks/useDarkMode";

type Hotel = {
  id: number;
  name: string;
  address?: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  stars?: number;
  website?: string;
  phone?: string;
  estimatedPricePerNight?: number | null;
};

type Destination = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

export default function Hotels() {
  const [darkMode] = useDarkMode();
  const navigate = useNavigate();
  const { state } = useLocation();

  const destination = (state as { destination?: Destination })
    ?.destination;

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      if (active) {
        setLoading(false);
        setError(
          "Hotels are taking longer than expected. Please refresh."
        );
      }
    }, 8000);

    const load =
      destination &&
      destination.latitude !== 0 &&
      destination.longitude !== 0
        ? api.get<Hotel[]>("/hotels/near", {
            params: {
              latitude: destination.latitude,
              longitude: destination.longitude,
              radiusKm: 50,
              limit: 30,
            },
          })
        : api.get<Hotel[]>("/hotels");

    load
      .then((res) => {
        if (active) {
          setHotels(res.data || []);
          setError("");
        }
      })
      .catch((err) => {
        console.error("Hotel load failed:", err);
        if (active)
          setError("Unable to load hotels right now.");
      })
      .finally(() => {
        window.clearTimeout(timer);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [destination]);

  const bg = darkMode ? "#0D1117" : "#F5F5F7";
  const card = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#232A36" : "#E9E9EC";
  const text = darkMode ? "#E6EDF3" : "#0F1F3D";
  const muted = darkMode ? "#8B949E" : "#667085";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg }}
    >
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-[27px] font-bold tracking-[-0.8px]"
              style={{ color: text }}
            >
              Hotels{destination ? ` in ${destination.name}` : ""}
            </h1>
            <p className="mt-1.5 text-[14px]" style={{ color: muted }}>
              {destination
                ? destination.country
                : "Featured stays from our catalog."}
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="rounded-full border px-4 py-2 text-[13px] font-semibold"
            style={{ color: text, borderColor: border }}
          >
            Back
          </button>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600"
            style={{ color: darkMode ? "#FFB4A2" : "#B91C1C" }}
          >
            {error}
          </div>
        )}

        {loading && (
          <p className="py-8 text-center text-sm" style={{ color: muted }}>
            Loading hotels…
          </p>
        )}

        {!loading && !error && hotels.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: muted }}>
            No hotels yet. Add some from the admin panel.
          </p>
        )}

        {!loading && hotels.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => (
              <li
                key={hotel.id}
                className="rounded-2xl border p-5 shadow-sm"
                style={{
                  backgroundColor: card,
                  borderColor: border,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: darkMode
                        ? "#123C3A"
                        : "#E8F8F6",
                      color: "#00BFA5",
                    }}
                  >
                    <HotelIcon size={18} />
                  </span>

                  {hotel.stars ? (
                    <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: muted }}>
                      <Star size={13} fill="currentColor" color="#F5B301" />
                      {hotel.stars}
                    </span>
                  ) : null}
                </div>

                <h3
                  className="mt-3 text-[15px] font-bold leading-snug"
                  style={{ color: text }}
                >
                  {hotel.name}
                </h3>

                <p className="mt-1 text-[12px] leading-5" style={{ color: muted }}>
                  <MapPin size={12} className="mr-1 inline" />
                  {hotel.address || "Address unavailable"}
                </p>

                <p className="mt-3 flex items-center justify-between text-[12px] font-semibold" style={{ color: "#00BFA5" }}>
                  <span>{hotel.city || "Hotel"}</span>
                  {hotel.estimatedPricePerNight != null && (
                    <span>
                      ${Math.round(hotel.estimatedPricePerNight)}
                      <span className="font-normal" style={{ color: muted }}>
                        {" "}/night
                      </span>
                    </span>
                  )}
                </p>

                {hotel.website && (
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center gap-1 text-[13px] font-semibold hover:underline"
                    style={{ color: "#00BFA5" }}
                  >
                    <ExternalLink size={13} />
                    Visit website
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
