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

export async function searchHotels(input: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}): Promise<HotelResult[]> {
  try {
    const response = await api.get<HotelResult[]>("/hotels/search", {
      params: {
        latitude: input.latitude,
        longitude: input.longitude,
        radiusKm: input.radiusKm ?? 10,
        limit: input.limit ?? 6,
      },
      timeout: 15000,
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (isAxiosError(error)) {
      const message = (error.response?.data as { message?: string } | undefined)
        ?.message;

      if (message) throw new Error(message, { cause: error });

      if (!error.response) {
        throw new Error("Couldn't reach the stay service. Try again.", {
          cause: error,
        });
      }
    }

    throw error;
  }
}
