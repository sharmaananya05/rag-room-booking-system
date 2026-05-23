import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BookingsTable } from "@/components/BookingsTable";
import { BookingDrawer } from "@/components/BookingDrawer";
import { ApprovalDialog } from "@/components/ApprovalDialog";
import {
  useApproveBooking,
  useBookings,
  useRejectBooking,
} from "@/hooks/useBookings";
import type { Booking, BookingStatus } from "@/types/booking";

interface Props {
  pendingStatus: BookingStatus;
  pendingScope?: "pending" | "history";
  pendingTitle: string;
  historyTitle?: string;
}

export function ApprovalDashboard({
  pendingStatus,
  pendingTitle,
  historyTitle = "History",
}: Props) {
  const { data: pending, isLoading: loadingPending } = useBookings({
    status: pendingStatus,
    scope: "pending",
  });
  const { data: history, isLoading: loadingHistory } = useBookings({
    scope: "history",
  });
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actioning, setActioning] = useState<{
    booking: Booking;
    type: "approve" | "reject";
  } | null>(null);

  const approveMut = useApproveBooking();
  const rejectMut = useRejectBooking();

  const onConfirm = async (comments: string) => {
    if (!actioning) return;
    const id = actioning.booking.id;
    if (actioning.type === "approve")
      await approveMut.mutateAsync({ id, comments });
    else await rejectMut.mutateAsync({ id, comments });
    setActioning(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">{pendingTitle}</TabsTrigger>
          <TabsTrigger value="history">{historyTitle}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <BookingsTable
            bookings={pending}
            isLoading={loadingPending}
            onRowClick={(b) => setSelected(b)}
            showRequester
            emptyTitle="No pending approvals"
            emptyMessage="Nothing waiting for your review right now."
            extraActions={(b) => (
              <>
                <Button
                  size="sm"
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => setActioning({ booking: b, type: "approve" })}
                  disabled={
                    approveMut.isPending && approveMut.variables?.id === b.id
                  }
                >
                  {approveMut.isPending && approveMut.variables?.id === b.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Approve"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setActioning({ booking: b, type: "reject" })}
                  disabled={
                    rejectMut.isPending && rejectMut.variables?.id === b.id
                  }
                >
                  Reject
                </Button>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="history">
          <BookingsTable
            bookings={history}
            isLoading={loadingHistory}
            onRowClick={(b) => setSelected(b)}
            showRequester
            emptyTitle="No history yet"
            emptyMessage="Bookings you've acted on will appear here."
          />
        </TabsContent>
      </Tabs>

      <BookingDrawer
        booking={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />

      <ApprovalDialog
        open={!!actioning}
        onOpenChange={(v) => !v && setActioning(null)}
        action={actioning?.type ?? null}
        loading={approveMut.isPending || rejectMut.isPending}
        onConfirm={onConfirm}
      />
    </div>
  );
}
