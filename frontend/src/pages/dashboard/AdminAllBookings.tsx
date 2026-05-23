import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingsTable } from "@/components/BookingsTable";
import { BookingDrawer } from "@/components/BookingDrawer";
import { useBookings } from "@/hooks/useBookings";
import type { Booking, BookingStatus } from "@/types/booking";

const STATUSES: (BookingStatus | "ALL")[] = [
  "ALL", "PENDING_HOD", "PENDING_ADMIN", "PENDING_DEAN",
  "DEAN_APPROVED", "HOD_REJECTED", "ADMIN_REJECTED", "DEAN_REJECTED", "CANCELLED",
];

export default function AdminAllBookings() {
  const { data, isLoading } = useBookings({ scope: "all" });
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (status !== "ALL") list = list.filter((b) => b.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.reference.toLowerCase().includes(q) ||
        b.purpose.toLowerCase().includes(q) ||
        (b.requester?.name || b.requester_name || "").toLowerCase().includes(q) ||
        (b.room?.room_number || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, status, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search reference, purpose, requester, room…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus | "ALL")}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "ALL" ? "All statuses" : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <BookingsTable
        bookings={filtered}
        isLoading={isLoading}
        showRequester
        onRowClick={(b) => setSelected(b)}
        emptyTitle="No bookings match"
        emptyMessage="Try a different search or status filter."
      />

      <BookingDrawer booking={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
