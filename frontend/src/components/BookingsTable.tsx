import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "./StatusBadge";
import { formatDateRange } from "@/lib/booking-utils";
import type { Booking } from "@/types/booking";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface Column {
  key: string;
  header: string;
  className?: string;
  render: (b: Booking) => ReactNode;
}

interface Props {
  bookings: Booking[] | undefined;
  isLoading: boolean;
  onRowClick?: (b: Booking) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  extraActions?: (b: Booking) => ReactNode;
  showRequester?: boolean;
}

export function BookingsTable({
  bookings,
  isLoading,
  onRowClick,
  emptyTitle = "No bookings yet",
  emptyMessage = "When bookings appear, they'll show up here.",
  extraActions,
  showRequester,
}: Props) {
  const columns: Column[] = [
    {
      key: "ref",
      header: "Reference",
      render: (b) => (
        <span className="font-mono text-xs">{b.booking_reference}</span>
      ),
    },
    ...(showRequester
      ? [
          {
            key: "req",
            header: "Requester",
            render: (b: Booking) =>
              b.requester?.name || b.faculty_incharge?.name || "—",
          },
        ]
      : []),
    {
      key: "room",
      header: "Room",
      render: (b) =>
        b.room
          ? `${b.room.room_number}${b.room.name ? " · " + b.room.name : ""}`
          : "—",
    },
    {
      key: "purpose",
      header: "Purpose",
      className: "max-w-[260px]",
      render: (b) => (
        <span className="block truncate" title={b.purpose}>
          {b.purpose}
        </span>
      ),
    },
    {
      key: "when",
      header: "Date & Time",
      render: (b) => (
        <span className="whitespace-nowrap text-sm">
          {formatDateRange(b.start_datetime, b.end_datetime)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => <StatusBadge status={b.status} />,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/40 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="max-w-sm text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((c) => (
              <TableHead key={c.key}>{c.header}</TableHead>
            ))}
            {extraActions && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false}>
            {bookings.map((b) => (
              <motion.tr
                key={b.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                onClick={() => onRowClick?.(b)}
                className="cursor-pointer border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted"
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render(b)}
                  </TableCell>
                ))}
                {extraActions && (
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      {extraActions(b)}
                    </div>
                  </TableCell>
                )}
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
