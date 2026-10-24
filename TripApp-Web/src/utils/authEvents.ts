/**
 * The axios interceptor lives outside React, so it can't call navigate().
 * It clears the session and raises this event instead; a router-aware
 * listener in App.tsx does the redirect, so we never reload the whole app.
 */
export const LOGOUT_EVENT = "tripplanner:logout";

export function emitLogout(): void {
  window.dispatchEvent(new Event(LOGOUT_EVENT));
}
