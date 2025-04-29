import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import DownloadCenter from "@/pages/DownloadCenter";
import CirculationDocuments from "@/pages/CirculationDocuments";
import PersonalStorage from "@/pages/PersonalStorage";
import AdminDocuments from "@/pages/AdminDocuments";
import AdminUsers from "@/pages/AdminUsers";
import AdminSettings from "@/pages/AdminSettings";
import AuthPage from "@/pages/auth-page";
import InstallPage from "@/pages/install-page";
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/download" component={DownloadCenter} />
      <ProtectedRoute path="/circulation" component={CirculationDocuments} />
      <ProtectedRoute path="/storage" component={PersonalStorage} />
      <ProtectedRoute path="/admin/documents" component={AdminDocuments} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/install" component={InstallPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MainLayout>
            <Router />
          </MainLayout>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
