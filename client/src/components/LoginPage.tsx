import {
  Body1,
  Button,
  Caption1,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Title3,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  KeyRegular,
  MailRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from "@fluentui/react-icons";
import { useState, type FormEvent, type MouseEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { requestCode, verifyCode } from "../utils/api";

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: tokens.spacingHorizontalXL,
    position: "relative" as const,
  },
  themeToggle: {
    position: "absolute" as const,
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: tokens.spacingHorizontalXXL,
  },
  header: {
    textAlign: "center",
    marginBottom: tokens.spacingVerticalXXL,
  },
  title: {
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS,
    textAlign: "center" as const,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
});

type Step = "email" | "code";

interface LoginPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function LoginPage({ isDark, onToggleTheme }: LoginPageProps) {
  const styles = useStyles();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmailVal] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await requestCode(email.toLowerCase().trim());
      // Test bypass: backend returns a token directly, skip code step
      if (res.token) {
        login(res.token, email.toLowerCase().trim());
        return;
      }
      setStep("code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { token } = await verifyCode(email.toLowerCase().trim(), code);
      login(token, email.toLowerCase().trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStep("email");
    setCode("");
    setError(null);
  };

  return (
    <div className={styles.container}>
      <Button
        className={styles.themeToggle}
        appearance="subtle"
        icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
        size="small"
        onClick={onToggleTheme}
      />
      <Card className={styles.card} appearance="outline">
        <div className={styles.header}>
          <Title3 className={styles.title} block>
            Intern Support
          </Title3>
          <Caption1>Get support from interns</Caption1>
        </div>

        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className={styles.form}>
            <Body1>
              Sign in with your Microsoft email to continue. (BE Interns Only)
            </Body1>

            <Field label="Email address" required>
              <Input
                type="email"
                placeholder="t-someone@microsoft.com"
                value={email}
                onChange={(_e, data) => setEmailVal(data.value)}
                contentBefore={<MailRegular />}
                size="large"
                appearance="outline"
                disabled={loading}
              />
            </Field>

            <div className={styles.actions}>
              <Button
                appearance="primary"
                type="submit"
                disabled={loading || !email.trim()}
                icon={loading ? <Spinner size="tiny" /> : undefined}
                style={{ flex: 1 }}
              >
                {loading ? "Sending…" : "Send Code"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className={styles.form}>
            <Body1>
              We sent a 6-digit code to <strong>{email}</strong>
            </Body1>

            <Field label="Verification code" required>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(_e, data) => setCode(data.value)}
                contentBefore={<KeyRegular />}
                size="large"
                appearance="outline"
                maxLength={6}
                disabled={loading}
              />
            </Field>

            <div className={styles.actions}>
              <Button
                appearance="secondary"
                type="button"
                onClick={handleBack}
                disabled={loading}
                icon={<ArrowLeftRegular />}
              >
                Back
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={loading || code.length !== 6}
                icon={loading ? <Spinner size="tiny" /> : undefined}
                style={{ flex: 1 }}
              >
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
