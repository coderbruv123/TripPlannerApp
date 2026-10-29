import {
  clearAllSavedTripsOnAccount,
  deleteSavedTripOnAccount,
  duplicateSavedTripOnAccount,
  fetchSavedTrip,
  fetchSavedTripsList,
  saveTripToAccount,
} from "../api/savedTrips";
import {
  fetchItineraryStops,
  fetchDayStops,
  deleteItineraryStop,
  addItineraryStop,
  upsertItineraryStop,
  reorderItineraryStops,
  clearItineraryStops,
} from "../api/itinerary";
import { getToken } from "../api/authUtils";
import type { Destination, SavedTrip } from "../types/trip";
import type { ItineraryStop } from "../types/trip";

// Reactive store for saved trips.
type SavedTripChangeListener = () => void;
const _savedTripListeners = new Set<SavedTripChangeListener>();

export function subscribeSavedTripsChanged(
  listener: SavedTripChangeListener
): () => void {
  _savedTripListeners.add(listener);
  return () => _savedTripListeners.delete(listener);
}

function notifySavedTripsChanged(): void {
  _savedTripListeners.forEach((listener) => listener());
}

const TRIPS_KEY = "tp.savedTrips";
const RECENT_KEY = "tp.recentDestinations";
const MAX_RECENT = 4;

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked — the UI stays usable without it.
  }
}

let cachedTrips: SavedTrip[] = [];
let isLoaded = false;

function isAuthed(): boolean {
  return Boolean(getToken());
}

async function refresh(): Promise<void> {
  cachedTrips = isAuthed()
    ? await fetchSavedTripsList()
    : readFromStorage(TRIPS_KEY, [] as SavedTrip[]);
  isLoaded = true;
}

/** Load trips from the account (when signed in) or localStorage (guest). */
export async function loadSavedTrips(): Promise<SavedTrip[]> {
  if (isLoaded) return cachedTrips;
  await refresh();
  return cachedTrips;
}

/** Save the given trip. Writes to the account when signed in, else localStorage. */
export async function saveTrip(trip: SavedTrip): Promise<SavedTrip[]> {
  let saved: SavedTrip;

  if (isAuthed()) {
    saved = await saveTripToAccount({
      title: trip.title,
      country: trip.country,
      from: trip.from,
      to: trip.to,
      travelers: trip.travelers,
      budget: trip.budget,
      url: trip.url,
      interests: [], // interests live in plan.state, not the saved row
    });
    cachedTrips = [saved, ...cachedTrips.filter((t) => t.id !== saved.id)];
  } else {
    saved = {
      ...trip,
      id: trip.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    cachedTrips = [saved, ...cachedTrips.filter((t) => t.id !== saved.id)];
    writeToStorage(TRIPS_KEY, cachedTrips);
  }

  notifySavedTripsChanged();
  return cachedTrips;
}

/** Remove one trip. Writes to the account when signed in, else localStorage. */
export async function removeSavedTrip(id: string): Promise<SavedTrip[]> {
  cachedTrips = cachedTrips.filter((t) => t.id !== id);
  notifySavedTripsChanged();

  if (isAuthed()) {
    await deleteSavedTripOnAccount(id);
  } else {
    writeToStorage(TRIPS_KEY, cachedTrips);
  }

  return cachedTrips;
}

/** Remove every saved trip. Writes to the account when signed in. */
export async function clearAllSavedTrips(): Promise<SavedTrip[]> {
  cachedTrips = [];
  notifySavedTripsChanged();

  if (isAuthed()) {
    await clearAllSavedTripsOnAccount();
  } else {
    writeToStorage(TRIPS_KEY, []);
  }

  return cachedTrips;
}

/** Duplicate a trip to a new row. */
export async function duplicateSavedTrip(
  id: string,
  payload?: { from?: string; to?: string; travelers?: number; budget?: string }
): Promise<SavedTrip> {
  const copy = await duplicateSavedTripOnAccount(id, payload);
  cachedTrips = [copy, ...cachedTrips.filter((t) => t.id !== copy.id)];
  return copy;
}

/** Look up a single trip by id. */
export async function getSavedTrip(id: string): Promise<SavedTrip | null> {
  return fetchSavedTrip(id);
}

// ---- synchronous convenience (for components that read our list) ----

/** Return the current trip list from local memory. */
export function listSavedTrips(): SavedTrip[] {
  return cachedTrips;
}

/**
 * Check whether a trip belongs to this user.
 * A saved trip carries its URL, so we recognise the current page by that URL
 * and the "Saved" badge stays truthful across reloads.
 */
export function isSavedTrip(url: string): boolean {
  return cachedTrips.some((t) => t.url === url);
}

// ---- guest/localStorage-only helpers (destination picker + sync) ----

export function recentDestinations(): Destination[] {
  return readFromStorage<Destination[]>(RECENT_KEY, []);
}

export function rememberDestination(destination: Destination): void {
  const key = `${destination.name}|${destination.country}`.toLowerCase();

  const next = [
    destination,
    ...recentDestinations().filter(
      (item) => `${item.name}|${item.country}`.toLowerCase() !== key
    ),
  ];

  writeToStorage(RECENT_KEY, next.slice(0, MAX_RECENT));
}

export function clearSavedTrips(): SavedTrip[] {
  cachedTrips = [];
  notifySavedTripsChanged();
  writeToStorage(TRIPS_KEY, []);
  return [];
}

// ---- itinerary reactive store ----

type ItineraryChangeListener = (tripId: string) => void;
const _itineraryListeners = new Map<string, Set<ItineraryChangeListener>>();

export function subscribeItineraryChanged(
  tripId: string,
  listener: ItineraryChangeListener
): () => void {
  if (!_itineraryListeners.has(tripId)) {
    _itineraryListeners.set(tripId, new Set());
  }
  _itineraryListeners.get(tripId)!.add(listener);
  return () => _itineraryListeners.get(tripId)!.delete(listener);
}

function notifyItineraryChanged(tripId: string): void {
  const listeners = _itineraryListeners.get(tripId);
  if (listeners) {
    listeners.forEach((listener) => listener(tripId));
  }
}

export async function loadItineraryStops(tripId: string): Promise<ItineraryStop[]> {
  return fetchItineraryStops(tripId);
}

export async function loadDayStops(tripId: string, dayIndex: number): Promise<ItineraryStop[]> {
  return fetchDayStops(tripId, dayIndex);
}

export async function addStopToTrip(
  tripId: string,
  stop: Omit<ItineraryStop, "id">
): Promise<ItineraryStop> {
  return addItineraryStop(tripId, stop);
}

export async function upsertStopInTrip(
  tripId: string,
  stop: ItineraryStop
): Promise<ItineraryStop> {
  return upsertItineraryStop(tripId, stop.id, {
    dayIndex: stop.dayIndex,
    order: stop.order,
    name: stop.name,
    country: stop.country,
    latitude: stop.latitude,
    longitude: stop.longitude,
    kind: stop.kind,
    plannedStart: stop.plannedStart ?? "",
    plannedEnd: stop.plannedEnd ?? "",
    openingHours: stop.openingHours ?? "",
    notes: stop.notes ?? "",
  });
}

export async function deleteStopFromTrip(tripId: string, stopId: string): Promise<void> {
  await deleteItineraryStop(tripId, stopId);
  notifyItineraryChanged(tripId);
}

export async function reorderStopsInTrip(tripId: string, orderedIds: string[]): Promise<void> {
  await reorderItineraryStops(tripId, orderedIds);
  notifyItineraryChanged(tripId);
}

export async function clearStopsInTrip(tripId: string): Promise<void> {
  await clearItineraryStops(tripId);
  notifyItineraryChanged(tripId);
}
