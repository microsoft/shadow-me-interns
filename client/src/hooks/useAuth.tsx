import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loginRequest, msalInstance } from "../utils/auth";
import { getMe } from "../utils/api";
import { useSessionTimeout } from "./useSessionTimeout";

const SESSION_START_KEY = "session_start_ts";

interface AuthState {
  isAuthenticated: boolean;
  isWhitelisted: boolean;
  email: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  whitelistError: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { inProgress, accounts } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();
  const [email, setEmail] = useState<string | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [whitelistError, setWhitelistError] = useState(false);
  const [checkingWhitelist, setCheckingWhitelist] = useState(false);

  const isLoading =
    inProgress !== InteractionStatus.None || checkingWhitelist;

  // Once MSAL authenticates, fetch user info from backend
  useEffect(() => {
    if (!isMsalAuthenticated || accounts.length === 0) return;

    setCheckingWhitelist(true);
    getMe()
      .then(({ email: userEmail, whitelisted }) => {
        setEmail(userEmail);
        setIsWhitelisted(whitelisted);
        setWhitelistError(false);
      })
      .catch(() => {
        setWhitelistError(true);
        setIsWhitelisted(false);
      })
      .finally(() => setCheckingWhitelist(false));
  }, [isMsalAuthenticated, accounts]);

  const login = useCallback(() => {
    msalInstance.loginRedirect(loginRequest);
  }, []);

  const logout = useCallback(() => {
    // REQ-356: Explicitly destroy the session
    // 1. Clear the absolute-session timestamp
    sessionStorage.removeItem(SESSION_START_KEY);

    // 2. Clear all MSAL cache entries from storage
    const msalKeys = Object.keys(sessionStorage).filter(
      (k) => k.startsWith("msal.") || k.startsWith("login."),
    );
    for (const key of msalKeys) {
      sessionStorage.removeItem(key);
    }

    // 3. Redirect to Entra sign-out (clears the SSO session cookie)
    msalInstance.logoutRedirect();
  }, []);

  // REQ-356: 30-min idle timeout & 8-hour absolute timeout
  useSessionTimeout(logout, isMsalAuthenticated);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isMsalAuthenticated && !whitelistError,
        isWhitelisted,
        email,
        isLoading,
        login,
        logout,
        whitelistError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
