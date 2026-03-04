import { useQuery } from "@tanstack/react-query";
import { getMeetings } from "../utils/api";

const POLL_INTERVAL = 5_000;

export function useMeetings() {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: getMeetings,
    refetchInterval: POLL_INTERVAL,
  });
}
