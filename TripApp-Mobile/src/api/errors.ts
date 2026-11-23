import { isAxiosError } from 'axios';

const SERVICE_UNAVAILABLE_MESSAGE =
  'Trip service is temporarily unavailable. Please try again in a moment.';

const NETWORK_MESSAGE = 'Could not reach the trip service. Check your connection and try again.';
const TIMEOUT_MESSAGE = 'The trip service took too long to respond. Please try again.';

export function isTransientServiceError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (!error.response) {
    return error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
  }
  return [502, 503, 504].includes(error.response.status);
}

export function toTripSearchError(error: unknown): Error {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status && [502, 503, 504].includes(status)) {
      return new Error(SERVICE_UNAVAILABLE_MESSAGE, { cause: error });
    }
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return new Error(TIMEOUT_MESSAGE, { cause: error });
      }
      return new Error(NETWORK_MESSAGE, { cause: error });
    }
    const message = (error.response.data as { message?: string } | undefined)?.message;
    if (message) return new Error(message, { cause: error });
  }
  if (error instanceof Error) return error;
  return new Error('Could not load trip results. Please try again.');
}
