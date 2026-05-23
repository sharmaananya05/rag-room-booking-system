import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "./StatusBadge";
import {
  Calendar,
  MapPin,
  Users,
  Phone,
  User2,
  GraduationCap,
  ClipboardList,
  Check,
  X,
  Send,
} from "lucide-react";
import type { Booking, ApprovalEntry } from "@/types/booking";
import { formatDateRange } from "@/lib/booking-utils";

interface Props {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function actionIcon(action: ApprovalEntry["action"]) {
  if (action === "APPROVED") return Check;
  if (action === "REJECTED") return X;
  if (action === "CANCELLED") return X;
  return Send;
}

export function BookingDrawer({ booking, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b px-6 py-4 space-y-1">
          <SheetTitle className="flex items-center justify-between gap-2 text-base">
            <span className="truncate">
              Booking {booking?.booking_reference}
            </span>
            {booking && <StatusBadge status={booking.status} />}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{booking?.purpose}</p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {!booking ? null : (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info
                  icon={MapPin}
                  label="Room"
                  value={
                    booking.room
                      ? `${booking.room.room_number}${booking.room.name ? " · " + booking.room.name : ""}`
                      : "—"
                  }
                />
                <Info
                  icon={Calendar}
                  label="When"
                  value={formatDateRange(
                    booking.start_datetime,
                    booking.end_datetime,
                  )}
                />
                <Info
                  icon={Users}
                  label="Attendees"
                  value={booking.expected_attendees?.toString() || "—"}
                />
                <Info
                  icon={Phone}
                  label="Phone"
                  value={booking.faculty_incharge?.phone || "—"}
                />
                <Info
                  icon={User2}
                  label="Faculty in-charge"
                  value={booking.faculty_incharge?.name || "—"}
                />
                <Info
                  icon={GraduationCap}
                  label="Student coordinator"
                  value={booking.student_coordinator?.name || "—"}
                />
                <Info
                  icon={User2}
                  label="Faculty supervisor"
                  value={booking.faculty_supervisor?.name || "—"}
                />
                <Info
                  icon={ClipboardList}
                  label="Requester"
                  value={
                    booking.requester?.name ||
                    booking.faculty_incharge?.name ||
                    "—"
                  }
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold">
                  Approval timeline
                </h3>
                {booking.approvals && booking.approvals.length > 0 ? (
                  <ol className="relative space-y-4 border-l border-border pl-5">
                    {booking.approvals.map((a, i) => {
                      const Icon = actionIcon(a.action);
                      const tone =
                        a.action === "APPROVED"
                          ? "bg-success text-success-foreground"
                          : a.action === "REJECTED"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-info text-info-foreground";
                      return (
                        <li key={a.id ?? i} className="relative">
                          <span
                            className={`absolute -left-6.75 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${tone}`}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                          <p className="text-sm font-medium">
                            {a.action === "SUBMITTED"
                              ? "Submitted"
                              : a.action.charAt(0) +
                                a.action.slice(1).toLowerCase()}
                            {a.actor_name && (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {a.actor_name}
                              </span>
                            )}
                          </p>
                          {a.comments && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {a.comments}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {new Date(a.created_at).toLocaleString()}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No approval activity yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
