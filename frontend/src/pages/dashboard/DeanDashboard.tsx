import { ApprovalDashboard } from "@/components/ApprovalDashboard";

export default function DeanDashboard() {
  return (
    <ApprovalDashboard
      pendingStatus="PENDING_DEAN"
      pendingTitle="Pending Approvals"
    />
  );
}
