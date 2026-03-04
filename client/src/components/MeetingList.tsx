import {
  makeStyles,
  MessageBar,
  MessageBarBody,
  Spinner,
  Title2,
  Toast,
  ToastTitle,
  tokens,
  useToastController,
} from "@fluentui/react-components";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMeetings } from "../hooks/useMeetings";
import type { Meeting } from "../utils/types";
import { EmptyState } from "./EmptyState";
import { FilterBar, useFilteredMeetings } from "./FilterBar";
import { JoinDialog } from "./JoinDialog";
import { MeetingCard } from "./MeetingCard";

const useStyles = makeStyles({
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: tokens.spacingHorizontalXL,
  },
  title: {
    marginBottom: tokens.spacingVerticalL,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  center: {
    display: "flex",
    justifyContent: "center",
    padding: tokens.spacingVerticalXXXL,
  },
});

export function MeetingList() {
  const styles = useStyles();
  const { email } = useAuth();
  const { data: meetings = [], isLoading, error } = useMeetings();
  const { dispatchToast } = useToastController("global");
  const queryClient = useQueryClient();

  const {
    filtered,
    search,
    setSearch,
    team,
    setTeam,
    sector,
    setSector,
    availability,
    setAvailability,
    teams,
    sectors,
  } = useFilteredMeetings(meetings, email ?? "");

  const [joinTarget, setJoinTarget] = useState<Meeting | null>(null);

  const handleJoined = () => {
    dispatchToast(
      <Toast>
        <ToastTitle>Successfully joined the meeting!</ToastTitle>
      </Toast>,
      { intent: "success" },
    );
    queryClient.invalidateQueries({ queryKey: ["meetings"] });
  };

  const handleJoinError = (msg: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{msg}</ToastTitle>
      </Toast>,
      { intent: "error" },
    );
  };

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner
          label="Loading meetings…"
          size="medium"
          labelPosition="below"
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Title2 className={styles.title} block>
        Available Meetings
      </Title2>

      {error && (
        <MessageBar
          intent="error"
          style={{ marginBottom: tokens.spacingVerticalM }}
        >
          <MessageBarBody>
            {error instanceof Error
              ? error.message
              : "Failed to fetch meetings"}
          </MessageBarBody>
        </MessageBar>
      )}

      {meetings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            team={team}
            onTeamChange={setTeam}
            sector={sector}
            onSectorChange={setSector}
            availability={availability}
            onAvailabilityChange={setAvailability}
            teams={teams}
            sectors={sectors}
          />

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className={styles.grid}>
              {filtered.map((m) => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  userEmail={email ?? ""}
                  onJoin={setJoinTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      <JoinDialog
        meeting={joinTarget}
        onClose={() => setJoinTarget(null)}
        onJoined={handleJoined}
        onError={handleJoinError}
      />
    </div>
  );
}
