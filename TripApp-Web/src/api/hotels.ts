import { isAxiosError } from "axios";

import api from "./axiosInstance";

/** Item returned by GET /api/hotels/search (OSM/Overpass, anonymous). */
export interface HotelResult {
  id: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  stars: number | null;
  website: string | null;
  phone: string | null;
  type: string | null;
  imageUrl: string | null;
  /** Always null today: the provider has no fare data. Never render as $0. */
  estimatedPricePerNight: number | null;
}

export interface HotelSearchResponse {
  hotels: HotelResult[];
  /** Backend may mark cached/fallback results when live Overpass is unavailable. */
  stale?: boolean;
  cached?: boolean;
  source?: string;
  notice?: string;
}

const HOTEL_TIMEOUT_MS = 25000;

function isTimeoutLike(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (error.code === "ECONNABORTED") return true;
  const status = error.response?.status;
  return status === 503 || status === 504;
}

function normalizeHotelSearchResponse(data: unknown): HotelSearchResponse {
  if (Array.isArray(data)) {
    return { hotels: data as HotelResult[] };
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const hotels = Array.isArray(obj.hotels)
      ? (obj.hotels as HotelResult[])
      : Array.isArray(obj.results)
      ? (obj.results as HotelResult[])
      : [];

    return {
      hotels,
      stale: obj.stale === true || obj.cached === true,
      cached: obj.cached === true,
      source: typeof obj.source === "string" ? obj.source : undefined,
      notice: typeof obj.notice === "string" ? obj.notice : undefined,
    };
  }

  return { hotels: [] };
}

export async function searchHotels(input: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}): Promise<HotelSearchResponse> {
  try {
    const response = await api.get<unknown>("/hotels/search", {
      params: {
        latitude: input.latitude,
        longitude: input.longitude,
        radiusKm: input.radiusKm ?? 10,
        limit: input.limit ?? 6,
      },
      timeout: HOTEL_TIMEOUT_MS,
    });

    return normalizeHotelSearchResponse(response.data);
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as { message?: string } | undefined;
      const serverMessage = typeof data?.message === "string" ? data.message : null;

      if (isTimeoutLike(error) || status === 503 || status === 504) {
        throw new Error(
          serverMessage ||
            "Open stay data is temporarily unavailable. Please try again in a moment.",
          { cause: error }
        );
      }

      if (serverMessage) throw new Error(serverMessage, { cause: error });

      if (!error.response) {
        throw new Error("Couldn't reach the stay service. Try again.", {
          cause: error,
        });
      }
    }

    throw error;
  }
}
