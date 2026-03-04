/** Shape of a meeting document returned by the API. */
export interface Meeting {
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
