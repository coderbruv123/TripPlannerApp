import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'tp_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';
const USER_KEY = 'tp_user';

export type StoredUser = {
  userId: string;
  username: string;
  email: string;
  role: string;
  nickname?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  location?: string | null;
};

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function persistAuth(data: {
  token: string;
  refreshToken?: string;
  user: StoredUser;
}): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  if (data.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
}

export async function persistTokens(token: string, refreshToken?: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
