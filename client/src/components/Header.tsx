import {
  makeStyles,
  tokens,
  Button,
  Caption1,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Avatar,
} from "@fluentui/react-components";
import { SignOutRegular } from "@fluentui/react-icons";
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
  logo: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  user: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
});

export function Header() {
  const styles = useStyles();
  const { email, logout } = useAuth();

  return (
    <header className={styles.header}>
      <span className={styles.logo}>Shadow Me</span>

      <div className={styles.user}>
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
