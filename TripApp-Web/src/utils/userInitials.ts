/**
 * Derives up to two initials from a display name.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  const first = parts[0]?.charAt(0) ?? "";
  const second =
    parts.length > 1 ? parts[1]?.charAt(0) ?? "" : "";

  return `${first}${second}`.toUpperCase() || "U";
}
