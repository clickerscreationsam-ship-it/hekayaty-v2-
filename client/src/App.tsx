import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Loading component
const PageLoading = () => (
  <div className="flex h-[80vh] w-full items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
  </div>
);

// Lazy Page Imports
const Home = lazy(() => import("@/pages/Home"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Writers = lazy(() => import("@/pages/Writers"));
const WriterStore = lazy(() => import("@/pages/WriterStore"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const WriterStudio = lazy(() => import("@/pages/WriterStudio"));
const MakerOrders = lazy(() => import("@/pages/creator/MakerOrders"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const Cart = lazy(() => import("@/pages/Cart"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const ProductDetails = lazy(() => import("@/pages/ProductDetails"));
const CollectionDetails = lazy(() => import("@/pages/CollectionDetails"));
const ReadBook = lazy(() => import("@/pages/ReadBook"));
const Legal = lazy(() => import("@/pages/Legal"));
const HekayatyGuide = lazy(() => import("@/pages/HekayatyGuide"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/assets" component={Marketplace} />
        <Route path="/merchandise" component={Marketplace} />
        <Route path="/worldbuilders" component={Writers} />
        <Route path="/writer/:username" component={WriterStore} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/studio" component={WriterStudio} />
        <Route path="/studio/:id" component={WriterStudio} />
        <Route path="/maker-orders" component={MakerOrders} />
        <Route path="/orders" component={OrderTracking} />
        <Route path="/cart" component={Cart} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/book/:id" component={ProductDetails} />
        <Route path="/collection/:id" component={CollectionDetails} />
        <Route path="/read/:id" component={ReadBook} />
        <Route path="/legal" component={Legal} />
        <Route path="/guide" component={HekayatyGuide} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { useEffect } from "react";
import "./lib/i18n"; // Import i18n configuration
import { useTranslation } from "react-i18next";

import { GlobalChat } from "@/components/GlobalChat";

function AppContent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    if (i18n.language === 'ar') {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }
  }, [i18n.language]);

  // Handle Chunk Load Errors (New Version Updates)
  useEffect(() => {
    const handleChunkError = (e: any) => {
      const message = e.message || (e.reason && e.reason.message);
      const isChunkError =
        message?.includes("Failed to fetch dynamically imported module") ||
        message?.includes("Importing a module script failed") ||
        message?.includes("Loading chunk");

      if (isChunkError) {
        console.warn("New version detected or connection interrupted. Refreshing for latest site...");
        window.location.reload();
      }
    };

    window.addEventListener("error", handleChunkError, true);
    window.addEventListener("unhandledrejection", handleChunkError);
    window.addEventListener("vite:preloadError", handleChunkError);

    return () => {
      window.removeEventListener("error", handleChunkError, true);
      window.removeEventListener("unhandledrejection", handleChunkError);
      window.removeEventListener("vite:preloadError", handleChunkError);
    };
  }, []);

  return (
    <>
      <Router />
      <GlobalChat />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
