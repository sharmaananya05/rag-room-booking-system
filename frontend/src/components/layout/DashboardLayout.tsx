/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Building2, LayoutDashboard, LogOut, Menu, PlusCircle,
  ListChecks, History, DoorOpen, BarChart3, ClipboardList, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { roleLabel, type Role } from "@/lib/jwt";
import { NotificationsPanel } from "./NotificationPanel";
import { useUnreadCount } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; }

const navByRole: Record<Role, { items: NavItem[]; pageTitleByPath: Record<string, string> }> = {
  faculty: {
    items: [
      { to: "/dashboard/faculty", label: "My Bookings", icon: ListChecks },
      { to: "/dashboard/faculty/new", label: "New Booking", icon: PlusCircle },
    ],
    pageTitleByPath: {
      "/dashboard/faculty": "Faculty Dashboard",
      "/dashboard/faculty/new": "New Booking",
    },
  },
  hod: {
    items: [
      { to: "/dashboard/hod", label: "Pending Approvals", icon: Inbox },
      { to: "/dashboard/hod/history", label: "History", icon: History },
    ],
    pageTitleByPath: {
      "/dashboard/hod": "HOD Approvals",
      "/dashboard/hod/history": "Approval History",
    },
  },
  admin_assistant: {
    items: [
      { to: "/dashboard/admin", label: "Pending Approvals", icon: Inbox },
      { to: "/dashboard/admin/rooms", label: "Rooms", icon: DoorOpen },
      { to: "/dashboard/admin/all", label: "All Bookings", icon: ClipboardList },
    ],
    pageTitleByPath: {
      "/dashboard/admin": "Admin Approvals",
      "/dashboard/admin/rooms": "Manage Rooms",
      "/dashboard/admin/all": "All Bookings",
    },
  },
  dean: {
    items: [
      { to: "/dashboard/dean", label: "Pending Approvals", icon: Inbox },
      { to: "/dashboard/dean/analytics", label: "Analytics", icon: BarChart3 },
    ],
    pageTitleByPath: {
      "/dashboard/dean": "Dean Approvals",
      "/dashboard/dean/analytics": "Analytics",
    },
  },
};

function initials(name?: string, email?: string): string {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

interface NavListProps { items: NavItem[]; onNavigate?: () => void; }
function NavList({ items, onNavigate }: NavListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const Icon = it.icon;
        const active = location.pathname === it.to;
        return (
          <button
            key={it.to}
            onClick={() => { navigate(it.to); onNavigate?.(); }}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-sidebar-primary" />}
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();

  if (!role) return null;
  const cfg = navByRole[role as Role];
  const title = cfg.pageTitleByPath[location.pathname] || "Dashboard";

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-gradient text-accent-foreground">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">Room Booking</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{roleLabel(role)}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavList items={cfg.items} onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-app-gradient">
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 border-r border-sidebar-border">
          {sidebar}
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 border-0">
            {sidebar}
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top navbar */}
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">{title}</h1>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" onClick={() => setNotifOpen(true)}>
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground animate-pop">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent-gradient text-accent-foreground text-xs font-semibold">
                          {initials(user?.name as string | undefined, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start leading-tight">
                        <span className="text-sm font-medium">{(user?.name as string) || user?.email || "User"}</span>
                        <span className="text-[11px] text-muted-foreground">{roleLabel(role)}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex flex-col">
                      <span className="text-sm">{(user?.name as string) || user?.email || "User"}</span>
                      <Badge variant="secondary" className="mt-1 w-fit">{roleLabel(role)}</Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main content with route transition */}
          <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                {children ?? <Outlet />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile bottom tab bar */}
          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
              {cfg.items.map((it: any) => {
                const Icon = it.icon;
                const active = location.pathname === it.to;
                return (
                  <button
                    key={it.to}
                    onClick={() => navigate(it.to)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] transition-colors",
                      active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate">{it.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </div>
  );
}
