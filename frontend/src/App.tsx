import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoutes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import FacultyDashboard from "./pages/dashboard/FacultyDashboard";
import NewBooking from "./pages/dashboard/NewBooking";
import HodDashboard from "./pages/dashboard/HodDashboard";
import HodHistory from "./pages/dashboard/HodHistory";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminRooms from "./pages/dashboard/AdminRooms";
import AdminAllBookings from "./pages/dashboard/AdminAllBookings";
import DeanDashboard from "./pages/dashboard/DeanDashboard";
import DeanAnalytics from "./pages/dashboard/DeanAnalytics";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors closeButton duration={4000} />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              <Route path="/dashboard/faculty" element={
                <ProtectedRoute allowedRoles={["faculty"]}><FacultyDashboard /></ProtectedRoute>
              } />
              <Route path="/dashboard/faculty/new" element={
                <ProtectedRoute allowedRoles={["faculty"]}><NewBooking /></ProtectedRoute>
              } />

              <Route path="/dashboard/hod" element={
                <ProtectedRoute allowedRoles={["hod"]}><HodDashboard /></ProtectedRoute>
              } />
              <Route path="/dashboard/hod/history" element={
                <ProtectedRoute allowedRoles={["hod"]}><HodHistory /></ProtectedRoute>
              } />

              <Route path="/dashboard/admin" element={
                <ProtectedRoute allowedRoles={["admin_assistant"]}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/dashboard/admin/rooms" element={
                <ProtectedRoute allowedRoles={["admin_assistant"]}><AdminRooms /></ProtectedRoute>
              } />
              <Route path="/dashboard/admin/all" element={
                <ProtectedRoute allowedRoles={["admin_assistant"]}><AdminAllBookings /></ProtectedRoute>
              } />

              <Route path="/dashboard/dean" element={
                <ProtectedRoute allowedRoles={["dean"]}><DeanDashboard /></ProtectedRoute>
              } />
              <Route path="/dashboard/dean/analytics" element={
                <ProtectedRoute allowedRoles={["dean"]}><DeanAnalytics /></ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
