import { ApprovalDashboard } from "@/components/ApprovalDashboard";

export default function HodHistory() {
  return (
    <ApprovalDashboard
      pendingStatus="PENDING_HOD"
      pendingTitle="Pending"
      historyTitle="My History"
    />
  );
}
