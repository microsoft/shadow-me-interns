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
    msalInstance.logoutRedirect();
  }, []);

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
