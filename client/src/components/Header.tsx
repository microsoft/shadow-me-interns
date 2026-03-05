import {
  Avatar,
  Button,
  Caption1,
  makeStyles,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  tokens,
} from "@fluentui/react-components";
import {
  SignOutRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../hooks/useAuth";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    position: "sticky",
    top: "0",
    zIndex: 100,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
  },
  logo: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  nav: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  user: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
});

export type Page = "meetings" | "interns";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({
  currentPage,
  onNavigate,
  isDark,
  onToggleTheme,
}: HeaderProps) {
  const styles = useStyles();
  const { email, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.logo}>Intern Support</span>
        <nav className={styles.nav}>
          <Button
            appearance={currentPage === "meetings" ? "subtle" : "transparent"}
            size="small"
            onClick={() => onNavigate("meetings")}
          >
            Meetings
          </Button>
          <Button
            appearance={currentPage === "interns" ? "subtle" : "transparent"}
            size="small"
            onClick={() => onNavigate("interns")}
          >
            Intern Directory
          </Button>
        </nav>
      </div>

      <div className={styles.user}>
        <Button
          appearance="subtle"
          icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
          size="small"
          onClick={onToggleTheme}
        />
        <Button
          appearance="subtle"
          icon={
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          }
          size="small"
          as="a"
          href="https://github.com/microsoft/shadow-me-interns"
          target="_blank"
          rel="noopener noreferrer"
        />
        <Caption1>{email}</Caption1>

        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              icon={<Avatar name={email ?? ""} size={28} />}
              size="small"
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<SignOutRegular />} onClick={logout}>
                Sign out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </header>
  );
}
