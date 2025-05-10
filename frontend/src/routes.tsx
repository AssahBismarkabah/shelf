import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ViewPDF from "./pages/ViewPDF";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Subscription from '@/pages/Subscription';
import Payment from '@/pages/Payment';
import MainLayout from "./components/layouts/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient();

export default function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="shelf-theme">
        <TooltipProvider>
          <Sonner />
          <Routes>
            <Route path="/" element={<MainLayout><Index /></MainLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <MainLayout><Dashboard /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/view/:id" 
              element={
                <ProtectedRoute>
                  <MainLayout><ViewPDF /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <MainLayout><Subscription /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute>
                  <MainLayout><Payment /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} 