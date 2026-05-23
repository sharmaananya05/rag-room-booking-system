import { ApprovalDashboard } from "@/components/ApprovalDashboard";

export default function AdminDashboard() {
  return (
    <ApprovalDashboard
      pendingStatus="PENDING_ADMIN"
      pendingTitle="Pending Approvals"
    />
  );
}
