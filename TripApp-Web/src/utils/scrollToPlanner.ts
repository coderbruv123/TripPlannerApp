/**
 * Scrolls the trip planner (the destination search on the home page)
 * into view and focuses its input.
 */
export function scrollToPlanner() {
  if (typeof document === "undefined") {
    return;
  }

  const target =
    document.getElementById("trip-planner-destination");

  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth" });

  target.focus();
}
