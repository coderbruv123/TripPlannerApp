import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { setUnauthorizedHandler } from '../api/client';
import * as authApi from '../api/auth';
import { clearAuth, getRefreshToken, getStoredUser, persistAuth, type StoredUser } from './storage';

type AuthContextValue = {
  user: StoredUser | null;
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: string; errorCode?: string } } }).response;
    const message = maybeResponse?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authApi.revokeRefreshToken(refreshToken);
    }
    await clearAuth();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    const nextUser = authApi.toStoredUser(me);
    setUser(nextUser);
    // Keep stored user fresh; tokens remain unchanged.
    const token = (await import('./storage')).getToken;
    const refresh = (await import('./storage')).getRefreshToken;
    const [t, r] = await Promise.all([token(), refresh()]);
    if (t) {
      await persistAuth({ token: t, refreshToken: r ?? undefined, user: nextUser });
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearAuth();
      setUser(null);
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storedUser = await getStoredUser();
        const refreshToken = await getRefreshToken();
        if (!storedUser || !refreshToken) {
          await clearAuth();
          if (!cancelled) setUser(null);
          return;
        }
        if (!cancelled) setUser(storedUser);
        try {
          const me = await authApi.getMe();
          if (!cancelled) {
            const nextUser = authApi.toStoredUser(me);
            setUser(nextUser);
            const { getToken } = await import('./storage');
            const t = await getToken();
            if (t) await persistAuth({ token: t, refreshToken, user: nextUser });
          }
        } catch {
          // If /me fails with non-auth issues, keep stored session; 401 handler clears on auth failure.
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await authApi.login({ email: email.trim(), password });
      if (!result.success || !result.data?.token) {
        throw new Error(result.message || 'Unable to sign in.');
      }
      const nextUser = authApi.toStoredUser(result.data);
      await persistAuth({ token: result.data.token, refreshToken: result.data.refreshToken, user: nextUser });
      setUser(nextUser);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to sign in. Please check your credentials.'));
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      const result = await authApi.register({ username: username.trim(), email: email.trim(), password });
      if (!result.success || !result.data?.token) {
        throw new Error(result.message || 'Unable to create account.');
      }
      const nextUser = authApi.toStoredUser(result.data);
      await persistAuth({ token: result.data.token, refreshToken: result.data.refreshToken, user: nextUser });
      setUser(nextUser);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to create account. Please try again.'));
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoggedIn: !!user,
    isBootstrapping,
    login,
    register,
    logout,
    refreshUser,
  }), [user, isBootstrapping, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
