import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "info" | "success" | "destructive" | "purple";
  className?: string;
}

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-accent-soft text-accent",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/15 text-destructive",
  purple: "bg-purple/15 text-purple",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  className,
}: Props) {
  return (
    <Card
      className={cn(
        "glass border-border/60 transition-transform hover:-translate-y-0.5 hover:shadow-elegant",
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            toneStyles[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
