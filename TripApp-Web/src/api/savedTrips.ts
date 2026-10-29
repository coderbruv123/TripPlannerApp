import api from "./axiosInstance";

// Backend entity shape (as returned by /api/trips/saved). Kept internal so the
// store and components only ever see the trimmed frontend shape.
interface SavedTripEntity {
  id: string;
  userId: string;
  title: string;
  country: string;
  originLabel: string;
  destinationName: string;
  destinationCountry: string;
  from?: string;
  to?: string;
  travelers: number;
  budget?: string;
  url: string;
  interests: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Frontend shape (matches the SavedTrip type in types/trip.ts).
export interface SavedTrip {
  id: string;
  title: string;
  country: string;
  from?: string;
  to?: string;
  travelers: number;
  budget?: string;
  url: string;
  savedAt: string;
}

function toIso(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString();

  // SQLite DATETIME ("YYYY-MM-DD HH:MM:SS.ffffff") is not a valid ISO string.
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (match) {
    return new Date(
      Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])
    ).toISOString();
  }
  return value;
}

function toFrontend(entity: SavedTripEntity): SavedTrip {
  return {
    id: entity.id,
    title: entity.title,
    country: entity.country,
    from: entity.from,
    to: entity.to,
    travelers: entity.travelers,
    budget: entity.budget,
    url: entity.url,
    savedAt: toIso(entity.createdAt),
  };
}

export async function fetchSavedTripsList(): Promise<SavedTrip[]> {
  const response = await api.get<SavedTripEntity[]>("/trips/saved");
  return (response.data ?? []).map(toFrontend);
}

export async function fetchSavedTrip(id: string): Promise<SavedTrip | null> {
  const response = await api.get<SavedTripEntity>(`/trips/saved/${id}`);
  return response.data ? toFrontend(response.data) : null;
}

export async function saveTripToAccount(input: {
  title: string;
  country: string;
  from?: string;
  to?: string;
  travelers: number;
  budget?: string;
  url: string;
  interests?: string[];
}): Promise<SavedTrip> {
  const entity = {
    title: input.title,
    country: input.country,
    originLabel: input.title,
    destinationName: input.title,
    destinationCountry: input.country,
    from: input.from,
    to: input.to,
    travelers: input.travelers,
    budget: input.budget,
    url: input.url,
    interests: input.interests ?? [],
  };

  const response = await api.post<SavedTripEntity>("/trips/saved", entity);
  return toFrontend(response.data!);
}

export async function updateSavedTripOnAccount(
  id: string,
  input: Partial<
    Omit<SavedTripEntity, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<SavedTrip> {
  const response = await api.put<SavedTripEntity>(`/trips/saved/${id}`, input);
  return toFrontend(response.data!);
}

export async function deleteSavedTripOnAccount(id: string): Promise<void> {
  await api.delete(`/trips/saved/${id}`);
}

export async function duplicateSavedTripOnAccount(
  id: string,
  input?: { from?: string; to?: string; travelers?: number; budget?: string }
): Promise<SavedTrip> {
  const response = await api.post<SavedTripEntity>(
    `/trips/saved/${id}/duplicate`,
    input ?? {}
  );
  return toFrontend(response.data!);
}

export async function clearAllSavedTripsOnAccount(): Promise<void> {
  await api.delete("/trips/saved");
}
