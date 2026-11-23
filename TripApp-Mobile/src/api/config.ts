const DEV_API_BASE_URL = 'https://a9cf76bb8014c4.app.lhr.life/api';

// EXPO_PUBLIC_* vars are baked in at Expo start time.
// If you change .env or this value, restart Expo with cache clear: npx expo start -c
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEV_API_BASE_URL;
