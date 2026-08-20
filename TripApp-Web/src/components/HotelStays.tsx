import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  ExternalLink,
  Building2,
} from "lucide-react";
import api from "../api/axiosInstance";
import { useDarkMode } from "../hooks/useDarkMode";

type Hotel = {
  id: number;
  name: string;
  address?: string;
  city: string;
  distanceKm: number;
  stars?: number;
  website?: string;
  phone?: string;
  estimatedPricePerNight?: number | null;
};

export default function HotelStays() {
  const [darkMode] = useDarkMode();
  const navigate = useNavigate();

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

    api
      .get<Hotel[]>("/hotels")
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
  }, []);

  const bg = darkMode ? "#0D1117" : "#FFFFFF";
  const text = darkMode ? "#E6EDF3" : "#0F1F3D";
  const muted = darkMode ? "#8B949E" : "#667085";
  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const cardBorder = darkMode ? "#232A36" : "#E9E9EC";
  const primary = "#00BFA5";

  return (
    <section
      className="mx-auto max-w-7xl px-6 py-16 lg:px-10"
      style={{ backgroundColor: bg }}
    >
      <div className="mb-8">
        <h2
          className="text-3xl font-bold tracking-tight"
          style={{ color: text }}
        >
          Hotels
        </h2>
        <p className="mt-2" style={{ color: muted }}>
          Featured stays and places to book.
        </p>
      </div>

      {loading && (
        <p className="py-10 text-center" style={{ color: muted }}>
          Finding hotels nearby…
        </p>
      )}

      {!loading && error && (
        <div
          className="rounded-2xl border border-dashed p-8 text-center"
          style={{ borderColor: cardBorder, color: muted }}
        >
          {error}
        </div>
      )}

      {!loading && !error && hotels.length === 0 && (
        <div
          className="rounded-2xl border border-dashed p-8 text-center"
          style={{ borderColor: cardBorder, color: muted }}
        >
          No hotels found nearby.
        </div>
      )}

      {!loading && !error && hotels.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="flex gap-4 rounded-2xl border p-3 shadow-sm"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{
                  backgroundColor: darkMode ? "#123C3A" : "#E8F8F6",
                  color: primary,
                }}
              >
                <Building2 size={32} strokeWidth={1.6} />
              </div>

              <div className="flex flex-1 flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: text }}
                    >
                      {hotel.name}
                    </h3>

                    {hotel.stars ? (
                      <span
                        className="flex shrink-0 items-center gap-0.5 text-xs font-semibold"
                        style={{ color: muted }}
                      >
                        <Star
                          size={13}
                          fill="#F5B301"
                          color="#F5B301"
                        />
                        {hotel.stars}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="mt-1 flex items-center gap-1 text-xs"
                    style={{ color: muted }}
                  >
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">
                      {hotel.address || "Address unavailable"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: primary }}
                  >
                    {hotel.city || "Hotel"}
                  </span>

                  {hotel.website && (
                    <a
                      href={hotel.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold hover:underline"
                      style={{ color: primary }}
                    >
                      <ExternalLink size={12} />
                      Visit
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate("/hotels")}
          className="rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#0F172A" }}
        >
          View all hotels
        </button>
      </div>
    </section>
  );
}
