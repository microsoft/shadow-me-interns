import { MeetingDoc } from "./meetings";

/**
 * Build an ICS (iCalendar) file string from a meeting document.
 * When downloaded and opened, the user's default calendar app (Outlook)
 * will show a prefilled event they can add to their calendar.
 */
export const generateICS = (meeting: MeetingDoc): string => {
  // Convert "2026-03-02" + "09:00" → "20260302T090000"
  const toICSDate = (date: string, time: string): string => {
    const d = date.replace(/-/g, "");
    const t = time.replace(/:/g, "") + "00";
    return `${d}T${t}`;
  };

  const dtStart = toICSDate(meeting.date, meeting.start_time);
  const dtEnd = toICSDate(meeting.date, meeting.end_time);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const location = meeting.location || "Microsoft Teams";

  // Build description with meeting details
  const descriptionParts = [
    `Subject: ${meeting.subject}`,
    meeting.forwarded_by_name
      ? `Forwarded by: ${meeting.forwarded_by_name}`
      : "",
    meeting.role ? `Role: ${meeting.role}` : "",
    meeting.team ? `Team: ${meeting.team}` : "",
    meeting.meeting_link ? `Join: ${meeting.meeting_link}` : "",
  ].filter(Boolean);

  const description = descriptionParts.join("\\n");

  // Fold long lines per RFC 5545 (max 75 octets per line)
  const fold = (line: string): string => {
    const chunks: string[] = [];
    let remaining = line;
    while (remaining.length > 75) {
      chunks.push(remaining.slice(0, 75));
      remaining = " " + remaining.slice(75);
    }
    chunks.push(remaining);
    return chunks.join("\r\n");
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shadow Me Interns//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${meeting.id}@shadowmeinterns`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    fold(`SUMMARY:${meeting.subject}`),
    fold(`DESCRIPTION:${description}`),
    fold(`LOCATION:${location}`),
    meeting.meeting_link ? fold(`URL:${meeting.meeting_link}`) : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return lines;
};
