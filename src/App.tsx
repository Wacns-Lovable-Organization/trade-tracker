import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ViewAsProvider } from "@/contexts/ViewAsContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RTLProvider } from "@/components/RTLProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeatureGate } from "@/components/FeatureGate";
import { AppLayout } from "@/components/layout/AppLayout";
import { ViewAsBanner } from "@/components/admin/ViewAsBanner";
import { SkipLinks } from "@/components/SkipLinks";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Categories from "./pages/Categories";
import InventoryAdd from "./pages/InventoryAdd";
import InventoryList from "./pages/InventoryList";
import Sales from "./pages/Sales";
import ProfitSimulator from "./pages/ProfitSimulator";
import AdminPanel from "./pages/AdminPanel";
import Suppliers from "./pages/Suppliers";
import Buyers from "./pages/Buyers";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get GA measurement ID from environment or leave empty
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Component to track page analytics
function PageAnalyticsTracker() {
  usePageAnalytics();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <RTLProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
            <SkipLinks />
            <AuthProvider>
              <PageAnalyticsTracker />
              <ViewAsProvider>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/install" element={<Install />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppProvider>
                          <ViewAsBanner />
                          <AppLayout>
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/categories" element={<Categories />} />
                              <Route path="/inventory/add" element={<InventoryAdd />} />
                              <Route path="/inventory" element={<InventoryList />} />
                              <Route path="/sales" element={<Sales />} />
                              <Route path="/simulate" element={
                                <FeatureGate featureKey="profit_simulator">
                                  <ProfitSimulator />
                                </FeatureGate>
                              } />
                              <Route path="/admin" element={<AdminPanel />} />
                              <Route path="/suppliers" element={
                                <FeatureGate featureKey="suppliers_management">
                                  <Suppliers />
                                </FeatureGate>
                              } />
                              <Route path="/buyers" element={
                                <FeatureGate featureKey="buyers_management">
                                  <Buyers />
                                </FeatureGate>
                              } />
                              <Route path="/expenses" element={
                                <FeatureGate featureKey="expense_tracking">
                                  <Expenses />
                                </FeatureGate>
                              } />
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </AppLayout>
                        </AppProvider>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ViewAsProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </RTLProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
