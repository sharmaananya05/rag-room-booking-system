import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import type { NotificationItem } from "@/types/booking";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function useNotifications(enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    enabled: enabled && isAuthenticated,
    queryFn: async () => {
      const res = await api.get("/notifications");
      const data = res.data?.data ?? res.data ?? [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 15_000,
  });
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery<number>({
    queryKey: ["notifications", "unread-count"],
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        const v = res.data?.count ?? res.data?.unread ?? res.data?.data?.count;
        if (typeof v === "number") return v;
      } catch {
        // fall back to listing
      }
      try {
        const res = await api.get("/notifications");
        const list: NotificationItem[] = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list.filter((n) => !n.is_read).length : 0;
      } catch {
        return 0;
      }
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(extractApiError(e, "Could not mark as read")),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch(`/notifications/read-all`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not mark all as read")),
  });
}
