import { Badge } from "@/components/ui/badge";
import { statusMeta } from "@/lib/booking-utils";
import type { BookingStatus } from "@/types/booking";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const meta = statusMeta[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", meta.className, className)}
    >
      {meta.label}
    </Badge>
  );
}
