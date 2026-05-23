import { useMemo } from "react";
import { CalendarCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useBookings } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { BookingStatus } from "@/types/booking";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DeanAnalytics() {
  const { data, isLoading } = useBookings({ scope: "all" });

  const stats = useMemo(() => {
    const list = data ?? [];
    const now = new Date();
    const thisMonthApproved = list.filter((b) => {
      if (b.status !== "DEAN_APPROVED") return false;
      const d = new Date(b.created_at || b.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return {
      total: list.length,
      approvedThisMonth: thisMonthApproved,
      pending: list.filter(b => b.status.startsWith("PENDING_")).length,
      rejected: list.filter(b => b.status.endsWith("REJECTED")).length,
    };
  }, [data]);

  const monthly = useMemo(() => {
    const year = new Date().getFullYear();
    const buckets = MONTHS.map((m) => ({ month: m, bookings: 0 }));
    (data ?? []).forEach((b) => {
      const d = new Date(b.created_at || b.date);
      if (d.getFullYear() === year) buckets[d.getMonth()].bookings += 1;
    });
    return buckets;
  }, [data]);

  const byStatus = useMemo(() => {
    const map = new Map<BookingStatus, number>();
    (data ?? []).forEach((b) => map.set(b.status, (map.get(b.status) || 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ name: status, value: count }));
  }, [data]);

  const PIE_COLORS = ["#F59E0B", "#3B82F6", "#A855F7", "#22C55E", "#EF4444", "#EF4444", "#EF4444", "#94A3B8"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Bookings" value={stats.total} icon={CalendarCheck} />
        <StatCard label="Approved this month" value={stats.approvedThisMonth} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass border-border/60 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Bookings per month · {new Date().getFullYear()}</CardTitle></CardHeader>
          <CardContent className="h-72">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="bookings" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader><CardTitle className="text-base">By status</CardTitle></CardHeader>
          <CardContent className="h-72">
            {isLoading ? <Skeleton className="h-full w-full" /> : byStatus.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
