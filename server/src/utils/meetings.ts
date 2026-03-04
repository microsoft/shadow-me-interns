import { Container, CosmosClient } from "@azure/cosmos";
import config from "../config/config";

const client = new CosmosClient({
  endpoint: config.cosmos.endpoint,
  key: config.cosmos.key,
});

const database = client.database(config.cosmos.database);
const container: Container = database.container(config.cosmos.container);

/** Shape of a meeting document as inserted by Logic Apps. */
export interface MeetingDoc {
  id: string;
  original_sender: string;
  forwarded_by_name: string;
  forwarded_by_email: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  meeting_link: string;
  role: string;
  team: string;
  sector: string;
  capacity: number;
  joined_interns: string[];
}

/** Fetch all meetings, newest first. */
export const getAllMeetings = async (): Promise<MeetingDoc[]> => {
  const { resources } = await container.items
    .query<MeetingDoc>({
      query: "SELECT * FROM c ORDER BY c._ts DESC",
    })
    .fetchAll();

  return resources;
};

/** Fetch a single meeting by ID. */
export const getMeetingById = async (
  id: string,
): Promise<MeetingDoc | null> => {
  const { resources } = await container.items
    .query<MeetingDoc>({
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    })
    .fetchAll();

  return resources[0] ?? null;
};

/**
 * Add an intern to a meeting's joined_interns array.
 * Returns the updated document, or null if the meeting wasn't found.
 * Throws if the meeting is at capacity or the intern already joined.
 */
export const joinMeeting = async (
  id: string,
  internEmail: string,
): Promise<MeetingDoc> => {
  // Fetch current doc — we need the full doc for replace
  const meeting = await getMeetingById(id);
  if (!meeting)
    throw Object.assign(new Error("Meeting not found"), { status: 404 });

  if (meeting.joined_interns.includes(internEmail)) {
    throw Object.assign(new Error("You have already joined this meeting"), {
      status: 409,
    });
  }

  if (meeting.joined_interns.length >= meeting.capacity) {
    throw Object.assign(new Error("Meeting is at full capacity"), {
      status: 409,
    });
  }

  meeting.joined_interns.push(internEmail);

  const { resource } = await container
    .item(meeting.id, meeting.id)
    .replace(meeting);

  return resource as MeetingDoc;
};

/**
 * Remove an intern from a meeting's joined_interns array.
 * Throws if the meeting doesn't exist or the intern hasn't joined.
 */
export const leaveMeeting = async (
  id: string,
  internEmail: string,
): Promise<MeetingDoc> => {
  const meeting = await getMeetingById(id);
  if (!meeting)
    throw Object.assign(new Error("Meeting not found"), { status: 404 });

  const idx = meeting.joined_interns.indexOf(internEmail);
  if (idx === -1) {
    throw Object.assign(new Error("You have not joined this meeting"), {
      status: 409,
    });
  }

  meeting.joined_interns.splice(idx, 1);

  const { resource } = await container
    .item(meeting.id, meeting.id)
    .replace(meeting);

  return resource as MeetingDoc;
};

/** Delete a meeting document by ID. */
export const deleteMeeting = async (id: string): Promise<void> => {
  const meeting = await getMeetingById(id);
  if (!meeting)
    throw Object.assign(new Error("Meeting not found"), { status: 404 });

  await container.item(meeting.id, meeting.id).delete();
};
