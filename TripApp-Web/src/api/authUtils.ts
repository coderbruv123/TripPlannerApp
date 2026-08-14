
const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const USER_ID_KEY = "userId";
const EMAIL_KEY = "userEmail";
const NAME_KEY = "userName";

export const AUTH_EVENT = "tripapp:auth";

export function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export function isAdmin(): boolean {
  return getRole() === "Admin";
}

export function getUserEmail(): string {
  return localStorage.getItem(EMAIL_KEY) || "";
}

export function getUserName(): string {
  return localStorage.getItem(NAME_KEY) || "User";
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function persistAuth(data: {
  token: string;
  role?: string;
  email?: string;
  username?: string;
  userId?: string;
}): void {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem("isLoggedIn", "true");

  if (data.role) localStorage.setItem(ROLE_KEY, data.role);
  if (data.email) localStorage.setItem(EMAIL_KEY, data.email);
  if (data.username) localStorage.setItem(NAME_KEY, data.username);
  if (data.userId) localStorage.setItem(USER_ID_KEY, data.userId);

  notifyAuthChange();
}

export function clearAuth(): void {
  [
    TOKEN_KEY,
    ROLE_KEY,
    USER_ID_KEY,
    EMAIL_KEY,
    NAME_KEY,
    "isLoggedIn",
  ].forEach((key) => localStorage.removeItem(key));

  notifyAuthChange();
}
