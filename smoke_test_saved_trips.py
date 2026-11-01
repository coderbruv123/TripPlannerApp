"""End-to-end smoke test for account-scoped saved trips.

Flow:
  1. Login as the seeded SuperAdmin -> get access token.
  2. GET /api/trips/saved (must return [] on a fresh account).
  3. POST /api/trips/saved a trip.
  4. GET /api/trips/saved (must now return that trip).
  5. DELETE /api/trips/saved/{id}.
  6. GET /api/trips/saved (must return [] again).
"""
import json
import urllib.request
import urllib.error
import uuid

BASE = "http://localhost:5176/api"
EMAIL = "superadmin@tripplanner.local"
PASSWORD = "SuperAdmin123!"
AUTH_HEADERS = {"Content-Type": "application/json"}
TRIP = {
    "title": "Athens, Greece",
    "country": "Greece",
    "originLabel": "Kolonaki",
    "destinationName": "Athens",
    "destinationCountry": "Greece",
    "from": "2026-10-09",
    "to": "2026-10-12",
    "travelers": 3,
    "budget": "1500",
    "url": "/trip?dest=Athens&country=Greece&from=2026-10-09&to=2026-10-12&adults=3",
    "interests": [],
}


def req(method, path, body=None, token=None):
    url = BASE + path
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def step(name, cond):
    print(("PASS" if cond else "FAIL"), "-", name)
    return name, cond


results = []

# 1. Login
status, body = req("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
token = None
if status == 200 and isinstance(body, dict):
    token = (body or {}).get("data", {}).get("token")
results.append(step(f"login (status {status})", status == 200 and bool(token)))
if not token:
    print("Could not authenticate; aborting smoke test.")
    raise SystemExit(1)

# 2. List saved trips (fresh account)
status, body = req("GET", "/trips/saved", token=token)
results.append(step(f"GET saved trips (status {status})", status == 200))
first_count = 0
if isinstance(body, list):
    first_count = len(body)
results.append(step("initial list is empty", first_count == 0))

# 3. Save a trip
status, body = req("POST", "/trips/saved", TRIP, token=token)
saved_id = None
if status == 201 and isinstance(body, dict):
    saved_id = body.get("id")
results.append(step(f"POST save trip (status {status})", status == 201 and bool(saved_id)))
if saved_id:
    print("   created trip id:", saved_id)

# 4. List again
status, body = req("GET", "/trips/saved", token=token)
got = [] if not isinstance(body, list) else body
results.append(step("GET saved trips after save (status 200)", status == 200))
results.append(step("list contains the saved trip", isinstance(got, list) and len(got) == 1))

# 5. Delete the trip
status, _ = req("DELETE", f"/trips/saved/{saved_id}", token=token)
results.append(step(f"DELETE saved trip (status {status})", status in (200, 204)))

# 6. List again (should be empty)
status, body = req("GET", "/trips/saved", token=token)
after = [] if not isinstance(body, list) else body
results.append(step("GET saved trips after delete (status 200)", status == 200))
results.append(step("list empty after delete", len(after) == 0))

print("\n===== SUMMARY =====")
print(f"{sum(1 for _, ok in results if ok)}/{len(results)} steps passed")
for name, ok in results:
    print(("PASS" if ok else "FAIL"), "-", name)
