import { api } from './client';

interface SavedTripEntity {
  id: string;
  userId?: string;
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
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  interests: string[];
  createdAt?: string;
  updatedAt?: string;
}

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
  originLabel?: string;
  destinationName?: string;
  destinationCountry?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  interests?: string[];
}

function toIso(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString();
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (match) {
    return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])).toISOString();
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
    originLabel: entity.originLabel,
    destinationName: entity.destinationName,
    destinationCountry: entity.destinationCountry,
    originLat: entity.originLat,
    originLng: entity.originLng,
    destinationLat: entity.destinationLat,
    destinationLng: entity.destinationLng,
    interests: entity.interests,
  };
}

export async function fetchSavedTrips(): Promise<SavedTrip[]> {
  const response = await api.get<SavedTripEntity[]>('/trips/saved');
  return (response.data ?? []).map(toFrontend);
}

export async function fetchSavedTrip(id: string): Promise<SavedTrip | null> {
  const response = await api.get<SavedTripEntity>(`/trips/saved/${id}`);
  return response.data ? toFrontend(response.data) : null;
}

export async function saveTrip(input: {
  title: string;
  country: string;
  from?: string;
  to?: string;
  travelers: number;
  budget?: string;
  url: string;
  originLabel?: string;
  destinationName?: string;
  destinationCountry?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  interests?: string[];
}): Promise<SavedTrip> {
  const response = await api.post<SavedTripEntity>('/trips/saved', {
    title: input.title,
    country: input.country,
    originLabel: input.originLabel ?? input.title,
    destinationName: input.destinationName ?? input.title,
    destinationCountry: input.destinationCountry ?? input.country,
    from: input.from,
    to: input.to,
    travelers: input.travelers,
    budget: input.budget,
    url: input.url,
    originLat: input.originLat,
    originLng: input.originLng,
    destinationLat: input.destinationLat,
    destinationLng: input.destinationLng,
    interests: input.interests ?? [],
  });
  return toFrontend(response.data!);
}

export async function deleteSavedTrip(id: string): Promise<void> {
  await api.delete(`/trips/saved/${id}`);
}

export async function duplicateSavedTrip(id: string): Promise<SavedTrip> {
  const response = await api.post<SavedTripEntity>(`/trips/saved/${id}/duplicate`, {});
  return toFrontend(response.data!);
}
