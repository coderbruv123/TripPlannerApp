import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import type { DateRange as RdpDateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  ArrowRight,
  CalendarDays,
  Crosshair,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Search,
  Users,
  Wallet,
} from "lucide-react";

import DestinationCombobox from "./DestinationCombobox";
import { buildTripUrl } from "../../utils/tripUrl";
import { countNights, formatRange } from "../../utils/format";
import type { DateRange, Destination, Origin, TripPlan } from "../../types/trip";

const INTERESTS = ["City break", "Food", "History", "Beach", "Nature"];

type GeoStatus = "idle" | "locating" | "ready" | "denied";

function FieldShell({
  icon,
  label,
  children,
  sub,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex min-w-0 items-start gap-2.5 bg-surface px-3.5 py-3 ${className}`}
    >
      <span className="mt-0.5 shrink-0 text-faint" aria-hidden="true">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">
          {label}
        </p>

        <div className="mt-0.5">{children}</div>

        {sub && <p className="mt-0.5 truncate text-[11.5px] text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export default function PlannerCard() {
  const navigate = useNavigate();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  const [dates, setDates] = useState<DateRange | undefined>(undefined);
  const [datesOpen, setDatesOpen] = useState(false);

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [travelersOpen, setTravelersOpen] = useState(false);

  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState<string[]>(["City break"]);

  const [error, setError] = useState<string | null>(null);

  const travelersRef = useRef<HTMLDivElement | null>(null);
  const datesRef = useRef<HTMLDivElement | null>(null);

  const travelers = adults + children;
  const nights = countNights(dates);
  const budgetNumber = Number(budget.replace(/[^\d.]/g, ""));
  const perPerson =
    Number.isFinite(budgetNumber) && budgetNumber > 0 && travelers > 0
      ? Math.round(budgetNumber / travelers)
      : null;

  useEffect(() => {
    if (!travelersOpen && !datesOpen) return;

    const close = (event: MouseEvent) => {
      const target = event.target as Node;

      if (travelersOpen && !travelersRef.current?.contains(target)) {
        setTravelersOpen(false);
      }

      if (datesOpen && !datesRef.current?.contains(target)) {
        setDatesOpen(false);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTravelersOpen(false);
        setDatesOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [travelersOpen, datesOpen]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      setError("This browser can't share a location — search a city instead.");
      return;
    }

    setGeoStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          label: "My current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          kind: "geo",
        });
        setGeoStatus("ready");
        setError(null);
      },
      () => {
        setGeoStatus("denied");
        setError(
          "Location permission denied. Search a starting city, or allow location."
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  };

  const selectOriginCity = (city: Destination | null) => {
    if (!city) {
      setOrigin(null);
      return;
    }

    setOrigin({
      label: `${city.name}, ${city.country}`,
      latitude: city.latitude,
      longitude: city.longitude,
      kind: "city",
    });
    setGeoStatus("idle");
    setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!destination) {
      setError("Pick a destination to start planning.");
      return;
    }

    if (!origin) {
      setError("Add a starting point — a city, or use your current location.");
      return;
    }

    const plan: TripPlan = {
      destination,
      origin,
      dates: dates?.from ? dates : undefined,
      adults,
      children,
      budget: budget.trim() || undefined,
      interests,
    };

    navigate(buildTripUrl(plan));
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-[20px] border border-line bg-surface p-2.5 shadow-[var(--shadow-float)]"
      noValidate
    >
      {/* No overflow-hidden here: it used to clip the destination dropdown and
          the date popover. Corners are rounded per field instead. */}
      <div className="grid gap-px rounded-[14px] bg-line-soft sm:grid-cols-2 xl:grid-cols-[1.5fr_1.1fr_1fr_0.9fr]">
        {/* Destination */}
        <FieldShell
          className="rounded-t-[13px] sm:rounded-tr-none xl:rounded-bl-[13px]"
          icon={<MapPin className="h-4 w-4" />}
          label="Destination"
          sub={
            destination
              ? destination.country
              : "City-level results, ranked by population"
          }
        >
          <DestinationCombobox
            inputId="trip-planner-destination"
            selected={destination}
            onSelect={setDestination}
            ariaLabel="Destination"
          />
        </FieldShell>

        {/* Dates */}
        <div ref={datesRef} className="relative">
          <FieldShell
            className="sm:rounded-tr-[13px] xl:rounded-tr-none"
            icon={<CalendarDays className="h-4 w-4" />}
            label="Dates"
            sub={nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Optional"}
          >
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={datesOpen}
              onClick={() => setDatesOpen((open) => !open)}
              className="w-full truncate text-left text-[14px] font-semibold text-ink"
            >
              {formatRange(dates)}
            </button>
          </FieldShell>

          {datesOpen && (
            <div
              role="dialog"
              aria-label="Choose travel dates"
              className="absolute left-0 top-[calc(100%+10px)] z-40 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-float)]"
            >
              <DayPicker
                mode="range"
                numberOfMonths={1}
                weekStartsOn={1}
                disabled={{ before: new Date() }}
                selected={dates as RdpDateRange | undefined}
                onSelect={(next) => {
                  if (!next?.from) {
                    setDates(undefined);
                    return;
                  }

                  /* The picker reports {from, to} with both equal on the
                     first click. Keep only "from" so the next click can
                     close the range instead of starting a new one. */
                  const hasRealRange =
                    next.to && next.to.getTime() !== next.from.getTime();

                  if (!hasRealRange) {
                    setDates({ from: next.from });
                    return;
                  }

                  setDates({ from: next.from, to: next.to });
                  setDatesOpen(false);
                }}
              />

              <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-[12px]">
                <span className="text-muted">
                  {nights > 0 ? `${nights} nights` : "Pick a start and end date"}
                </span>

                <button
                  type="button"
                  className="font-semibold text-brand-strong hover:underline"
                  onClick={() => setDates(undefined)}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Travelers */}
        <div ref={travelersRef} className="relative">
          <FieldShell
            className="sm:rounded-bl-[13px] xl:rounded-bl-none"
            icon={<Users className="h-4 w-4" />}
            label="Travelers"
            sub={children > 0 ? `${children} under 13` : "Adults and children"}
          >
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={travelersOpen}
              onClick={() => setTravelersOpen((open) => !open)}
              className="w-full truncate text-left text-[14px] font-semibold text-ink"
            >
              {travelers} {travelers === 1 ? "traveler" : "travelers"}
            </button>
          </FieldShell>

          {travelersOpen && (
            <div
              role="dialog"
              aria-label="Travelers"
              className="absolute right-0 top-[calc(100%+10px)] z-40 w-[290px] rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-float)]"
            >
              {[
                {
                  label: "Adults",
                  hint: "Age 13+",
                  value: adults,
                  min: 1,
                  set: setAdults,
                },
                {
                  label: "Children",
                  hint: "Age 2–12",
                  value: children,
                  min: 0,
                  set: setChildren,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{row.label}</p>
                    <p className="text-[11px] text-muted">{row.hint}</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label={`Remove one ${row.label.toLowerCase()}`}
                      disabled={row.value <= row.min}
                      onClick={() => row.set(Math.max(row.min, row.value - 1))}
                      className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition hover:border-brand hover:text-brand disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>

                    <span className="w-5 text-center text-[13px] font-bold text-ink">
                      {row.value}
                    </span>

                    <button
                      type="button"
                      aria-label={`Add one ${row.label.toLowerCase()}`}
                      disabled={row.value >= 12}
                      onClick={() => row.set(Math.min(12, row.value + 1))}
                      className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition hover:border-brand hover:text-brand disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setTravelersOpen(false)}
                className="mt-3 w-full rounded-lg bg-brand py-2 text-[12.5px] font-semibold text-white"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Budget */}
        <FieldShell
          className="rounded-b-[13px] sm:rounded-bl-none xl:rounded-tr-[13px]"
          icon={<Wallet className="h-4 w-4" />}
          label="Budget"
          sub={perPerson ? `$${perPerson.toLocaleString()} per person` : "Optional"}
        >
          <div className="flex items-center gap-1">
            <span className="text-[14px] font-semibold text-faint">$</span>

            <input
              value={budget}
              onChange={(event) =>
                setBudget(event.target.value.replace(/[^\d]/g, "").slice(0, 7))
              }
              inputMode="numeric"
              placeholder="1,500"
              aria-label="Trip budget in dollars"
              className="w-full min-w-0 bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-faint"
            />
          </div>
        </FieldShell>
      </div>

      {/* Origin + submit */}
      <div className="flex flex-wrap items-center gap-2 px-1 pb-0.5 pt-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-line-soft bg-canvas px-2.5 py-1.5">
          <Crosshair className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
              From
            </p>

            {origin ? (
              <p className="truncate text-[12.5px] font-semibold text-ink">
                {origin.label}
                <span className="ml-1.5 rounded bg-sky-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#175cd3]">
                  {origin.kind === "geo" ? "Location" : "City"}
                </span>
              </p>
            ) : (
              <div className="mt-0.5">
                <DestinationCombobox
                  compact
                  selected={null}
                  onSelect={selectOriginCity}
                  placeholder="Search a starting city"
                  ariaLabel="Starting city"
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {origin && (
              <button
                type="button"
                onClick={() => {
                  setOrigin(null);
                  setGeoStatus("idle");
                }}
                className="rounded px-1.5 py-0.5 text-[11.5px] font-semibold text-muted hover:text-ink"
              >
                Change
              </button>
            )}

            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoStatus === "locating"}
              className="flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] font-semibold text-muted transition hover:border-brand hover:text-brand-strong disabled:opacity-60"
            >
              {geoStatus === "locating" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Crosshair className="h-3 w-3" />
              )}
              {geoStatus === "locating" ? "Locating…" : "Use my location"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="ml-auto flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-[13.5px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(14,147,132,0.7)] transition hover:bg-brand-strong"
        >
          <Search className="h-4 w-4" />
          Build my trip
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1">
        <span className="mr-1 text-[12px] font-semibold text-muted">Trip style</span>

        {INTERESTS.map((interest) => {
          const active = interests.includes(interest);

          return (
            <button
              key={interest}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setInterests((current) =>
                  current.includes(interest)
                    ? current.filter((item) => item !== interest)
                    : [...current, interest]
                )
              }
              className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition ${
                active
                  ? "border-brand-100 bg-brand-50 text-brand-strong"
                  : "border-line bg-surface text-body hover:border-brand-100 hover:text-brand-strong"
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-danger-50 px-3 py-2 text-[12px] font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
