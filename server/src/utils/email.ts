import { Resend } from "resend";
import config from "../config/config";
import { MeetingDoc } from "./meetings";

const resend = new Resend(config.resendApiKey);

/**
 * Send a one-time verification code to the given email address.
 */
export const sendVerificationEmail = async (
  to: string,
  code: string,
): Promise<void> => {
  const { error } = await resend.emails.send({
    from: "Shadow Me Interns <noreply@shadowmeinterns.me>",
    to: [to],
    subject: "Your Shadow Me verification code",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0078d4">Shadow Me Interns</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#0078d4">${code}</p>
        <p style="color:#666;font-size:13px">This code expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }
};

/**
 * Notify the forwarder and original sender that an intern will be
 * shadowing their meeting. Only sends to addresses that are present.
 */
export const sendJoinNotification = async (
  meeting: MeetingDoc,
  internEmail: string,
): Promise<void> => {
  const recipients: string[] = [];

  if (meeting.forwarded_by_email) recipients.push(meeting.forwarded_by_email);
  if (
    meeting.original_sender &&
    meeting.original_sender !== meeting.forwarded_by_email
  ) {
    recipients.push(meeting.original_sender);
  }

  if (recipients.length === 0) return;

  const forwarderLine = meeting.forwarded_by_name
    ? `forwarded by ${meeting.forwarded_by_name}`
    : "forwarded to Shadow Me Interns";

  const { error } = await resend.emails.send({
    from: "Shadow Me Interns <noreply@shadowmeinterns.me>",
    to: recipients,
    subject: `An intern will shadow: ${meeting.subject}`,
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0078d4">Shadow Me Interns</h2>
        <p><strong>${internEmail}</strong> has confirmed they will be shadowing the following meeting (${forwarderLine}):</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:6px 12px;color:#666">Subject</td><td style="padding:6px 12px">${meeting.subject}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Date</td><td style="padding:6px 12px">${meeting.date}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Time</td><td style="padding:6px 12px">${meeting.start_time} - ${meeting.end_time}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Location</td><td style="padding:6px 12px">${meeting.location || "Teams"}</td></tr>
        </table>
        <p style="color:#666;font-size:13px">This notification was sent automatically by the <a href="https://shadowmeinterns.me" style="color:#0078d4">Shadow Me Interns</a> tool.</p>
      </div>
    `,
  });

  if (error) {
    // Log but don't throw — the join itself already succeeded
    console.error("Failed to send join notification:", error.message);
  }
};
