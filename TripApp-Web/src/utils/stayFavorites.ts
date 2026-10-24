/* Stay favourites live in localStorage so the heart survives a reload
   without needing an account-level wishlist endpoint. */

const FAVORITES_KEY = "tp.favoriteStays";

export function listFavoriteStays(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isStayFavorite(id: string): boolean {
  return listFavoriteStays().includes(id);
}

export function toggleStayFavorite(id: string): string[] {
  const current = listFavoriteStays();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — keep the in-memory result for this render */
  }

  return next;
}
