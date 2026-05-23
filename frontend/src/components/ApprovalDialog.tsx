import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: "approve" | "reject" | null;
  loading?: boolean;
  onConfirm: (comments: string) => void;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  action,
  loading,
  onConfirm,
}: Props) {
  const [comments, setComments] = useState("");

  const isApprove = action === "approve";
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setComments("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Approve booking" : "Reject booking"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="comments">Comments (optional)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            maxLength={500}
            placeholder={
              isApprove
                ? "Add a note for the requester…"
                : "Let them know why this was rejected…"
            }
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={() => onConfirm(comments.trim())}
            className={
              isApprove
                ? "bg-success text-success-foreground hover:bg-success/90"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
