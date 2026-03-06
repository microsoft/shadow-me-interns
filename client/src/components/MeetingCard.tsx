import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardFooter,
  CardHeader,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowForwardRegular,
  CalendarAddRegular,
  CalendarRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  DeleteRegular,
  LocationRegular,
  PeopleRegular,
  PersonRegular,
} from "@fluentui/react-icons";
import type { Meeting } from "../utils/types";

const useStyles = makeStyles({
  card: {
    width: "100%",
    height: "100%",
  },
  details: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalS} 0`,
    flex: 1,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badges: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  forwarder: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  link: {
    color: tokens.colorBrandForeground1,
  },
});

interface MeetingCardProps {
  meeting: Meeting;
  userEmail: string;
  expired?: boolean;
  isViewOnly?: boolean;
  onJoin: (meeting: Meeting) => void;
  onLeave: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
}

/** Format "2025-03-15" → "Sat, Mar 15, 2025" */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format "14:00" → "2:00 PM" */
function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h! >= 12 ? "PM" : "AM";
  const h12 = h! % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function MeetingCard({
  meeting,
  userEmail,
  expired = false,
  isViewOnly = false,
  onJoin,
  onLeave,
  onDelete,
}: MeetingCardProps) {
  const styles = useStyles();

  const spotsLeft = meeting.capacity - meeting.joined_interns.length;
  const isFull = spotsLeft <= 0;
  const hasJoined = meeting.joined_interns.includes(userEmail);
  const isDisabled = isViewOnly || expired;

  /** Build an Outlook Web deep link that opens a pre-filled new event form. */
  const getOutlookLink = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const [y, mo, d] = meeting.date.split("-").map(Number);
    const [sh, sm] = meeting.start_time.split(":").map(Number);
    const [eh, em] = meeting.end_time.split(":").map(Number);

    const startdt = `${y}-${pad(mo!)}-${pad(d!)}T${pad(sh!)}:${pad(sm!)}:00`;
    const enddt = `${y}-${pad(mo!)}-${pad(d!)}T${pad(eh!)}:${pad(em!)}:00`;

    const params = new URLSearchParams({
      subject: meeting.subject,
      startdt,
      enddt,
      ...(meeting.location && { location: meeting.location }),
      ...(meeting.meeting_link && {
        body: `Join link: ${meeting.meeting_link}`,
      }),
    });

    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  return (
    <Card className={styles.card} appearance="outline">
      <CardHeader
        header={
          <Body1>
            <strong>{meeting.subject}</strong>
          </Body1>
        }
        description={
          <Caption1>
            {meeting.role ? `${meeting.role} · ` : ""}
            {meeting.team}
            {meeting.sector ? ` · ${meeting.sector}` : ""}
          </Caption1>
        }
        action={
          <Button
            appearance="subtle"
            icon={<DeleteRegular />}
            size="small"
            disabled={isViewOnly}
            onClick={() => onDelete(meeting)}
          />
        }
      />

      <div className={styles.details}>
        <div className={styles.row}>
          <PersonRegular fontSize={16} />
          <Caption1>
            <a
              className={styles.link}
              href={`mailto:${meeting.original_sender}`}
            >
              {meeting.original_sender}
            </a>
          </Caption1>
        </div>

        <div className={styles.row}>
          <CalendarRegular fontSize={16} />
          <Caption1>{formatDate(meeting.date)}</Caption1>
        </div>

        <div className={styles.row}>
          <ClockRegular fontSize={16} />
          <Caption1>
            {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
          </Caption1>
        </div>

        {meeting.location && (
          <div className={styles.row}>
            <LocationRegular fontSize={16} />
            <Caption1>{meeting.location}</Caption1>
          </div>
        )}

        {meeting.forwarded_by_name && (
          <div className={styles.forwarder}>
            <ArrowForwardRegular fontSize={16} />
            <Caption1>Forwarded by {meeting.forwarded_by_name}</Caption1>
          </div>
        )}
      </div>

      <CardFooter className={styles.footer}>
        <div className={styles.badges}>
          <Tooltip
            content={
              meeting.joined_interns.length > 0
                ? {
                    children: (
                      <span>
                        {meeting.joined_interns.map((e, i) => (
                          <span key={e}>
                            <a
                              href={`mailto:${e}`}
                              style={{ color: "inherit" }}
                            >
                              {e}
                            </a>
                            {i < meeting.joined_interns.length - 1 && <br />}
                          </span>
                        ))}
                      </span>
                    ),
                  }
                : "No one has joined yet"
            }
            relationship="description"
          >
            <Badge
              appearance="tint"
              color={isFull ? "danger" : "informative"}
              icon={<PeopleRegular />}
            >
              {isFull
                ? "Full"
                : `${meeting.joined_interns.length}/${meeting.capacity} joined`}
            </Badge>
          </Tooltip>

          {hasJoined && (
            <Badge
              appearance="tint"
              color="success"
              icon={<CheckmarkCircleRegular />}
            >
              Joined
            </Badge>
          )}

          {expired && (
            <Badge appearance="tint" color="danger">
              Expired
            </Badge>
          )}
        </div>

        <div className={styles.actions}>
          {(!isFull || hasJoined) && (
            <Button
              appearance="subtle"
              icon={<CalendarAddRegular />}
              size="small"
              disabled={isDisabled}
              {...(!isDisabled && {
                as: "a" as const,
                href: getOutlookLink(),
                target: "_blank",
                rel: "noopener noreferrer",
              })}
            >
              Add to calendar
            </Button>
          )}

          {hasJoined ? (
            <Button
              appearance="subtle"
              size="small"
              disabled={isDisabled}
              onClick={() => onLeave(meeting)}
            >
              Leave
            </Button>
          ) : (
            <Button
              appearance="primary"
              size="small"
              disabled={isFull || isDisabled}
              onClick={() => onJoin(meeting)}
            >
              Join
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
