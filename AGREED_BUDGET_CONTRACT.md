# AGREED budget API contract — TripPlannerApp (frontend TripPlannerApp-Web / backend TripApp-Backend)

Version: 1 — agreed via front/backend sync (tenant: TripPlannerApp).

## Common
- Base URL: http://localhost:5176/api (matches axiosInstance default baseURL).
- Auth: Bearer token on Authorization header (axiosInstance interceptor; 401 => logout).
- Trips are account-scoped: budget calls only touch rows owned by the authenticated account (tripId -> SavedTrip.UserId match), else 404. No cross-user exposure.
- Amounts are JSON numbers (decimals ok). Unset/empty category = 0 on the wire.

## Category keys (fixed)
Transport, Stay, Food, Activities, Shopping, Other

## GET /api/trips/{tripId}/budget
Response shape:
{
  "tripId": "<guid>",
  "categories": {
    "Transport": <number>,
    "Stay": <number>,
    "Food": <number>,
    "Activities": <number>,
    "Shopping": <number>,
    "Other": <number>
  }
}
- All 6 keys always present, both directions.
- totalAllocated is NOT on the wire; the frontend computes it as the sum of the 6 category values.

## POST /api/trips/{tripId}/budget
Request body:
{
  "tripId": "<guid>",
  "categories": {
    "Transport": <number>,   // only categories the caller wants to set
    "Stay": <number>,
    ...
  }
}
- Omitting a category = leave that category unchanged.
- Full set replaces the trip's allocation.
- Response: same shape as GET.

## Storage (backend)
- New table BudgetBreakdown (SavedTripId, Category, Amount) linked to SavedTrip.
- Keep SavedTrip.Budget as the plain total (population as needed).
- SQLite trippplanner.db (EnsureCreated builds the new table); SuperAdmin + roles + Active already seeded.

## Frontend plan (Task #1, TripPlannerApp-Web only)
- Add BudgetBreakdown component + a BUDGET section on TripResults.
- Show total budget vs total allocated; per-category chips/bars.
- Add-entry flow: choose category + amount + save -> POST /api/trips/{tripId}/budget.
- Keep a local fallback until the backend agrees.
