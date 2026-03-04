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
import { deleteMeeting } from "../utils/api";
import type { Meeting } from "../utils/types";

interface DeleteDialogProps {
  meeting: Meeting | null;
  onClose: () => void;
  onDeleted: () => void;
  onError: (msg: string) => void;
}

export function DeleteDialog({
  meeting,
  onClose,
  onDeleted,
  onError,
}: DeleteDialogProps) {
  const mutation = useMutation({
    mutationFn: (id: string) => deleteMeeting(id),
    onSuccess: () => {
      onDeleted();
      onClose();
    },
    onError: (err) => {
      onError(err instanceof Error ? err.message : "Failed to delete meeting");
      onClose();
    },
  });

  const handleDelete = () => {
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
          <DialogTitle>Delete Meeting</DialogTitle>
          <DialogContent>
            <Body1>
              Are you sure you want to delete{" "}
              <strong>{meeting?.subject}</strong>? This action cannot be undone.
            </Body1>{" "}
            <br />
            <Body1 style={{ color: "red", marginTop: "8px" }}>
              Warning: This deletes the meeting for everyone.
            </Body1>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleDelete}
              disabled={loading}
              icon={loading ? <Spinner size="tiny" /> : undefined}
            >
              {loading ? "Deleting…" : "Delete"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
