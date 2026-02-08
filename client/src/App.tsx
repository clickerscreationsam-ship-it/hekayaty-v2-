import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Marketplace from "@/pages/Marketplace";
import WriterStore from "@/pages/WriterStore";
import Dashboard from "@/pages/Dashboard";
import ProductDetails from "@/pages/ProductDetails";
import ReadBook from "@/pages/ReadBook";
import Cart from "@/pages/Cart";
import AuthPage from "@/pages/AuthPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import MakerOrders from "@/pages/creator/MakerOrders";
import OrderTracking from "@/pages/OrderTracking";
import WriterStudio from "@/pages/WriterStudio";

import Writers from "@/pages/Writers";
import Legal from "@/pages/Legal";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import HekayatyGuide from "@/pages/HekayatyGuide";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/assets" component={Marketplace} />
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
      <Route path="/read/:id" component={ReadBook} />
      <Route path="/legal" component={Legal} />
      <Route path="/guide" component={HekayatyGuide} />
      <Route component={NotFound} />
    </Switch>
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
