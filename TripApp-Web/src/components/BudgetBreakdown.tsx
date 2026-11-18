import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Plus, Wallet } from "lucide-react";

import {
  emptyBudgetCategories,
  fetchBudget,
  saveBudget,
  totalAllocated,
  type BudgetCategories,
} from "../api/budget";
import { BUDGET_CATEGORIES, type BudgetCategory } from "../types/trip";

type BudgetBreakdownProps = {
  /** Account trip id (GUID). null until an authenticated trip is saved. */
  tripId: string | null;
  /** The trip's plain total budget, used only for the local comparison. */
  totalBudget?: string | number | null;
  /** Travelers on the trip, for the total/per-person view toggle. */
  travelers?: number;
  onSaved?: (message: string) => void;
};

function money(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function BudgetBreakdown({
  tripId,
  totalBudget,
  travelers = 1,
  onSaved,
}: BudgetBreakdownProps) {
  const [categories, setCategories] = useState<BudgetCategories>(
    emptyBudgetCategories
  );
  const [loadedTripId, setLoadedTripId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<BudgetCategory>("Transport");
  const [amount, setAmount] = useState("");
  const [perPerson, setPerPerson] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    let cancelled = false;

    fetchBudget(tripId)
      .then((budget) => {
        if (cancelled) return;
        setCategories(budget.categories);
        setLoadedTripId(tripId);
        setLoadFailed(false);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        // Never treat a failed GET as loaded: clear values so a stale full-set
        // POST can't overwrite this trip's allocation.
        setCategories(emptyBudgetCategories());
        setLoadedTripId(null);
        setLoadFailed(true);
        setError("Couldn't load the saved breakdown. Try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [tripId, reloadKey]);

  // Editing is only safe after a successful GET for this exact trip.
  const ready = Boolean(tripId) && tripId === loadedTripId && !loadFailed;
  const loading = Boolean(tripId) && !ready && !loadFailed;
  const visibleCategories = ready ? categories : emptyBudgetCategories();
  const allocated = totalAllocated(visibleCategories);
  const parsedTotal = Number(totalBudget);
  const budget =
    Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;
  const remaining = budget !== null ? budget - allocated : null;
  const usedPercent =
    budget !== null && budget > 0
      ? Math.min(100, Math.round((allocated / budget) * 100))
      : 0;
  const nearLimit = budget !== null && usedPercent >= 90 && (remaining ?? 0) >= 0;

  // View-only math: amounts on the wire are always whole-trip amounts.
  const people = Math.max(1, Math.round(travelers || 1));
  const divisor = perPerson ? people : 1;
  const shownBudget = budget !== null ? budget / divisor : null;
  const shownAllocated = allocated / divisor;
  const shownRemaining = remaining !== null ? remaining / divisor : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tripId || !ready) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // All six keys are sent; repeated entries in a category add up.
      const next: BudgetCategories = {
        ...visibleCategories,
        [category]: visibleCategories[category] + value,
      };
      const saved = await saveBudget(tripId, next);

      setCategories(saved.categories);
      setAmount("");
      onSaved?.(`Added ${money(value)} to ${category}`);
    } catch {
      setError("Couldn't save this entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[18px] border border-line bg-surface px-4 py-4">
      {/* total budget vs locally computed total allocated */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-faint">
          Allocation
        </span>

        {people > 1 && (
          <div
            role="group"
            aria-label="Budget view"
            className="inline-flex rounded-lg border border-line bg-canvas p-0.5"
          >
            {[
              { label: "Total", value: false },
              { label: "Per person", value: true },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={perPerson === option.value}
                onClick={() => setPerPerson(option.value)}
                className={`rounded-md px-2 py-1 text-[10.5px] font-bold transition ${
                  perPerson === option.value
                    ? "bg-brand text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-faint">
            {perPerson ? "Budget per person" : "Total budget"}
          </p>
          <p className="mt-0.5 text-[20px] font-extrabold tracking-[-0.02em] text-ink">
            {shownBudget !== null ? money(shownBudget) : "—"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-faint">
            {perPerson ? "Allocated per person" : "Total allocated"}
          </p>
          <p
            className={`mt-0.5 text-[20px] font-extrabold tracking-[-0.02em] ${
              remaining !== null && remaining < 0
                ? "text-danger"
                : nearLimit
                ? "text-[#F79009]"
                : "text-brand-strong"
            }`}
          >
            {money(shownAllocated)}
          </p>
        </div>
      </div>

      {loading && (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading saved breakdown…
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-danger"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoadFailed(false);
              setReloadKey((value) => value + 1);
            }}
            className="font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {budget !== null && (
        <div className="mt-3">
          <div
            role="progressbar"
            aria-label="Budget allocated"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usedPercent}
            className="h-2 overflow-hidden rounded-full bg-line-soft"
          >
            <div
              className={`h-full rounded-full ${
                remaining !== null && remaining < 0
                  ? "bg-danger"
                  : nearLimit
                  ? "bg-[#F79009]"
                  : "bg-brand"
              }`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>

          <p className="mt-1.5 text-[11px] text-muted">
            {remaining !== null && remaining < 0
              ? `${money(Math.abs(shownRemaining ?? 0))} over budget`
              : nearLimit
              ? `${money(shownRemaining ?? 0)} left · near limit`
              : `${money(shownRemaining ?? 0)} left to allocate`}
            {" · "}
            {usedPercent}% of total budget
          </p>
        </div>
      )}

      {/* per-category chips + bars — exactly the six agreed keys */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BUDGET_CATEGORIES.map((item) => {
          const value = (visibleCategories[item] ?? 0) / divisor;
          const share = allocated > 0 ? (visibleCategories[item] / allocated) * 100 : 0;

          const selected = category === item;

          return (
            <button
              key={item}
              type="button"
              disabled={!ready || saving}
              aria-pressed={selected}
              aria-label={`${item}: ${money(value)}. Select for next entry`}
              onClick={() => setCategory(item)}
              className={`rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60 ${
                selected
                  ? "border-brand bg-brand-50"
                  : "border-line bg-canvas hover:border-brand-100"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10.5px] font-bold text-muted">
                  {item}
                </span>
                <span className="text-[12px] font-bold text-ink">
                  {money(value)}
                </span>
              </span>

              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line-soft">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${share}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* add-entry flow */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-wrap items-end gap-2 border-t border-line-soft pt-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-faint">
            Category
          </span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as BudgetCategory)
            }
            disabled={!ready || saving}
            className="h-9 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] font-semibold text-ink outline-none transition focus:border-brand disabled:opacity-60"
          >
            {BUDGET_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-faint">
            Amount
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={!ready || saving}
            className="h-9 w-32 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] font-semibold text-ink outline-none transition focus:border-brand disabled:opacity-60"
          />
        </label>

        <button
          type="submit"
          disabled={!ready || saving || !amount}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-[12.5px] font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving…" : "Add entry"}
        </button>
      </form>

      {!tripId ? (
        <p className="mt-2 text-[11px] text-faint">
          Save this trip to your account to store its budget breakdown.
        </p>
      ) : !ready ? (
        <p className="mt-2 text-[11px] text-faint">
          Add entry unlocks once the saved breakdown loads successfully.
        </p>
      ) : (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-faint">
          <Wallet className="h-3 w-3 shrink-0" />
          Entries in the same category add together. Amounts are stored per
          category; the total allocated is calculated here, not sent.
        </p>
      )}
    </div>
  );
}
