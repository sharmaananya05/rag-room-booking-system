import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import type { Booking, BookingStatus, Room, UserLite } from "@/types/booking";
import { toast } from "sonner";

interface BookingFilters {
  status?: BookingStatus | "ALL";
  search?: string;
  scope?: "mine" | "pending" | "all" | "history";
}

export function useBookings(filters: BookingFilters = {}) {
  return useQuery<Booking[]>({
    queryKey: ["bookings", filters],
    queryFn: async () => {
      const res = await api.get("/bookings", { params: filters });
      const data = res.data?.data ?? res.data ?? [];
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useRooms(activeOnly = false) {
  return useQuery<Room[]>({
    queryKey: ["rooms", { activeOnly }],
    queryFn: async () => {
      const res = await api.get("/rooms", { params: activeOnly ? { active: true } : {} });
      const data = res.data?.data ?? res.data ?? [];
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useUsersByRole(role: string) {
  return useQuery<UserLite[]>({
    queryKey: ["users-by-role", role],
    queryFn: async () => {
      console.log("Fetching users with role", role);
      const res = await api.get(`/users/by-role/${role}`);
      const data = res.data?.data ?? res.data ?? [];
      return Array.isArray(data) ? data : [];
    },
  });
}

export interface NewBookingPayload {
  room_id: string | number;

  requester_department_id: string;

  purpose: string;

  start_datetime: string;
  end_datetime: string;

  expected_attendees?: number;

  faculty_incharge_id: string | number;
  student_coordinator_id: string | number;
  faculty_supervisor_id: string | number;
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewBookingPayload) => {
      const res = await api.post("/bookings/", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useApproveBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comments }: { id: string | number; comments?: string }) => {
      const res = await api.post(`/approvals/${id}/`, { comments, action: "approved" });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Booking approved");
    },
    onError: (e) => toast.error(extractApiError(e, "Approval failed")),
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comments }: { id: string | number; comments?: string }) => {
      const res = await api.post(`/bookings/${id}/reject`, { comments, action: "rejected" });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Booking rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Rejection failed")),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Room>) => {
      const res = await api.post("/rooms", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room created");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not create room")),
  });
}

export function useToggleRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string | number; is_active: boolean }) => {
      const res = await api.patch(`/rooms/${id}`, { is_active });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
    onError: (e) => toast.error(extractApiError(e, "Could not update room")),
  });
}
