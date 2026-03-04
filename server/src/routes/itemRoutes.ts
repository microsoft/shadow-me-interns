import { Request, Response, Router } from "express";
import { sendJoinNotification } from "../utils/email";
import { generateICS } from "../utils/ics";
import {
  deleteMeeting,
  getAllMeetings,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
} from "../utils/meetings";

const router = Router();

/**
 * GET /api/items
 * Returns all meetings (frontend polls this every 5 seconds).
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const meetings = await getAllMeetings();
    res.json(meetings);
  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
});

/**
 * GET /api/items/:id
 * Returns a single meeting by ID.
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const meeting = await getMeetingById(req.params.id as string);

    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    res.json(meeting);
  } catch (err) {
    console.error("Error fetching meeting:", err);
    res.status(500).json({ message: "Failed to fetch meeting" });
  }
});

/**
 * GET /api/items/:id/ics
 * Returns an .ics calendar file for the meeting.
 * The frontend triggers this as a download; opening the file adds the
 * event to the intern's Outlook calendar with all details prefilled.
 */
router.get("/:id/ics", async (req: Request, res: Response) => {
  try {
    const meeting = await getMeetingById(req.params.id as string);

    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    const ics = generateICS(meeting);

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${meeting.subject.replace(/[^a-zA-Z0-9 ]/g, "")}.ics"`,
    );
    res.send(ics);
  } catch (err) {
    console.error("Error generating ICS:", err);
    res.status(500).json({ message: "Failed to generate calendar invite" });
  }
});

/**
 * POST /api/items/:id/join
 * Body: (none — email is taken from JWT)
 *
 * Called when the intern confirms they joined the meeting (clicks "Yes"
 * in the confirmation dialog). Adds their email to joined_interns.
 * Enforces capacity and prevents duplicate joins.
 */
router.post("/:id/join", async (req: Request, res: Response) => {
  try {
    const email = (req as Request & { user: { email: string } }).user.email;
    const updated = await joinMeeting(req.params.id as string, email);

    // Notify forwarder + original sender (fire-and-forget, don't block response)
    sendJoinNotification(updated, email).catch(() => {});

    res.json(updated);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    console.error("Error joining meeting:", error.message);
    res.status(error.status || 500).json({ message: error.message });
  }
});

/**
 * POST /api/items/:id/leave
 * Body: (none — email is taken from JWT)
 *
 * Removes the intern's email from joined_interns.
 */
router.post("/:id/leave", async (req: Request, res: Response) => {
  try {
    const email = (req as Request & { user: { email: string } }).user.email;
    const updated = await leaveMeeting(req.params.id as string, email);

    res.json(updated);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    console.error("Error leaving meeting:", error.message);
    res.status(error.status || 500).json({ message: error.message });
  }
});

/**
 * DELETE /api/items/:id
 *
 * Permanently removes a meeting document from the database.
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await deleteMeeting(req.params.id as string);
    res.json({ message: "Meeting deleted" });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    console.error("Error deleting meeting:", error.message);
    res.status(error.status || 500).json({ message: error.message });
  }
});

export default router;
