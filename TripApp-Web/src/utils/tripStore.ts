import type { Destination, SavedTrip } from "../types/trip";

const TRIPS_KEY = "tp.savedTrips";
const RECENT_KEY = "tp.recentDestinations";
const MAX_RECENT = 4;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the UI stays usable without it */
  }
}

export function listSavedTrips(): SavedTrip[] {
  return read<SavedTrip[]>(TRIPS_KEY, []).sort((a, b) =>
    a.savedAt < b.savedAt ? 1 : -1
  );
}

export function isTripSaved(id: string): boolean {
  return listSavedTrips().some((trip) => trip.id === id);
}

export function saveTrip(trip: SavedTrip): SavedTrip[] {
  const next = [trip, ...listSavedTrips().filter((item) => item.id !== trip.id)];

  write(TRIPS_KEY, next.slice(0, 12));

  return listSavedTrips();
}

export function removeSavedTrip(id: string): SavedTrip[] {
  const next = listSavedTrips().filter((trip) => trip.id !== id);

  write(TRIPS_KEY, next);

  return next;
}

export function recentDestinations(): Destination[] {
  return read<Destination[]>(RECENT_KEY, []);
}

export function rememberDestination(destination: Destination): void {
  const key = `${destination.name}|${destination.country}`.toLowerCase();

  const next = [
    destination,
    ...recentDestinations().filter(
      (item) => `${item.name}|${item.country}`.toLowerCase() !== key
    ),
  ];

  write(RECENT_KEY, next.slice(0, MAX_RECENT));
}

export function clearSavedTrips(): SavedTrip[] {
  write(TRIPS_KEY, []);

  return [];
}
