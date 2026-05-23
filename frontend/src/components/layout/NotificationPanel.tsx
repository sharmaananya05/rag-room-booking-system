import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  CircleAlert,
  Inbox,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/jwt";
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
} from "@/hooks/useNotification";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

function iconForType(type?: string) {
  switch (type) {
    case "success":
      return Check;
    case "warning":
      return AlertTriangle;
    case "error":
      return CircleAlert;
    default:
      return Info;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: Props) {
  const { data, isLoading } = useNotifications(open);
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    /* keep lint quiet */
  }, [data]);

  const items = data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center justify-between border-b px-5 py-4 space-y-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Notifications
          </SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || items.every((i) => i.is_read)}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="divide-y">
            {isLoading && (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {!isLoading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">You're all caught up</p>
                <p className="text-xs text-muted-foreground">
                  New notifications will appear here.
                </p>
              </div>
            )}

            {!isLoading &&
              items.map((n) => {
                const Icon = iconForType(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markOne.mutate(n.id);
                      onOpenChange(false);
                      if (n.booking_id) {
                        const base = dashboardPathForRole(role || undefined);
                        navigate(`${base}?booking=${n.booking_id}`);
                      }
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40",
                      !n.is_read &&
                        "border-l-2 border-accent bg-accent-soft/40",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        n.type === "success" && "bg-success/15 text-success",
                        n.type === "warning" && "bg-warning/15 text-warning",
                        n.type === "error" &&
                          "bg-destructive/15 text-destructive",
                        (!n.type || n.type === "info") &&
                          "bg-info/15 text-info",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
