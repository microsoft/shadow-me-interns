import {
  Body1,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Spinner,
} from "@fluentui/react-components";
import { useMutation } from "@tanstack/react-query";
import { joinMeeting } from "../utils/api";
import type { Meeting } from "../utils/types";

interface JoinDialogProps {
  meeting: Meeting | null;
  onClose: () => void;
  onJoined: () => void;
  onError: (msg: string) => void;
}

export function JoinDialog({
  meeting,
  onClose,
  onJoined,
  onError,
}: JoinDialogProps) {
  const mutation = useMutation({
    mutationFn: (id: string) => joinMeeting(id),
    onSuccess: () => {
      onJoined();
      onClose();
    },
    onError: (err) => {
      onError(err instanceof Error ? err.message : "Failed to join meeting");
      onClose();
    },
  });

  const handleJoin = () => {
    if (!meeting) return;
    mutation.mutate(meeting.id);
  };

  const loading = mutation.isPending;

  return (
    <Dialog
      open={!!meeting}
      onOpenChange={(_e, data) => {
        if (!data.open) onClose();
      }}
      modalType="modal"
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Confirm Attendance</DialogTitle>
          <DialogContent>
            <Body1>
              Have you added <strong>{meeting?.subject}</strong> to your
              calendar? By confirming, the meeting organizer will be notified
              that you'll be shadowing.
            </Body1>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleJoin}
              disabled={loading}
              icon={loading ? <Spinner size="tiny" /> : undefined}
            >
              {loading ? "Joining…" : "Confirm"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
