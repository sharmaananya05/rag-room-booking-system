export type Role = "faculty" | "hod" | "admin_assistant" | "dean";

export interface JwtPayload {
  sub?: string;
  user_id?: string | number;
  email?: string;
  name?: string;
  role?: Role;
  exp?: number;
  [k: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
  } catch {
    return null;
  }
}

export function dashboardPathForRole(role?: Role): string {
  switch (role) {
    case "faculty": return "/dashboard/faculty";
    case "hod": return "/dashboard/hod";
    case "admin_assistant": return "/dashboard/admin";
    case "dean": return "/dashboard/dean";
    default: return "/login";
  }
}

export function roleLabel(role?: Role): string {
  switch (role) {
    case "faculty": return "Faculty";
    case "hod": return "Head of Department";
    case "admin_assistant": return "Admin Assistant";
    case "dean": return "Dean";
    default: return "User";
  }
}
