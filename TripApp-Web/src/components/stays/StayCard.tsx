import { ArrowUpRight, Bath, BedDouble, Heart, MapPin, Star, Users, Wifi } from "lucide-react";

import type { Stay } from "../../data/stays";

function HeartButton({
  liked,
  name,
  onToggle,
}: {
  liked: boolean;
  name: string;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle?.();
      }}
      aria-label={liked ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      aria-pressed={liked}
      className={`grid h-8 w-8 place-items-center rounded-full border backdrop-blur transition ${
        liked
          ? "border-transparent bg-surface/90 text-danger"
          : "border-line/70 bg-surface/80 text-muted hover:text-danger"
      }`}
    >
      <Heart
        className={`h-4 w-4 ${liked ? "fill-[#D92D20] text-[#D92D20]" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

function Rating({ stay }: { stay: Stay }) {
  return (
    <div className="flex min-w-0 items-center gap-1 text-[11.5px] text-muted">
      <Star className="h-3 w-3 shrink-0 fill-[#FDB022] text-[#FDB022]" aria-hidden="true" />
      <span className="font-semibold text-body">{stay.rating.toFixed(1)}</span>
      <span>({stay.reviews})</span>
      <span className="mx-0.5">·</span>
      <span className="truncate">
        {stay.city}, {stay.country}
      </span>
    </div>
  );
}

const SPECS = [
  { key: "beds", icon: BedDouble, label: (stay: Stay) => `${stay.beds} beds` },
  { key: "baths", icon: Bath, label: (stay: Stay) => `${stay.baths} baths` },
  { key: "guests", icon: Users, label: (stay: Stay) => `${stay.guests} guests` },
] as const;

type Props = {
  stay: Stay;
  liked?: boolean;
  onToggleLike?: (id: string) => void;
  onOpen?: (stay: Stay) => void;
  variant?: "compact" | "tile";
};

export default function StayCard({
  stay,
  liked = false,
  onToggleLike,
  onOpen,
  variant = "compact",
}: Props) {
  const toggle = () => onToggleLike?.(stay.id);

  if (variant === "tile") {
    return (
      <article className="group flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-[var(--shadow-float)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-canvas">
          <img
            src={stay.img}
            alt={stay.name}
            loading="lazy"
            width={800}
            height={500}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {stay.badge && (
              <span className="rounded-md bg-[#D92D20] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {stay.badge}
              </span>
            )}
            <span className="rounded-md bg-surface/90 px-1.5 py-0.5 text-[10px] font-semibold text-body backdrop-blur">
              {stay.country}
            </span>
          </div>

          <div className="absolute right-2.5 top-2.5">
            <HeartButton liked={liked} name={stay.name} onToggle={toggle} />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink">{stay.name}</h3>

          <div className="mt-1.5">
            <Rating stay={stay} />
          </div>

          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
            {stay.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11.5px] text-muted">
            {SPECS.map(({ key, icon: Icon, label }) => (
              <span key={key} className="flex items-center gap-1">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label(stay)}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> Wi-Fi
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-line-soft pt-3.5">
            <p className="text-[16px] font-extrabold text-ink">
              ${stay.price}
              <span className="text-[11px] font-normal text-muted"> /night</span>
            </p>

            <button
              type="button"
              onClick={() => onOpen?.(stay)}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-ink transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
            >
              View stay
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="flex gap-3 rounded-[16px] border border-line bg-surface p-3 shadow-[var(--shadow-card)] transition hover:border-brand-100">
      <div className="relative h-[104px] w-[128px] shrink-0 overflow-hidden rounded-[11px] bg-canvas">
        <img
          src={stay.img}
          alt={stay.name}
          loading="lazy"
          width={400}
          height={300}
          className="h-full w-full object-cover"
        />

        {stay.badge && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-[#D92D20] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {stay.badge}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[13.5px] font-bold text-ink">{stay.name}</h3>

            <HeartButton liked={liked} name={stay.name} onToggle={toggle} />
          </div>

          <div className="mt-1">
            <div className="flex min-w-0 items-center gap-1 text-[11.5px] text-muted">
              <Star
                className="h-3 w-3 shrink-0 fill-[#FDB022] text-[#FDB022]"
                aria-hidden="true"
              />
              <span className="font-semibold text-body">{stay.rating}</span>
              <span>({stay.reviews})</span>
              <span className="mx-0.5">·</span>
              <span className="flex min-w-0 items-center gap-0.5 truncate">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                {stay.address}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" aria-hidden="true" /> {stay.beds} beds
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" aria-hidden="true" /> {stay.baths} baths
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" /> {stay.guests} guests
          </span>
          <Wifi className="h-3 w-3" aria-label="Wi-Fi" />
        </div>

        <p className="text-right text-[13.5px] font-bold text-ink">
          ${stay.price}
          <span className="text-[11px] font-normal text-muted"> /night</span>
        </p>
      </div>
    </div>
  );
}
