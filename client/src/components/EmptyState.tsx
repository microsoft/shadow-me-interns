import { Body1, makeStyles, Title3, tokens } from "@fluentui/react-components";
import { CalendarSearchRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXXXL,
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
  icon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground4,
  },
});

export function EmptyState() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <CalendarSearchRegular className={styles.icon} />
      <Title3>No meetings yet</Title3>
      <Body1>
        When meetings are forwarded, they'll appear here for you to join.
      </Body1>
    </div>
  );
}
