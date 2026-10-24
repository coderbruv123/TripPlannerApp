import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { searchDestinations } from "../../api/destinations";
import { recentDestinations, rememberDestination } from "../../utils/tripStore";
import type { Destination } from "../../types/trip";

type Props = {
  selected: Destination | null;
  onSelect: (destination: Destination | null) => void;
  placeholder?: string;
  inputId?: string;
  ariaLabel?: string;
  compact?: boolean;
};

type Anchor = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

const ADMIN_NAME =
  /(arrondissement|municipality|regional unit|prefecture|county|province|oblast|department|commune|borough|district|parish|partido|comuna|township|canton|voivodeship|governorate|okrug|raion|regency|subdistrict|region)/i;

const GAP = 10;
const EDGE = 12;
const MAX_LIST_HEIGHT = 340;

function rank(results: Destination[], query: string): Destination[] {
  const needle = query.trim().toLowerCase();
  const seen = new Set<string>();

  const ranked = results
    .filter((item) => {
      const key = `${item.name}|${item.country}`.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);

      return true;
    })
    .sort((a, b) => {
      const aExact = a.name.toLowerCase() === needle ? 0 : 1;
      const bExact = b.name.toLowerCase() === needle ? 0 : 1;

      if (aExact !== bExact) return aExact - bExact;

      return a.name.length - b.name.length;
    });

  const cities = ranked.filter((item) => !ADMIN_NAME.test(item.name));

  return (cities.length > 0 ? cities : ranked).slice(0, 6);
}

export default function DestinationCombobox({
  selected,
  onSelect,
  placeholder = "Search a city",
  inputId,
  ariaLabel,
  compact = false,
}: Props) {
  const fallbackId = useId();
  const id = inputId ?? fallbackId;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected ? selected.name : "");
  const [results, setResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState<Destination[]>([]);

  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* Monotonic id of the newest search: stale answers are dropped and only the
     newest one is allowed to clear the loading state. */
  const requestRef = useRef(0);

  /* The list renders in a portal pinned to the input's box, so panels with
     overflow-hidden / overflow-y-auto (the planner grid, the itinerary
     scroller) can no longer clip it. */
  const measure = useCallback(() => {
    const node = wrapRef.current;

    if (!node) return;

    const rect = node.getBoundingClientRect();
    const width = Math.min(
      Math.max(rect.width, 300),
      380,
      window.innerWidth - EDGE * 2
    );

    const left = Math.min(
      Math.max(EDGE, rect.left),
      Math.max(EDGE, window.innerWidth - width - EDGE)
    );

    const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE;
    const spaceAbove = rect.top - GAP - EDGE;

    const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const available = Math.max(140, placeAbove ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(MAX_LIST_HEIGHT, available);

    setAnchor(
      placeAbove
        ? {
            // Anchor to the input's top edge, so a short list still hugs it.
            bottom: window.innerHeight - rect.top + GAP,
            left,
            width,
            maxHeight,
          }
        : { top: rect.bottom + GAP, left, width, maxHeight }
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }

    measure();

    const onReflow = (event: Event) => {
      // Scrolling inside the list itself shouldn't move it.
      if (event.target instanceof Node && listRef.current?.contains(event.target)) {
        return;
      }

      measure();
    };

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onReflow, true);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (wrapRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;

      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setRecent(recentDestinations());
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    const requestId = ++requestRef.current;

    if (!selected && trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    if (selected && trimmed === selected.name) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await searchDestinations(trimmed, controller.signal);

        // A newer query owns the list now — drop this answer.
        if (requestRef.current !== requestId) return;

        setResults(rank(data, trimmed));
        setCursor(0);
      } catch (err) {
        if (controller.signal.aborted || requestRef.current !== requestId) return;

        console.error(err);

        setError(
          err instanceof Error && err.message
            ? err.message
            : "Couldn't reach the destination service. Try again."
        );
        setResults([]);
      } finally {
        // Only the newest request may clear the spinner, so a superseded
        // request can't leave "Searching cities…" on screen forever.
        if (requestRef.current === requestId) setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, selected]);

  const pick = (destination: Destination) => {
    onSelect(destination);
    setQuery(destination.name);
    setOpen(false);
    setLoading(false);
    rememberDestination(destination);
  };

  const clear = () => {
    onSelect(null);
    setQuery("");
    setResults([]);
    setLoading(false);
    setOpen(true);
    inputRef.current?.focus();
  };

  const visible = query.trim().length < 2 && !selected ? recent : results;
  const showRecent = query.trim().length < 2 && !selected && recent.length > 0;
  const showList = open && (query.trim().length >= 2 || showRecent || loading);

  return (
    <div className="relative min-w-0" ref={wrapRef}>
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />

        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-label={ariaLabel ?? "Destination"}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          className={
            compact
              ? "w-full min-w-0 bg-transparent text-[13px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-faint"
              : "w-full min-w-0 bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-faint"
          }
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            if (selected) onSelect(null);
            if (event.target.value.trim().length < 2) setLoading(false);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }

            if (!open) setOpen(true);

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setCursor((value) =>
                Math.min(value + 1, Math.max(visible.length - 1, 0))
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setCursor((value) => Math.max(0, value - 1));
            }

            if (event.key === "Enter" && visible[cursor]) {
              event.preventDefault();
              pick(visible[cursor]);
            }
          }}
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear destination"
            className="rounded-full p-1 text-faint transition hover:bg-line-soft hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showList &&
        anchor &&
        createPortal(
          <div
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            style={{
              position: "fixed",
              top: anchor.top,
              bottom: anchor.bottom,
              left: anchor.left,
              width: anchor.width,
              maxHeight: anchor.maxHeight,
            }}
            className="thin-scroll z-[1000] overflow-y-auto overflow-x-hidden rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-float)]"
          >
            <div className="flex items-center justify-between px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
              <span>{showRecent ? "Recent" : "Destinations"}</span>
              <span>Cities only</span>
            </div>

            {loading && (
              <p className="flex items-center gap-2 px-2 py-2.5 text-[12.5px] text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching cities…
              </p>
            )}

            {!loading &&
              visible.map((destination, index) => (
                <button
                  key={`${destination.name}-${destination.country}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === cursor}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => pick(destination)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${
                    index === cursor ? "bg-brand-50" : "hover:bg-line-soft"
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-100 to-brand text-[10px] font-extrabold text-white">
                    {destination.name.slice(0, 2).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {destination.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {destination.country}
                    </span>
                  </span>

                  <MapPin className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                </button>
              ))}

            {!loading && !error && visible.length === 0 && (
              <p className="px-2 py-2.5 text-[12.5px] text-muted">
                No cities matched. Try the nearest larger town.
              </p>
            )}

            {error && <p className="px-2 py-2.5 text-[12.5px] text-danger">{error}</p>}
          </div>,
          document.body
        )}
    </div>
  );
}
