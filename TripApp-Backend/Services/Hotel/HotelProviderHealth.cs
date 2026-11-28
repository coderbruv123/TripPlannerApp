using System.Collections.Concurrent;

namespace TripApp_Backend.Services;

public sealed class HotelProviderHealthRegistry
{
    private readonly ConcurrentDictionary<string, ProviderHealthState> _states = new(StringComparer.OrdinalIgnoreCase);

    public ProviderHealthState GetOrCreate(string provider) =>
        _states.GetOrAdd(provider, _ => new ProviderHealthState(provider));

    public IReadOnlyCollection<ProviderHealthSnapshot> Snapshot() =>
        _states.Values.Select(s => s.Snapshot()).OrderBy(s => s.Provider).ToArray();

    public bool IsOpen(string provider) => GetOrCreate(provider).IsOpen(DateTime.UtcNow);

    public void ReportSuccess(string provider, double latencyMs) =>
        GetOrCreate(provider).ReportSuccess(latencyMs);

    public void ReportFailure(string provider, double latencyMs, string? reason) =>
        GetOrCreate(provider).ReportFailure(latencyMs, reason);
}

public sealed class ProviderHealthState
{
    private readonly object _lock = new();
    private readonly string _provider;
    private int _consecutiveFailures;
    private DateTime _openUntilUtc;
    private DateTime? _lastSuccessUtc;
    private DateTime? _lastFailureUtc;
    private double _lastLatencyMs;
    private long _successCount;
    private long _failureCount;
    private string? _lastFailureReason;

    // Circuit breaker: open after 3 consecutive failures, cooldown 60s.
    private const int FailureThreshold = 3;
    private static readonly TimeSpan Cooldown = TimeSpan.FromSeconds(60);

    public ProviderHealthState(string provider)
    {
        _provider = provider;
    }

    public bool IsOpen(DateTime nowUtc)
    {
        lock (_lock)
        {
            return _openUntilUtc > nowUtc;
        }
    }

    public void ReportSuccess(double latencyMs)
    {
        lock (_lock)
        {
            _consecutiveFailures = 0;
            _openUntilUtc = DateTime.MinValue;
            _lastSuccessUtc = DateTime.UtcNow;
            _lastLatencyMs = latencyMs;
            _successCount++;
            _lastFailureReason = null;
        }
    }

    public void ReportFailure(double latencyMs, string? reason)
    {
        lock (_lock)
        {
            _consecutiveFailures++;
            _lastFailureUtc = DateTime.UtcNow;
            _lastLatencyMs = latencyMs;
            _failureCount++;
            _lastFailureReason = reason;
            if (_consecutiveFailures >= FailureThreshold)
            {
                _openUntilUtc = DateTime.UtcNow.Add(Cooldown);
            }
        }
    }

    public ProviderHealthSnapshot Snapshot()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            return new ProviderHealthSnapshot(
                _provider,
                _openUntilUtc > now ? "open" : _consecutiveFailures > 0 ? "degraded" : "closed",
                _consecutiveFailures,
                _openUntilUtc > now ? _openUntilUtc : null,
                _lastSuccessUtc,
                _lastFailureUtc,
                Math.Round(_lastLatencyMs, 1),
                _successCount,
                _failureCount,
                _lastFailureReason);
        }
    }
}

public sealed record ProviderHealthSnapshot(
    string Provider,
    string CircuitState,
    int ConsecutiveFailures,
    DateTime? OpenUntilUtc,
    DateTime? LastSuccessUtc,
    DateTime? LastFailureUtc,
    double LastLatencyMs,
    long SuccessCount,
    long FailureCount,
    string? LastFailureReason);
