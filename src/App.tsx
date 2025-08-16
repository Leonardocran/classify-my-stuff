import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { AppProvider } from "./contexts/AppContext";
import { AppLayout } from "./components/layout/AppLayout";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import StatsPage from "./pages/StatsPage";
import HistoryPage from "./pages/HistoryPage";
import AccountPage from "./pages/AccountPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<UploadPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

