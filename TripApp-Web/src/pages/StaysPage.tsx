import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Check,
  Heart,
  MapPin,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StayCard from "../components/stays/StayCard";
import { STAYS } from "../data/stays";
import type { Stay } from "../data/stays";
import { listFavoriteStays, toggleStayFavorite } from "../utils/stayFavorites";

type SortKey = "recommended" | "rating" | "price-low" | "price-high";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6];

function StayDialog({
  stay,
  liked,
  onToggleLike,
  onClose,
}: {
  stay: Stay;
  liked: boolean;
  onToggleLike: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B1B33]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stay-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="thin-scroll max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-t-[20px] border border-line bg-surface shadow-[var(--shadow-float)] sm:rounded-[20px]"
      >
        <div className="relative h-[220px] bg-canvas sm:h-[260px]">
          <img
            src={stay.img}
            alt={stay.name}
            className="h-full w-full object-cover"
            width={800}
            height={500}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close stay details"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-ink backdrop-blur transition hover:bg-surface"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="absolute left-3 top-3 flex gap-1.5">
            {stay.badge && (
              <span className="rounded-md bg-[#D92D20] px-2 py-0.5 text-[10px] font-semibold text-white">
                {stay.badge}
              </span>
            )}
            <span className="rounded-md bg-surface/90 px-2 py-0.5 text-[10px] font-semibold text-body backdrop-blur">
              {stay.country}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="stay-dialog-title"
                className="text-[19px] font-extrabold tracking-[-0.02em] text-ink"
              >
                {stay.name}
              </h2>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#FDB022] text-[#FDB022]" aria-hidden="true" />
                  <span className="font-semibold text-body">{stay.rating.toFixed(1)}</span>
                  <span>({stay.reviews} reviews)</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {stay.address}, {stay.city}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleLike}
              aria-pressed={liked}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${
                liked
                  ? "border-transparent bg-danger-50 text-danger"
                  : "border-line bg-surface text-body hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}
                aria-hidden="true"
              />
              {liked ? "Saved" : "Save"}
            </button>
          </div>

          <p className="mt-3 text-[13.5px] leading-relaxed text-body">{stay.description}</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: BedDouble, label: `${stay.beds} bedrooms` },
              { icon: Bath, label: `${stay.baths} bathrooms` },
              { icon: Users, label: `Sleeps ${stay.guests}` },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-[10px] border border-line bg-canvas px-2.5 py-2 text-[12px] text-body"
              >
                <Icon className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>

          <h3 className="mt-5 text-[11px] font-bold uppercase tracking-[0.09em] text-faint">
            What this place offers
          </h3>

          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {stay.amenities.map((amenity) => (
              <li key={amenity} className="flex items-center gap-1.5 text-[12.5px] text-body">
                <Check className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {amenity}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
            <p className="text-[22px] font-extrabold text-ink">
              ${stay.price}
              <span className="text-[12px] font-normal text-muted"> /night</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-canvas"
              >
                Close
              </button>

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-brand-strong"
              >
                Plan a trip
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaysPage() {
  const [query, setQuery] = useState("");
  const [minGuests, setMinGuests] = useState<number | "any">("any");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => listFavoriteStays());
  const [active, setActive] = useState<Stay | null>(null);

  const toggleFavorite = (id: string) => {
    setFavorites(toggleStayFavorite(id));
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = STAYS.filter((stay) => {
      const haystack = `${stay.name} ${stay.city} ${stay.country} ${stay.address}`.toLowerCase();
      const matchesQuery = needle.length === 0 || haystack.includes(needle);
      const matchesGuests = minGuests === "any" || stay.guests >= minGuests;
      const matchesFavorite = !favoritesOnly || favorites.includes(stay.id);

      return matchesQuery && matchesGuests && matchesFavorite;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;

      return b.rating * 100 + b.reviews / 1000 - (a.rating * 100 + a.reviews / 1000);
    });
  }, [query, minGuests, sort, favoritesOnly, favorites]);

  const hasFilters = query.trim().length > 0 || minGuests !== "any" || favoritesOnly;

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

            <p className="mt-2 max-w-[56ch] text-[14px] leading-relaxed text-muted">
              Handpicked hotels, villas and lodges for the places you are planning.
              Filter by guests and price, then keep the ones you like.
            </p>
          </div>

          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-muted">
            {visible.length} of {STAYS.length} stays
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-surface p-2.5 shadow-[var(--shadow-card)]">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
              aria-hidden="true"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by city, country or stay name"
              aria-label="Search stays"
              className="h-9 w-full rounded-lg border border-line bg-canvas pl-8 pr-2.5 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:bg-surface"
            />
          </div>

          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
            <Users className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
            <span className="sr-only">Minimum guests</span>

            <select
              value={minGuests}
              onChange={(event) =>
                setMinGuests(event.target.value === "any" ? "any" : Number(event.target.value))
              }
              aria-label="Minimum guests"
              className="h-9 rounded-lg border border-line bg-canvas px-2 text-[12.5px] font-semibold text-body outline-none transition focus:border-brand"
            >
              <option value="any">Any guests</option>
              {GUEST_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}+ guests
                </option>
              ))}
            </select>
          </label>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Sort stays"
            className="h-9 rounded-lg border border-line bg-canvas px-2 text-[12.5px] font-semibold text-body outline-none transition focus:border-brand"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setFavoritesOnly((value) => !value)}
            aria-pressed={favoritesOnly}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition ${
              favoritesOnly
                ? "border-transparent bg-danger-50 text-danger"
                : "border-line bg-canvas text-muted hover:text-ink"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-current" : ""}`}
              aria-hidden="true"
            />
            Favourites
            <span className="rounded-full bg-surface px-1.5 text-[10.5px] font-bold text-body">
              {favorites.length}
            </span>
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-dashed border-line bg-surface px-6 py-12 text-center">
            <h2 className="text-[15px] font-bold text-ink">No stays match those filters</h2>

            <p className="mt-1 text-[12.5px] text-muted">
              Widen the guest count, clear the search or turn off favourites.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setMinGuests("any");
                  setFavoritesOnly(false);
                }}
                className="mt-4 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((stay) => (
              <StayCard
                key={stay.id}
                stay={stay}
                variant="tile"
                liked={favorites.includes(stay.id)}
                onToggleLike={toggleFavorite}
                onOpen={setActive}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {active && (
        <StayDialog
          stay={active}
          liked={favorites.includes(active.id)}
          onToggleLike={() => toggleFavorite(active.id)}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
