
/**
 * Main Application Component
 * 
 * This is the root component of our chat application. It sets up all the necessary
 * providers and routing for the entire app.
 * 
 * Key Providers:
 * - QueryClientProvider: Manages server state and caching for API requests
 * - TooltipProvider: Enables tooltips throughout the app
 * - AuthProvider: Manages user authentication state
 * - BrowserRouter: Enables client-side routing
 * 
 * Routes:
 * - "/" : Main chat interface (Index page)
 * - "/auth" : Authentication page (login/signup)
 * - "*" : Catch-all route for 404 pages
 */

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Create a query client for managing server state and caching
// This helps with API request management and reduces unnecessary network calls
const queryClient = new QueryClient();

/**
 * App Component
 * 
 * Sets up the entire application with all necessary providers and routing.
 * The order of providers matters - inner components can access outer provider contexts.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Toast notifications for user feedback */}
      <Toaster />
      <Sonner />
      
      {/* Authentication context provides user login state throughout the app */}
      <AuthProvider>
        {/* Router enables navigation between different pages */}
        <BrowserRouter>
          <Routes>
            {/* Main chat interface */}
            <Route path="/" element={<Index />} />
            
            {/* User authentication (login/signup) */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Catch-all route for any undefined paths (404 page) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
