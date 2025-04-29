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
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/download" component={DownloadCenter} />
      <Route path="/circulation" component={CirculationDocuments} />
      <Route path="/storage" component={PersonalStorage} />
      <Route path="/admin/documents" component={AdminDocuments} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainLayout>
        <Router />
      </MainLayout>
    </AuthProvider>
  );
}

export default App;
