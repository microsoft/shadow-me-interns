import {
  FluentProvider,
  Spinner,
  Toaster,
  makeStyles,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Header, type Page } from "./components/Header";
import { InternList } from "./components/InternList";
import { LoginPage } from "./components/LoginPage";
import { MeetingList } from "./components/MeetingList";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import "./index.css";

const TOASTER_ID = "global";

const useStyles = makeStyles({
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
});

function AuthenticatedApp({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const [page, setPage] = useState<Page>("meetings");

  return (
    <>
      <Header
        currentPage={page}
        onNavigate={setPage}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />
      {page === "meetings" ? <MeetingList /> : <InternList />}
    </>
  );
}

function AppContent({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const styles = useStyles();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" label="Loading…" />
      </div>
    );
  }

  return isAuthenticated ? (
    <AuthenticatedApp isDark={isDark} onToggleTheme={onToggleTheme} />
  ) : (
    <LoginPage isDark={isDark} onToggleTheme={onToggleTheme} />
  );
}

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("intern_support_theme") === "dark",
  );

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("intern_support_theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <FluentProvider
        theme={isDark ? webDarkTheme : webLightTheme}
        style={{ minHeight: "100vh" }}
      >
        <AuthProvider>
          <AppContent isDark={isDark} onToggleTheme={toggleTheme} />
        </AuthProvider>
        <Toaster toasterId={TOASTER_ID} position="top" />
      </FluentProvider>
    </QueryClientProvider>
  );
}

export default App;
