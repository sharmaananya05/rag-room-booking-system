/* eslint-disable react-hooks/set-state-in-effect */
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { BookingsTable } from "@/components/BookingsTable";
import { BookingDrawer } from "@/components/BookingDrawer";
import { useBookings } from "@/hooks/useBookings";
import type { Booking } from "@/types/booking";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { data: bookings, isLoading } = useBookings({ scope: "mine" });
  const [selected, setSelected] = useState<Booking | null>(null);
  const [params, setParams] = useSearchParams();

  const stats = useMemo(() => {
    const list = bookings ?? [];
    return {
      total: list.length,
      pending: list.filter((b) => b.status.startsWith("pending_")).length,
      approved: list.filter((b) => b.status === "dean_approved").length,
      rejected: list.filter((b) => b.status.endsWith("rejected")).length,
    };
  }, [bookings]);

  // open drawer if ?booking=ID
  useEffect(() => {
    const id = params.get("booking");
    if (!id || !bookings) return;
    const found = bookings.find((b) => String(b.id) === id);
    if (found) setSelected(found);
  }, [params, bookings]);

  console.log(bookings);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mine" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="mine">My Bookings</TabsTrigger>
            <TabsTrigger
              value="new"
              onClick={() => navigate("/dashboard/faculty/new")}
            >
              New Booking
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={() => navigate("/dashboard/faculty/new")}
            className="bg-accent-gradient text-accent-foreground hover:opacity-95"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> New booking
          </Button>
        </div>

        <TabsContent value="mine" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total" value={stats.total} icon={CalendarCheck} />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={XCircle}
              tone="destructive"
            />
          </div>

          <BookingsTable
            bookings={bookings}
            isLoading={isLoading}
            onRowClick={(b) => setSelected(b)}
            emptyTitle="No bookings yet"
            emptyMessage="You haven't booked any rooms. Create your first booking to get started."
          />
        </TabsContent>
      </Tabs>

      <BookingDrawer
        booking={selected}
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) {
            setSelected(null);
            params.delete("booking");
            setParams(params, { replace: true });
          }
        }}
      />
    </div>
  );
}
