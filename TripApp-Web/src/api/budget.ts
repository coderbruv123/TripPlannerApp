import api from "./axiosInstance";
import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
  type TripBudget,
} from "../types/trip";

/** All six fixed category keys, always present. Unset categories are 0. */
export type BudgetCategories = Record<BudgetCategory, number>;

export function emptyBudgetCategories(): BudgetCategories {
  return {
    Transport: 0,
    Stay: 0,
    Food: 0,
    Activities: 0,
    Shopping: 0,
    Other: 0,
  };
}

function amountOf(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/**
 * Keep the wire shape strict: exactly the six agreed keys, always present,
 * with unset/invalid values normalised to 0 in both directions.
 */
export function normalizeCategories(value: unknown): BudgetCategories {
  const source = (value ?? {}) as Record<string, unknown>;
  const categories = emptyBudgetCategories();

  for (const category of BUDGET_CATEGORIES) {
    categories[category] = amountOf(source[category]);
  }

  return categories;
}

function normalizeBudget(value: unknown, tripId: string): TripBudget {
  const source = (value ?? {}) as Record<string, unknown>;

  return {
    tripId:
      typeof source.tripId === "string" && source.tripId
        ? source.tripId
        : tripId,
    categories: normalizeCategories(source.categories),
  };
}

/** Derived locally from the six values — never sent to the API. */
export function totalAllocated(categories: BudgetCategories): number {
  return BUDGET_CATEGORIES.reduce(
    (sum, category) => sum + categories[category],
    0
  );
}

/** GET /api/trips/{tripId}/budget */
export async function fetchBudget(tripId: string): Promise<TripBudget> {
  const response = await api.get<TripBudget>(
    `/trips/${encodeURIComponent(tripId)}/budget`
  );
  return normalizeBudget(response.data, tripId);
}

/**
 * POST /api/trips/{tripId}/budget
 * Sends all six keys so "unset" stays an explicit 0 and untouched categories
 * keep their current values (full-set replace).
 */
export async function saveBudget(
  tripId: string,
  categories: BudgetCategories
): Promise<TripBudget> {
  const response = await api.post<TripBudget>(
    `/trips/${encodeURIComponent(tripId)}/budget`,
    { tripId, categories: normalizeCategories(categories) }
  );
  return normalizeBudget(response.data, tripId);
}
