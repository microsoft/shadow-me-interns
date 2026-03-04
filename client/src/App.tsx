import {
  FluentProvider,
  Spinner,
  Toaster,
  makeStyles,
  webLightTheme,
} from "@fluentui/react-components";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { MeetingList } from "./components/MeetingList";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import "./index.css";

const TOASTER_ID = "global";
const queryClient = new QueryClient();

const useStyles = makeStyles({
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
});

function AuthenticatedApp() {
  return (
    <>
      <Header />
      <MeetingList />
    </>
  );
}

function AppContent() {
  const styles = useStyles();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" label="Loading…" />
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <LoginPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FluentProvider theme={webLightTheme}>
        <Toaster toasterId={TOASTER_ID} position="top" />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </FluentProvider>
    </QueryClientProvider>
  );
}

export default App;
