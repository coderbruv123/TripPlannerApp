import { isAxiosError } from 'axios';
import { api } from './client';
import type { Destination } from '../types/trip';

export async function searchDestinations(query: string, signal?: AbortSignal): Promise<Destination[]> {
  try {
    const response = await api.get<Destination[]>('/Destinations', {
      params: { search: query },
      signal,
      timeout: 12000,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (isAxiosError(error)) {
      const message = (error.response?.data as { message?: string } | undefined)?.message;
      if (message) throw new Error(message, { cause: error });
      if (error.code === 'ECONNABORTED') throw new Error('The city service is slow to answer. Try again.', { cause: error });
      if (!error.response) throw new Error("Couldn't reach the city service. Check your connection.", { cause: error });
    }
    throw error;
  }
}
