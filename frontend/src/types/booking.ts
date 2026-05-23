export type BookingStatus =
  | "pending_hod"
  | "pending_admin"
  | "pending_dean"
  | "dean_approved"
  | "hod_rejected"
  | "admin_rejected"
  | "dean_rejected"
  | "cancelled";

export interface UserLite {
  id: string;
  name: string;
  email?: string;
  role?: string;
  phone?: string;
}

export interface Room {
  id: string;
  room_number: string;
  name?: string;
  building?: string;
  floor?: string | number;
  capacity: number;
  facilities?: string[] | string;
  is_active?: boolean;
}

export interface ApprovalEntry {
  id: string;
  actor_name?: string;
  actor_role?: string;
  action: "APPROVED" | "REJECTED" | "SUBMITTED" | "CANCELLED";
  comments?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;

  // ✅ Relations
  room?: Room;
  requester?: UserLite;

  faculty_incharge?: UserLite;
  student_coordinator?: UserLite;
  faculty_supervisor?: UserLite;

  // Optional IDs
  room_id?: string;

  purpose: string;
  expected_attendees?: number;

  start_datetime: string;
  end_datetime: string;

  status: BookingStatus;

  approvals?: ApprovalEntry[];
  created_at?: string;
}


export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | string;
  is_read: boolean;
  booking_id?: string;
  created_at: string;
}


export interface BookingUI extends Booking {
  date: string;        
  time_range: string;  
}


export const mapBookingToUI = (booking: Booking): BookingUI => {
  const start = new Date(booking.start_datetime);
  const end = new Date(booking.end_datetime);

  const date = start.toISOString().split("T")[0];

  const time_range = `${start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return {
    ...booking,
    date,
    time_range,
  };
};