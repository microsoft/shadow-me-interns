import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { clearAuth, getToken, setEmail, setToken } from "../utils/auth";
import { validateToken } from "../utils/api";

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  isLoading: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmailState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    validateToken(token)
      .then(({ valid, email: userEmail }) => {
        if (valid) {
          setIsAuthenticated(true);
          setEmailState(userEmail);
        } else {
          clearAuth();
        }
      })
      .catch(() => clearAuth())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((token: string, userEmail: string) => {
    setToken(token);
    setEmail(userEmail);
    setIsAuthenticated(true);
    setEmailState(userEmail);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setIsAuthenticated(false);
    setEmailState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, email, isLoading, login, logout }}
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
