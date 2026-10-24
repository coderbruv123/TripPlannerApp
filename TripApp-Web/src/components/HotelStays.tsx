import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import StayCard from "./stays/StayCard";
import { STAYS } from "../data/stays";
import { listFavoriteStays, toggleStayFavorite } from "../utils/stayFavorites";

export default function HotelStays() {
  const [favorites, setFavorites] = useState<string[]>(() => listFavoriteStays());

  const toggleFavorite = (id: string) => {
    setFavorites(toggleStayFavorite(id));
  };

  return (
    <section id="hotels" className="mx-auto max-w-[1320px] scroll-mt-24 px-4 py-8 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[21px] font-bold tracking-[-0.02em] text-navy">
            Popular hotels right now
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Handpicked stays with the best guest ratings.
          </p>
        </div>

        <Link
          to="/stays"
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-ink transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
        >
          Browse all stays
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {STAYS.slice(0, 6).map((stay) => (
          <StayCard
            key={stay.id}
            stay={stay}
            liked={favorites.includes(stay.id)}
            onToggleLike={toggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
