/* The async check-then-set below is the standard pattern for this
   route guard: the request resolves after mount, so the state update
   happens in a callback outside the synchronous effect body. */
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getMe } from "../api/auth";
import { clearAuth, isLoggedIn } from "../api/authUtils";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export default function ProtectedRoute() {
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    if (!isLoggedIn()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("unauthenticated");
      return;
    }

    let cancelled = false;

    getMe()
      .catch(() => {
        // Invalid/expired token: drop the stored session.
        clearAuth();
      })
      .finally(() => {
        if (!cancelled) {
          setStatus(isLoggedIn() ? "authenticated" : "unauthenticated");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
