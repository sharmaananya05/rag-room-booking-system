import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/jwt";

const Index = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPathForRole(role || undefined)} replace />;
};

export default Index;
