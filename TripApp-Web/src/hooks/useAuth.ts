import { useEffect, useState } from "react";
import {
  AUTH_EVENT,
  getUserName,
  isAdmin,
  isLoggedIn,
} from "../api/authUtils";

export type AuthState = {
  loggedIn: boolean;
  isAdmin: boolean;
  name: string;
};

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>(() => ({
    loggedIn: isLoggedIn(),
    isAdmin: isAdmin(),
    name: getUserName(),
  }));

  useEffect(() => {
    const sync = () =>
      setState({
        loggedIn: isLoggedIn(),
        isAdmin: isAdmin(),
        name: getUserName(),
      });

    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}
