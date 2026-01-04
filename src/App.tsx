import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientPortal from "./pages/ClientPortal";
import TeamDashboard from "./pages/TeamDashboard";
import Clients from "./pages/Clients";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import Kanban from "./pages/Kanban";
import Documents from "./pages/Documents";
import Designs from "./pages/Designs";
import DevHub from "./pages/DevHub";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Departments from "./pages/Departments";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client-portal"
              element={
                <ProtectedRoute>
                  <ClientPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-dashboard"
              element={
                <ProtectedRoute>
                  <TeamDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Team />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kanban/:projectId"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Kanban />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/designs"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Designs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dev-hub"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DevHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments/:department"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DepartmentDashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PWAInstallPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
