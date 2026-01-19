import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Categories from "./pages/Categories";
import InventoryAdd from "./pages/InventoryAdd";
import InventoryList from "./pages/InventoryList";
import Sales from "./pages/Sales";
import ProfitSimulator from "./pages/ProfitSimulator";
import Auth from "./pages/Auth";
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
              path="/*"
              element={
                <ProtectedRoute>
                  <AppProvider>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/inventory/add" element={<InventoryAdd />} />
                        <Route path="/inventory" element={<InventoryList />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/simulate" element={<ProfitSimulator />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </AppProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
