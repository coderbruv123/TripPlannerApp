namespace TripApp_Backend.Models;

/// <summary>
/// One category allocation for a saved trip. Rows are keyed by trip + category
/// so an allocation can be added, changed or left untouched independently.
/// </summary>
public class BudgetBreakdown
{
    /// <summary>Owner saved trip FK (server-owned, user-scoped).</summary>
    public Guid SavedTripId { get; set; }

    public SavedTrip SavedTrip { get; set; } = null!;

    /// <summary>One of <see cref="BudgetCategories.Keys"/>.</summary>
    public string Category { get; set; } = string.Empty;

    public decimal Amount { get; set; }
}

/// <summary>The fixed, wire-visible budget categories, in contract order.</summary>
public static class BudgetCategories
{
    public static readonly string[] Keys =
    [
        "Transport", "Stay", "Food", "Activities", "Shopping", "Other"
    ];
}
