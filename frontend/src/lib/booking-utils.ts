import type { BookingStatus } from "@/types/booking";

export const statusMeta: Record<BookingStatus, { label: string; className: string }> = {
  pending_hod:    { label: "Pending HOD",    className: "bg-warning/15 text-warning border-warning/30" },
  pending_admin:  { label: "Pending Admin",  className: "bg-info/15 text-info border-info/30" },
  pending_dean:   { label: "Pending Dean",   className: "bg-purple/15 text-purple border-purple/30" },
  dean_approved:  { label: "Approved",       className: "bg-success/15 text-success border-success/30" },
  hod_rejected:   { label: "Rejected by HOD",   className: "bg-destructive/15 text-destructive border-destructive/30" },
  admin_rejected: { label: "Rejected by Admin", className: "bg-destructive/15 text-destructive border-destructive/30" },
  dean_rejected:  { label: "Rejected by Dean",  className: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled:      { label: "Cancelled",      className: "bg-muted text-muted-foreground border-border" },
};

export function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);

    const formatDate = (d: Date) =>
      d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    const formatTime = (d: Date) =>
      d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    return `${formatDate(s)} · ${formatTime(s)} - ${formatDate(e)} · ${formatTime(e)}`;
  } catch {
    return `${start} - ${end}`;
  }
}