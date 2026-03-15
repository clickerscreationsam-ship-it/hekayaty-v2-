import { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useDownloadFile } from "@/hooks/use-products";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Package, DollarSign, Eye, BarChart, Settings, Palette, Image as ImageIcon, BookOpen, Wallet, TrendingUp, History, ArrowUpRight, ShoppingBag, Download, Loader2, Truck, PenTool, ChevronLeft, UserCog, CheckCircle2, Layout, MessageSquare, Megaphone, Send, Pin, MessageCircle, Music, Headphones } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link, useLocation } from "wouter";
import { useEarnings, usePayouts, useRequestPayout } from "@/hooks/use-earnings";
import { formatDate, cn, optimizeImage } from "@/lib/utils";
import { useUserOrders } from "@/hooks/use-orders";
import { useAdminPrivateMessages, useSendAdminPrivateMessage, useMarkMessageRead, useAdminAnnouncements } from "@/hooks/use-admin-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import { useDesignRequests } from "@/hooks/use-commissions";

// Lazy-loaded heavy components for "rocket" performance
const ShippingSettings = lazy(() => import("@/components/dashboard/ShippingSettings").then(m => ({ default: m.ShippingSettings })));
const SellerOrders = lazy(() => import("@/components/dashboard/SellerOrders").then(m => ({ default: m.SellerOrders })));
const DashboardChat = lazy(() => import("@/components/dashboard/DashboardChat").then(m => ({ default: m.DashboardChat })));
const MakerOrders = lazy(() => import("@/pages/creator/MakerOrders"));
const PortfolioManager = lazy(() => import("@/components/creative-hub/PortfolioManager").then(m => ({ default: m.PortfolioManager })));
const CommissionsManager = lazy(() => import("@/components/creative-hub/CommissionsManager").then(m => ({ default: m.CommissionsManager })));
const PrivateChatManager = lazy(() => import("@/components/creative-hub/PrivateChatManager").then(m => ({ default: m.PrivateChatManager })));
const CreateProductDialog = lazy(() => import("@/components/dashboard/CreateProductDialog").then(m => ({ default: m.CreateProductDialog })));
const AudiobookUpload = lazy(() => import("@/components/ui/audiobook-upload").then(m => ({ default: m.AudiobookUpload })));
const AudiobookPlayer = lazy(() => import("@/components/ui/audiobook-player").then(m => ({ default: m.AudiobookPlayer })));
const CloudinaryGalleryUpload = lazy(() => import("@/components/ui/cloudinary-gallery-upload").then(m => ({ default: m.CloudinaryGalleryUpload })));

// Instant Skeleton State
const DashboardSkeleton = () => <PageSkeleton />;

import dashboardBg from "@/assets/9814ae82-9631-4241-a961-7aec31f9aa4d_09-11-19.png";

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: products, isLoading: isProductsLoading } = useProducts({ writerId: user?.id });
  const deleteProduct = useDeleteProduct();
  const earnings = useEarnings(user);
  const { data: payouts } = usePayouts();
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get('tab') || (user?.role === 'reader' ? 'library' : 'overview');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [window.location.search]);

  const { data: adminMessages } = useAdminPrivateMessages();
  const unreadCount = adminMessages?.filter(m => !m.isRead && m.receiverId === user?.id).length || 0;


  // Auto-refresh earnings when user is loaded
  useEffect(() => {
    if (user?.id && earnings.refetch) {
      console.log("🔄 Dashboard: Forcing earnings refetch...");
      earnings.refetch();
    }
  }, [user?.id]);

  // Calculate Metrics
  // Memoize Metrics for zero-lag re-renders
  const metrics = useMemo(() => {
    return {
      totalItemsSold: Number(earnings.totalUnitsSold) || 0,
      totalGrossRevenue: Number(earnings.totalGross) || 0,
      netEarnings: Number(earnings.totalEarnings) || 0,
      availableBalance: Number(earnings.currentBalance) || 0,
      totalCommission: Number(earnings.totalCommission) || 0
    };
  }, [earnings.totalUnitsSold, earnings.totalGross, earnings.totalEarnings, earnings.currentBalance, earnings.totalCommission]);

  const { totalItemsSold, totalGrossRevenue, netEarnings, availableBalance, totalCommission } = metrics;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen relative">
        <Navbar />
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />

      {/* Fixed Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat gpu will-change-transform"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-[1px] md:backdrop-blur-[2px] gpu will-change-transform" />

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">{user.role === 'reader' ? t("nav.profile") : t("dashboard.title")}</h1>
            <p className="text-muted-foreground">
              {user.role === 'reader' ? t("dashboard.reader_subtitle") : t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            {user.role !== 'reader' && (
              <Button onClick={() => setIsPayoutOpen(true)} variant="outline" className="gap-2">
                <Wallet className="w-4 h-4" /> {t("dashboard.tabs.wallet")}
              </Button>
            )}
            {user.role !== 'reader' && (
              <Suspense fallback={<Skeleton className="h-10 w-32 rounded-xl" />}>
                <CreateProductDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
              </Suspense>
            )}
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full relative z-10"
        >
          <div className="w-full overflow-x-auto pb-2 -mb-2 custom-scrollbar">
            <TabsList className="mb-8 p-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl justify-start h-auto w-full md:w-auto inline-flex min-w-full md:min-w-0 gap-1">
              {user.role === 'reader' && (
                <TabsTrigger value="library" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <BookOpen className="w-4 h-4" /> {t("dashboard.tabs.library")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="overview" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <Layout className="w-4 h-4" /> {t("dashboard.tabs.overview")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="products" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <Package className="w-4 h-4" /> {t("dashboard.tabs.products")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="orders" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <ShoppingBag className="w-4 h-4" /> {t("dashboard.tabs.orders")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="wallet" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <Wallet className="w-4 h-4" /> {t("dashboard.tabs.wallet")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="shipping" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <Truck className="w-4 h-4" /> {t("dashboard.tabs.shipping")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="chat" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <MessageSquare className="w-4 h-4" /> {t("dashboard.tabs.chat")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="private_messages" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <MessageCircle className="w-4 h-4" /> {t("dashboard.tabs.private_messages")}
                </TabsTrigger>
              )}

              {user.role === 'artist' && (
                <TabsTrigger value="portfolio" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2">
                  <ImageIcon className="w-4 h-4" /> {t("dashboard.tabs.portfolio") || "Portfolio"}
                </TabsTrigger>
              )}
              {(user.role === 'artist' || user.role === 'reader') && (
                <TabsTrigger value="commissions" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2 relative">
                  <PenTool className="w-4 h-4" /> {t("dashboard.tabs.commissions")}
                </TabsTrigger>
              )}
              {user.role !== 'reader' && (
                <TabsTrigger value="admin_messages" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2 relative">
                  <Megaphone className="w-4 h-4" /> {t("dashboard.tabs.admin_messages")}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="branding" className="rounded-lg px-6 py-2 flex-shrink-0 gap-2 font-bold">
                <Settings className="w-4 h-4" /> {user.role === 'reader' ? t("dashboard.tabs.profile_settings") : t("dashboard.tabs.branding")}
              </TabsTrigger>
            </TabsList>
          </div>


          {user.role !== 'reader' && (
            <TabsContent value="overview">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <StatCard
                  icon={Package}
                  label={t("dashboard.stats.totalProducts")}
                  value={products?.length || 0}
                  color="text-blue-500"
                  bg="bg-blue-500/10"
                />
                <StatCard
                  icon={ShoppingBag}
                  label={t("dashboard.stats.totalUnitsSold")}
                  value={totalItemsSold}
                  color="text-purple-500"
                  bg="bg-purple-500/10"
                />
                <StatCard
                  icon={DollarSign}
                  label={t("dashboard.stats.grossSales")}
                  value={`${totalGrossRevenue} ${t("common.egp")}`}
                  color="text-green-500"
                  bg="bg-green-500/10"
                />
                <StatCard
                  icon={Wallet}
                  label={t("dashboard.stats.netEarnings")}
                  value={`${netEarnings} ${t("common.egp")}`}
                  color="text-emerald-600"
                  bg="bg-emerald-500/10"
                />
              </div>

              {/* Earnings Section for Creators */}
              <div className="glass-card rounded-2xl p-8 border border-border mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Wallet className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t("dashboard.financial")}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <p className="text-sm font-medium">{t("dashboard.stats.lifetimeEarnings")}</p>
                    </div>
                    <p className="text-3xl font-bold font-serif">{earnings.totalEarnings} {t("common.egp")}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t("dashboard.stats.lifetimeEarnings_desc")}</p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{t("dashboard.stats.availableBalance")}</p>
                    <p className="text-3xl font-bold font-serif">{earnings.currentBalance} {t("common.egp")}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t("dashboard.stats.availableBalance_desc")}</p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">{t("dashboard.stats.platformFees")}</p>
                    <p className="text-3xl font-bold font-serif text-muted-foreground">{totalCommission} {t("common.egp")}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t("dashboard.stats.platformFees_desc")}</p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>{t("dashboard.stats.platformEconomics")}</strong>
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="portfolio">
            <div className="glass-card rounded-2xl p-8 border border-border">
              <Suspense fallback={<DashboardSkeleton />}>
                <PortfolioManager artistId={user.id} />
              </Suspense>
            </div>
          </TabsContent>

          {user.role === 'reader' ? (
            <TabsContent value="commissions" className="space-y-8">
              <ReaderUnifiedActivity user={user} />
            </TabsContent>
          ) : (
            <TabsContent value="commissions">
              <Suspense fallback={<DashboardSkeleton />}>
                <CommissionsManager user={user} />
              </Suspense>
            </TabsContent>
          )}

          <TabsContent value="orders">
            <div className="glass-card rounded-2xl p-1 border border-border">
              <Suspense fallback={<DashboardSkeleton />}>
                <MakerOrders />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="wallet">
            <div className="grid gap-6">
              <div className="glass-card rounded-2xl p-6 border border-border flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold font-serif mb-1">{t("dashboard.wallet.title")}</h2>
                  <p className="text-muted-foreground">{t("dashboard.wallet.subtitle")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">{t("dashboard.wallet.balance")}</p>
                  <p className="text-4xl font-bold font-serif text-primary">{earnings.currentBalance} {t("common.egp")}</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-0 border border-white/10 overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-6 bg-white/5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-gradient">{t("dashboard.wallet.payoutHistory")}</h3>
                  </div>
                  <Button onClick={() => setIsPayoutOpen(true)} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                    <ArrowUpRight className="w-4 h-4 mr-2" /> {t("dashboard.wallet.requestPayout")}
                  </Button>
                </div>

                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">{t("orderTracking.date")}</TableHead>
                      <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">{t("orderTracking.total")}</TableHead>
                      <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">{t("dashboard.wallet.payoutMethod")}</TableHead>
                      <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">{t("orderTracking.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.payoutHistory?.map((payout: any) => (
                      <TableRow key={payout.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="py-4 font-medium opacity-80">{formatDate(payout.requested_at)}</TableCell>
                        <TableCell className="py-4 font-black text-primary">{payout.amount} <span className="text-[10px]">EGP</span></TableCell>
                        <TableCell className="py-4 capitalize opacity-70">{payout.method?.replace('_', ' ')}</TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant={payout.status === 'processed' ? 'default' : 'secondary'}
                            className={cn(
                              "font-bold uppercase tracking-tighter text-[10px]",
                              payout.status === 'processed' ? 'bg-green-500/20 text-green-500 border border-green-500/20 hover:bg-green-500/30' : 'bg-white/5 border border-white/10 text-muted-foreground'
                            )}
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!earnings.payoutHistory || earnings.payoutHistory.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                          <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                          <p className="font-medium text-lg">{t("dashboard.wallet.noPayouts")}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="glass-card rounded-2xl p-0 border border-white/10 overflow-hidden shadow-2xl mt-4">
                <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="text-xl font-bold text-gradient">{t("dashboard.wallet.recent")}</h3>
                </div>
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">{t("orderTracking.date")}</TableHead>
                      <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">{t("orderTracking.orderId")}</TableHead>
                      <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">{t("orderTracking.total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.recentEarnings?.map((earning: any) => (
                      <TableRow key={earning.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="py-4 font-medium opacity-80">{formatDate(earning.created_at)}</TableCell>
                        <TableCell className="py-4 text-xs font-mono font-bold text-primary/60">#{earning.order_id}</TableCell>
                        <TableCell className="py-4 font-black text-green-500">+{earning.amount} <span className="text-[10px]">EGP</span></TableCell>
                      </TableRow>
                    ))}
                    {(!earnings.recentEarnings || earnings.recentEarnings.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                          <Wallet className="w-12 h-12 mx-auto mb-4 opacity-10" />
                          <p className="font-medium text-lg">{t("dashboard.wallet.noRecent")}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          <ReaderLibraryContent user={user} />

          <TabsContent value="products">
            <div className="glass-card rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-6">{t("dashboard.products.title")}</h2>

              {isProductsLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {products?.map(product => (
                    <div key={product.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border gpu">
                      <img
                        src={optimizeImage(product.coverUrl, 200)}
                        alt={product.title}
                        className="w-16 h-24 object-cover rounded-md shadow-sm"
                        loading="lazy"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-bold font-serif">{product.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {product.type} • {product.genre} {product.type !== 'promotional' && `• ${product.price} EGP`}
                        </p>
                        {product.type === 'asset' && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {product.licenseType}
                          </span>
                        )}
                        {product.salePrice && (
                          <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                            ON SALE: {product.salePrice} EGP
                          </span>
                        )}
                      </div>
                      {product.type !== 'promotional' && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BarChart className="w-4 h-4" />
                            {((product as any).salesCount || (product as any).sales_count || 0)} {t("dashboard.products.sold")}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-green-600">
                            <DollarSign className="w-4 h-4" />
                            {(product.price * ((product as any).salesCount || (product as any).sales_count || 0))} {t("common.egp")} {t("dashboard.products.revenue")}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {((product as any).salesCount || (product as any).sales_count || 0) > 0 ? (
                          <div title={t("dashboard.products.cannotDeletePurchased") || "You cannot delete this product because it has already been purchased."}>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="opacity-20 cursor-not-allowed"
                              disabled
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (confirm(t("dashboard.products.deleteConfirm"))) {
                                deleteProduct.mutate(product.id);
                              }
                            }}
                            disabled={deleteProduct.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!products || products.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground">
                      {t("dashboard.products.noProducts")}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <CreateProductDialog
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              product={editingProduct}
              mode="edit"
            />
          </TabsContent>

          <TabsContent value="shipping">
            <div className="glass-card rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-6 h-6 text-amber-500" />
                <div>
                  <h2 className="text-xl font-bold">{t("dashboard.shipping.title")}</h2>
                  <p className="text-muted-foreground text-sm">{t("dashboard.shipping.subtitle")}</p>
                </div>
              </div>
              <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
                {user && <ShippingSettings userId={user.id} />}
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardChat />
            </Suspense>
          </TabsContent>

          <TabsContent value="private_messages">
            <Suspense fallback={<DashboardSkeleton />}>
              <PrivateChatManager />
            </Suspense>
          </TabsContent>

          <AdminMessagingTab />

          <TabsContent value="branding">
            {user && (
              <>
                {/* Welcome message for new users */}
                {user.role !== 'reader' && (
                  <div className="glass-card rounded-2xl p-6 border border-primary/20 mb-6 bg-gradient-to-r from-primary/5 to-accent/5">
                    <h3 className="text-xl font-bold mb-2">{t("dashboard.welcome_creator")}</h3>
                    <p className="text-muted-foreground">
                      {t("dashboard.welcome_creator_desc")}
                    </p>
                  </div>
                )}
                {user.role === 'reader' && (
                  <div className="glass-card rounded-2xl p-6 border border-primary/20 mb-6 bg-gradient-to-r from-primary/5 to-accent/5">
                    <h3 className="text-xl font-bold mb-2">{t("dashboard.welcome_reader")}</h3>
                    <p className="text-muted-foreground">
                      {t("dashboard.welcome_reader_desc")}
                    </p>
                  </div>
                )}
                <BrandingForm user={user} />
              </>
            )}
          </TabsContent>
        </Tabs>

        <CreatePayoutDialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen} balance={earnings.currentBalance} />

        {editingProduct && (
          <CreateProductDialog
            open={isEditOpen}
            onOpenChange={(v) => {
              setIsEditOpen(v);
              if (!v) setEditingProduct(null);
            }}
            product={editingProduct}
            mode="edit"
          />
        )}
      </div>
    </div >
  );
}

function CreatePayoutDialog({ open, onOpenChange, balance }: { open: boolean; onOpenChange: (v: boolean) => void, balance: number }) {
  const { t } = useTranslation();
  const requestPayout = useRequestPayout();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('vodafone_cash');
  const [methodDetails, setMethodDetails] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError(t("dashboard.wallet.errors.invalidAmount"));
      return;
    }
    if (val > balance) {
      setError(t("dashboard.wallet.errors.insufficient"));
      return;
    }
    if (val < 200) {
      setError(t("dashboard.wallet.errors.minimum"));
      return;
    }
    if (!methodDetails) {
      setError(t("dashboard.wallet.errors.noDetails"));
      return;
    }

    requestPayout.mutate({
      amount: val,
      method,
      methodDetails
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setAmount('');
        setMethodDetails('');
        setError(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{t("dashboard.wallet.requestPayout")}</DialogTitle>
          <div className="text-sm text-muted-foreground pb-2">
            {t("dashboard.wallet.payoutNote")}
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground">{t("dashboard.wallet.balance")}</p>
              <p className="text-3xl font-bold font-serif text-primary">{balance} {t("common.egp")}</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">{t("dashboard.wallet.amount_egp")}</label>
            <Input
              type="number"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder={t("dashboard.wallet.min_payout_placeholder")}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">{t("dashboard.wallet.payoutMethod")}</label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder={t("dashboard.wallet.payoutMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vodafone_cash">{t("dashboard.wallet.methods.vodafoneCash")}</SelectItem>
                <SelectItem value="instapay">{t("dashboard.wallet.methods.instapay")}</SelectItem>
                <SelectItem value="bank_transfer">{t("dashboard.wallet.methods.bankTransfer")}</SelectItem>
                <SelectItem value="orange_money">{t("dashboard.wallet.methods.orangeMoney")}</SelectItem>
                <SelectItem value="etisalat_cash">{t("dashboard.wallet.methods.etisalatCash")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">
              {method === 'instapay' ? t("dashboard.wallet.details.instapay") :
                method === 'bank_transfer' ? t("dashboard.wallet.details.bank") :
                  t("dashboard.wallet.details.phone")}
            </label>
            <Input
              value={methodDetails}
              onChange={(e) => {
                setMethodDetails(e.target.value);
                setError(null);
              }}
              placeholder={method === 'instapay' ? t("dashboard.wallet.details.instapayHint") : t("dashboard.wallet.details.placeholder")}
              className="h-12 rounded-xl"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={requestPayout.isPending} className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">
              {requestPayout.isPending ? t("common.processing") : t("dashboard.wallet.submitRequest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ... BrandingForm and StatCard components remain unchanged ...
// However, the `replace_file_content` checks exact matches. 
// I need to be careful. The instruction says "Add CreatePayoutDialog component", so I should append it or ensure I don't delete other components.
// The complexity of replacing a large file with chunks is high if I don't provide the whole file or very clean chunks.
// Given I have re-written the main component in the first chunk above, I need to make sure I include the rest of the file or use correct chunks.
// The above replacement content is NOT the full file. It stops before BrandingForm.
// I will use StartLine/EndLine to replace the Dashboard component entirely, but keep BrandingForm etc. if they are outside.
// In the original file, Dashboard ends at line 236. BrandingForm starts at 238.
// I can replace lines 1-236 with my new code.
// Wait, I messed up the imports in my thought process. I need to replace from line 1 to 236.
// And I need to append CreatePayoutDialog at the end of the file.



function BrandingForm({ user }: { user: any }) {
  const { t } = useTranslation();
  const updateUser = useUpdateUser();
  const [themeColor, setThemeColor] = useState(user.storeSettings?.themeColor || "#000000");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      displayName: user.displayName || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      bannerUrl: user.bannerUrl || "",
      role: user.role || "reader",
      storeSettings: {
        themeColor: user.storeSettings?.themeColor || "#000000",
        welcomeMessage: user.storeSettings?.welcomeMessage || "",
        font: user.storeSettings?.font || "serif",
        headerLayout: user.storeSettings?.headerLayout || "standard",
      }
    }
  });

  const onSubmit = (data: any) => {
    console.log("📤 Submitting form data:", data);
    updateUser.mutate(data);
  };

  return (
    <div className="glass-card rounded-2xl p-8 border border-border max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Palette className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">{user.role === 'reader' ? t("dashboard.branding.profileTitle") : t("dashboard.branding.title")}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Account Type (Read Only) */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
          <label className="text-sm font-bold flex items-center gap-2 mb-2 text-primary">
            <UserCog className="w-4 h-4" />
            {t("dashboard.branding.accountType")}
          </label>
          <div className="flex items-center gap-2 p-3 bg-background/50 border border-primary/10 rounded-lg">
            <span className="font-serif font-bold capitalize text-lg">{(t(`dashboard.branding.roles.${user.role}`) || user.role)}</span>
            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              {t("dashboard.branding.status_active")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("dashboard.branding.role_info")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("dashboard.branding.displayName")}</label>
            <Input {...register("displayName")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("dashboard.branding.themeColor")}</label>
            <div className="flex gap-2">
              <Input
                type="color"
                className="w-12 h-10 p-1 cursor-pointer"
                value={themeColor}
                onChange={(e) => {
                  setThemeColor(e.target.value);
                  setValue("storeSettings.themeColor", e.target.value);
                }}
              />
              <Input
                value={themeColor}
                onChange={(e) => {
                  setThemeColor(e.target.value);
                  setValue("storeSettings.themeColor", e.target.value);
                }}
                placeholder="#000000"
                className="font-mono uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("dashboard.branding.storeFont")}</label>
            <Select
              defaultValue={user.storeSettings?.font || "serif"}
              onValueChange={(val) => register("storeSettings.font").onChange({ target: { value: val } })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("dashboard.branding.select_font")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serif">{t("dashboard.branding.fonts.serif") || "Classic Serif (Merriweather)"}</SelectItem>
                <SelectItem value="sans">{t("dashboard.branding.fonts.sans") || "Modern Sans (Inter)"}</SelectItem>
                <SelectItem value="display">{t("dashboard.branding.fonts.display") || "Display (Cinzel)"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("dashboard.branding.headerLayout")}</label>
            <Select
              defaultValue={user.storeSettings?.headerLayout || "standard"}
              onValueChange={(val) => register("storeSettings.headerLayout").onChange({ target: { value: val } })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("dashboard.branding.select_layout")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">{t("dashboard.branding.layouts.standard")}</SelectItem>
                <SelectItem value="hero">{t("dashboard.branding.layouts.hero")}</SelectItem>
                <SelectItem value="minimal">{t("dashboard.branding.layouts.minimal")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("dashboard.branding.bio")}</label>
          <Textarea {...register("bio")} rows={4} placeholder={t("dashboard.branding.bioPlaceholder")} />
        </div>


        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t("dashboard.branding.images")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CloudinaryUpload
              label={t("dashboard.branding.avatarLabel")}
              aspectRatio="square"
              folder="hekayaty_avatars"
              onUpload={(url: string) => {
                setValue("avatarUrl", url);
                // Optional: trigger immediate save or visual update if needed
              }}
            />

            <CloudinaryUpload
              label={t("dashboard.branding.bannerLabel")}
              aspectRatio="banner"
              defaultImage={user.bannerUrl}
              folder="hekayaty_banners"
              onUpload={(url: string) => {
                setValue("bannerUrl", url);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.branding.imagesInfo")}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("dashboard.branding.welcomeMessage")}</label>
          <Input {...register("storeSettings.welcomeMessage")} placeholder={t("dashboard.branding.welcomePlaceholder")} />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={updateUser.isPending} className="px-8">
            {updateUser.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
      <div className={`p-4 rounded-xl ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold font-serif">{value}</p>
      </div>
    </div>
  );
}

function AdminMessagingTab() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: messages, isLoading: loadingMsgs } = useAdminPrivateMessages();
  const { data: announcements, isLoading: loadingAnns } = useAdminAnnouncements();
  const markRead = useMarkMessageRead();
  const sendMessage = useSendAdminPrivateMessage();

  const [reply, setReply] = useState("");

  const handleReply = () => {
    if (!reply || !user) return;
    // Find the admin ID (sender of the first message or any admin)
    // For now, we assume there's at least one admin who messaged
    const adminMsg = messages?.find(m => m.senderId !== user.id);
    const receiverId = adminMsg?.senderId;

    if (!receiverId) return;

    sendMessage.mutate({
      senderId: user.id,
      receiverId: receiverId,
      content: reply
    }, {
      onSuccess: () => setReply("")
    });
  };

  // Mark all unread messages as read when opening tab
  useEffect(() => {
    const unread = messages?.filter(m => !m.isRead && m.receiverId === user?.id);
    unread?.forEach(m => markRead.mutate(m.id));
  }, [messages?.length]);

  return (
    <TabsContent value="admin_messages">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Private Messages From Admin */}
        <Card className="glass-card border-primary/20 bg-black/60 shadow-2xl">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-primary">
              <MessageSquare className="w-5 h-5" />
              Direct Message from Admin
            </CardTitle>
            <CardDescription>Secure messages between you and the platform administration.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {loadingMsgs ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : messages?.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 italic">No messages from Admin yet.</p>
              ) : (
                messages?.map((msg: any) => (
                  <div key={msg.id} className={cn(
                    "p-4 rounded-2xl text-sm transition-all",
                    msg.senderId === user?.id
                      ? "bg-primary/10 border border-primary/20 ml-12"
                      : "bg-white/5 border border-white/10 mr-12"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs opacity-70">
                        {msg.senderId === user?.id ? "You" : "The Admin"}
                      </span>
                      <span className="text-[10px] opacity-40">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="text-white/90 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
              <Textarea
                placeholder="Reply to the admin..."
                className="bg-white/5 border-white/10 text-white min-h-[80px]"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button
                className="w-full gap-2 font-bold"
                disabled={!reply || sendMessage.isPending}
                onClick={handleReply}
              >
                <Send className="w-4 h-4" />
                {sendMessage.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Global Writer Announcements */}
        <Card className="glass-card border-accent/20 bg-black/60 shadow-2xl">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-accent">
              <Megaphone className="w-5 h-5" />
              Platform Announcements
            </CardTitle>
            <CardDescription>Important updates and news for creators.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingAnns ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : announcements?.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 italic">No announcements yet.</p>
              ) : (
                announcements?.map((ann: any) => (
                  <div key={ann.id} className={cn(
                    "p-5 rounded-2xl border transition-all",
                    ann.is_pinned ? "bg-primary/5 border-primary/30" : "bg-white/5 border-white/10"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      {ann.is_pinned && <Pin className="w-4 h-4 text-primary fill-primary/20" />}
                      <h3 className="font-bold text-lg text-gradient">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] opacity-40 uppercase tracking-widest">
                      <span>By Creator Relations Team</span>
                      <span>{formatDate(ann.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

function ReaderLibraryContent({ user }: { user: any }) {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useUserOrders();

  const purchasedItems = orders?.filter(o => o.isVerified).flatMap(order => order.order_items?.map((item: any) => {
    const product = item.product;
    const uniqueKey = product.type === 'collection' ? `col_${product.collectionId}` : `prod_${product.id}`;
    return {
      ...product,
      uniqueKey,
      addedAt: order.createdAt
    };
  }) || []) || [];

  const uniqueItems = Array.from(new Map(purchasedItems.map((item: any) => [item.uniqueKey, item])).values());

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading library...</div>;
  }

  return (
    <TabsContent value="library">
      <div className="glass-card rounded-2xl p-8 border border-border">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold font-serif mb-2">{t("dashboard.library.title")}</h2>
            <p className="text-muted-foreground">{t("dashboard.library.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/orders">
              <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                <Truck className="w-4 h-4" /> {t("dashboard.library.track_orders")}
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="gap-2">
                <ShoppingBag className="w-4 h-4" /> {t("dashboard.library.browse_store")}
              </Button>
            </Link>
          </div>
        </div>

        {uniqueItems.length === 0 ? (
          <div className="text-center py-20 rounded-xl bg-muted/20 border border-dashed border-border/50">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t("dashboard.library.empty")}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("dashboard.library.empty_desc")}
            </p>
            <Link href="/marketplace">
              <Button className="bg-primary hover:bg-primary/90">{t("dashboard.library.start_exploring")}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {uniqueItems.map((item: any) => (
              <div key={item.uniqueKey} className="group relative bg-background/50 rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300">
                <div className="aspect-[2/3] overflow-hidden bg-muted">
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    {item.type === 'ebook' ? (
                      <Link href={`/read/${item.id}`}>
                        <Button className="rounded-full bg-white text-black hover:bg-white/90 font-bold">
                          <BookOpen className="w-4 h-4 mr-2" /> {t("common.read")}
                        </Button>
                      </Link>
                    ) : item.type === 'audiobook' ? (
                      <div className="flex flex-col gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="rounded-full bg-white text-black hover:bg-white/90 font-bold">
                              <Headphones className="w-4 h-4 mr-2" /> {t("common.listen") || "Listen"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-black/95 border-white/10 backdrop-blur-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-serif text-white">{item.title}</DialogTitle>
                              <DialogDescription className="text-primary/60">
                                {t("library.now_playing") || "Now Playing from Library"}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 min-h-[150px] flex items-center justify-center">
                              <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
                                <AudiobookPlayer
                                  parts={item.audioParts?.length > 0 ? item.audioParts : [{ url: item.fileUrl, title: item.title, duration: item.audioDuration || 0 }]}
                                  title={item.title}
                                  coverUrl={item.coverUrl}
                                />
                              </Suspense>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <DownloadButton fileUrl={item.fileUrl} />
                      </div>
                    ) : item.type === 'collection' ? (
                      <Link href={`/collection/${item.collectionId}`}>
                        <Button className="rounded-full bg-white text-black hover:bg-white/90 font-bold">
                          <BookOpen className="w-4 h-4 mr-2" /> {t("common.view")}
                        </Button>
                      </Link>
                    ) : (
                      <DownloadButton fileUrl={item.fileUrl} />
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold font-serif line-clamp-1 mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{item.type} • {item.genre}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}

function ReaderUnifiedActivity({ user }: { user: any }) {
  const { t } = useTranslation();
  const { data: orders, isLoading: loadingOrders } = useUserOrders();
  const { data: commissionsResp, isLoading: loadingComms } = useDesignRequests({ clientId: user.id });

  if (loadingOrders || loadingComms) {
    return (
      <div className="p-20 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>Loading your activity...</p>
      </div>
    );
  }

  const commissions = commissionsResp?.data || [];
  const hasActivity = (orders && orders.length > 0) || commissions.length > 0;

  return (
    <div className="space-y-12">
      {/* 1. STORE ORDERS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold font-serif">{t("dashboard.activity.storeOrders")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.activity.storeOrdersDesc")}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl divide-y divide-white/5">
          {(!orders || orders.length === 0) ? (
            <div className="p-12 text-center text-muted-foreground bg-white/2">
              <p>No store orders yet.</p>
            </div>
          ) : (
            orders.map((order: any) => (
              <div key={order.id} className="p-6 hover:bg-white/3 transition-colors">
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary text-sm bg-primary/10 px-3 py-1 rounded">
                      ORDER #{order.id}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={cn(
                      "font-bold uppercase tracking-wider text-[10px] border px-3 py-1",
                      order.isVerified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {order.isVerified ? '✅ Payment Verified' : '⏳ Awaiting Approval'}
                    </Badge>
                    <span className="font-black text-xl text-primary">
                      {order.totalAmount} <span className="text-xs font-normal opacity-60">EGP</span>
                    </span>
                  </div>
                </div>

                {/* Items & "Bill" View */}
                <div className="grid gap-6">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-6 p-4 rounded-2xl bg-white/2 border border-white/5 relative group">
                      {/* Product Thumbnail */}
                      <div className="w-20 h-28 shrink-0">
                        {item.product?.coverUrl ? (
                          <img src={item.product.coverUrl} className="w-full h-full object-cover rounded-lg shadow-lg" />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-white/5 flex items-center justify-center"><Package className="opacity-20" /></div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-lg">{item.product?.title || 'Product'}</h4>
                          <Badge variant="outline" className={cn("text-[10px] font-bold", getFulfillmentColor(item.fulfillmentStatus))}>
                            {getFulfillmentLabel(item.fulfillmentStatus)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span className="text-primary font-bold">{item.price} EGP / unit</span>
                          {item.makerName && (
                            <span className="flex items-center gap-1"><UserCog className="w-3 h-3" /> Maker: {item.makerName}</span>
                          )}
                        </div>

                        {/* THE "BILL" / ACCEPTANCE BOX - Requested by user */}
                        {item.fulfillmentStatus !== 'pending' && (
                          <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5"><CheckCircle2 className="w-12 h-12" /></div>
                            <h5 className="text-xs font-bold uppercase text-green-500 tracking-widest">Official Order Bill & Status</h5>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Accepted Date</p>
                                <p className="text-sm font-semibold">{item.acceptedAt ? formatDate(item.acceptedAt) : 'Recently'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Arrival Estimation</p>
                                <p className="text-sm font-bold text-primary">
                                  {item.estimatedDeliveryDays ? `${item.estimatedDeliveryDays} Working Days` : 'TBD'}
                                </p>
                              </div>
                            </div>
                            {item.trackingNumber && (
                              <div className="pt-2 border-t border-green-500/10">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Carrier Tracking</p>
                                <p className="text-sm font-mono text-purple-400 font-bold">{item.trackingNumber}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {item.fulfillmentStatus === 'pending' && !order.isVerified && (
                          <p className="text-xs text-amber-400 italic mt-2">
                            Awaiting admin verification of your payment proof...
                          </p>
                        )}
                        {item.fulfillmentStatus === 'pending' && order.isVerified && (
                          <p className="text-xs text-blue-400 italic mt-2 animate-pulse">
                            Payment verified! Awaiting maker to accept and set delivery date...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 2. DESIGN REQUESTS (COMMISSIONS) SECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <PenTool className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-2xl font-bold font-serif">Design Treasure Requests</h3>
            <p className="text-sm text-muted-foreground">Custom design projects and commissions</p>
          </div>
        </div>
        <CommissionsManager user={user} />
      </section>
    </div>
  );
}

function getFulfillmentColor(status: string) {
  switch (status) {
    case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'preparing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
}

function getFulfillmentLabel(status: string) {
  switch (status) {
    case 'accepted': return 'Accepted';
    case 'preparing': return 'Preparing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'rejected': return 'Rejected';
    default: return 'Pending Review';
  }
}

function DownloadButton({ fileUrl }: { fileUrl: string | null | undefined }) {
  const { t } = useTranslation();
  const download = useDownloadFile();

  if (!fileUrl) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full bg-white/20 border-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
      onClick={() => download.mutate(fileUrl)}
      disabled={download.isPending}
    >
      {download.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {t("common.download")}
        </>
      )}
    </Button>
  );
}

