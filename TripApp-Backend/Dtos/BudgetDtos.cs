namespace TripApp_Backend.Dtos;

/// <summary>
/// Wire shape for GET and POST /api/trips/{tripId}/budget. All six fixed
/// categories are always present; an unset category is serialized as 0.
/// </summary>
public class BudgetResponseDto
{
    public Guid TripId { get; set; }

    public Dictionary<string, decimal> Categories { get; set; } =
        new(StringComparer.Ordinal);

    public BudgetResponseDto()
    {
        foreach (var key in Models.BudgetCategories.Keys)
            Categories[key] = 0m;
    }
}

/// <summary>
/// Inbound budget payload. Only the supplied categories are changed; omitted
/// ones keep their current value. tripId in the body is optional but, when
/// supplied, must match the route tripId.
/// </summary>
public class BudgetUpdateDto
{
    public Guid TripId { get; set; }

    public Dictionary<string, decimal>? Categories { get; set; }
}
