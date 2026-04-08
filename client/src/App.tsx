import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import EmailAutomation from "./pages/EmailAutomation";
import Communications from "./pages/Communications";
import Docs from "./pages/Docs";
import Settings from "./pages/Settings";
import Schedule from "./pages/Schedule";
import Invoices from "./pages/Invoices";
import CustomerPortal from "./pages/CustomerPortal";

function Router() {
  return (
    <Switch>
      {/* Public portal route — no auth, no sidebar */}
      <Route path="/portal/:token" component={CustomerPortal} />
      {/* Admin dashboard routes */}
      <Route>
        <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/leads" component={Leads} />
        <Route path="/leads/:id" component={LeadDetail} />
        <Route path="/email-automation" component={EmailAutomation} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/communications" component={Communications} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/docs" component={Docs} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <BrandingProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BrandingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
