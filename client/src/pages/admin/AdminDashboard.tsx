import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ExternalLink, AlertTriangle, Users, Lock, Unlock, Loader2, Wallet, Truck, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useAdminOrders, useVerifyOrder, useRejectOrder, useAdminSellers, useFreezeSeller, useAdminPayouts, useApprovePayout, useAdminPayoutHistory, useAdminOrderHistory } from "@/hooks/use-admin";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PhysicalOrdersAdmin } from "./PhysicalOrdersAdmin";
import { formatDate, cn } from "@/lib/utils";


function PayoutsAdmin() {
    const { data: payouts, isLoading } = useAdminPayouts();
    const approvePayout = useApprovePayout();

    return (
        <Card className="glass-card border-primary/20 bg-black/60 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl text-gradient">Payout Requests</CardTitle>
                        <CardDescription>Review and process payout requests from creators.</CardDescription>
                    </div>
                    <Wallet className="w-8 h-8 text-primary/40" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {(!payouts || payouts.length === 0) ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-primary/40" />
                        </div>
                        <p className="text-lg font-medium">Clear Skies!</p>
                        <p className="text-sm">No pending payout requests.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/10">
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Creator</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Amount</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Method</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Details</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Requested Date</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payouts.map((payout: any) => (
                                <TableRow key={payout.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{payout.user?.display_name || 'N/A'}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{payout.user?.email || payout.user_id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 font-black text-lg text-primary">{payout.amount} <span className="text-xs">EGP</span></TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="outline" className="capitalize border-primary/30 text-primary bg-primary/5">
                                            {payout.method?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 font-mono text-xs opacity-70">{payout.method_details}</TableCell>
                                    <TableCell className="py-4 text-sm font-medium">
                                        {formatDate(payout.requested_at)}
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10 h-9"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to REJECT this payout request?'))
                                                        approvePayout.mutate({ payoutId: payout.id, status: 'rejected' });
                                                }}
                                                disabled={approvePayout.isPending}
                                            >
                                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-primary hover:bg-primary/80 text-primary-foreground h-9 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                                                onClick={() => {
                                                    if (confirm('Confirm that you have transferred the money to the creator?'))
                                                        approvePayout.mutate({ payoutId: payout.id, status: 'processed' });
                                                }}
                                                disabled={approvePayout.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                                {approvePayout.isPending ? 'Processing...' : 'Approve'}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function AdminHistory() {
    const { data: payoutHistory, isLoading: payoutsLoading } = useAdminPayoutHistory();
    const { data: orderHistory, isLoading: ordersLoading } = useAdminOrderHistory();

    if (payoutsLoading || ordersLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

    return (
        <div className="space-y-10">
            <Card className="glass-card border-white/10 bg-black/40 shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient">Payout History</CardTitle>
                            <CardDescription>All processed or rejected payout requests.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Creator</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Amount</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Status</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Requested Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payoutHistory?.map((payout: any) => (
                                <TableRow key={payout.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{payout.user?.display_name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{payout.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 font-black text-primary text-lg">{payout.amount} <span className="text-xs">EGP</span></TableCell>
                                    <TableCell className="py-4">
                                        <Badge
                                            variant={payout.status === 'processed' ? 'default' : 'destructive'}
                                            className={cn(
                                                "font-bold uppercase tracking-tighter text-[10px]",
                                                payout.status === 'processed' ? "bg-green-500/20 text-green-500 border border-green-500/20" : "bg-destructive/20 text-destructive border border-destructive/20"
                                            )}
                                        >
                                            {payout.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm font-medium opacity-80">
                                        {formatDate(payout.requested_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="glass-card border-white/10 bg-black/40 shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient">Order History</CardTitle>
                            <CardDescription>All verified or rejected order payments.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Order ID</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">User</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Amount</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Status</TableHead>
                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderHistory?.map((order: any) => (
                                <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="py-4 font-mono text-sm font-bold text-primary/60">#{order.id}</TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{order.user?.display_name || 'Guest'}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{order.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 font-black text-primary text-lg">{order.total_amount} <span className="text-xs">EGP</span></TableCell>
                                    <TableCell className="py-4">
                                        <Badge
                                            variant={order.status === 'paid' ? 'default' : 'destructive'}
                                            className={cn(
                                                "font-bold uppercase tracking-tighter text-[10px]",
                                                order.status === 'paid' ? "bg-green-600/20 text-green-500 border border-green-500/20" : "bg-destructive/20 text-destructive border border-destructive/20"
                                            )}
                                        >
                                            {order.status === 'paid' ? 'Verified' : order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm font-medium opacity-80">
                                        {formatDate(order.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminDashboard() {

    const { user, isLoading: authLoading } = useAuth();

    // Orders Hooks
    const { data: pendingOrders, isLoading: ordersLoading } = useAdminOrders();
    const verifyOrder = useVerifyOrder();
    const rejectOrder = useRejectOrder();

    // Sellers Hooks
    const { data: sellers, isLoading: sellersLoading } = useAdminSellers();
    const freezeSeller = useFreezeSeller();

    if (authLoading || ordersLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        if (user?.role !== 'admin') return <Redirect to="/" />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="flex-1 container mx-auto px-4 py-8 pt-32">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-serif">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage platform orders and sellers.</p>
                    </div>
                </div>

                <Tabs defaultValue="orders" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="orders" className="gap-2">
                            <AlertTriangle className="w-4 h-4" /> Pending Orders
                        </TabsTrigger>
                        <TabsTrigger value="sellers" className="gap-2">
                            <Users className="w-4 h-4" /> Manage Sellers
                        </TabsTrigger>
                        <TabsTrigger value="payouts" className="gap-2">
                            <Wallet className="w-4 h-4" /> Payout Requests
                        </TabsTrigger>
                        <TabsTrigger value="physical" className="gap-2">
                            <Truck className="w-4 h-4" /> Physical Shipments
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="w-4 h-4" /> Global History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="payouts">
                        <PayoutsAdmin />
                    </TabsContent>

                    <TabsContent value="physical">
                        <PhysicalOrdersAdmin />
                    </TabsContent>

                    <TabsContent value="history">
                        <AdminHistory />
                    </TabsContent>

                    <TabsContent value="orders">
                        <Card className="glass-card border-primary/20 bg-black/60 shadow-2xl overflow-hidden mt-6">
                            <CardHeader className="bg-white/5 border-b border-white/5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-2xl text-gradient">Pending Local Payments</CardTitle>
                                        <CardDescription>Run through the list of orders awaiting verification.</CardDescription>
                                    </div>
                                    <AlertTriangle className="w-8 h-8 text-primary/40" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {(!pendingOrders || pendingOrders.length === 0) ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
                                        <p>No pending orders to verify.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/10 hover:bg-transparent">
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Order ID</TableHead>
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">User / Customer</TableHead>
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Amount</TableHead>
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Method</TableHead>
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Reference</TableHead>
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Proof</TableHead>
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Date</TableHead>
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingOrders.map((order: any) => (
                                                <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="py-4 font-mono font-bold text-primary/60">#{order.id}</TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="font-bold text-foreground text-sm">{order.user?.display_name || order.user_id}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4 font-black text-primary">{order.total_amount} <span className="text-[10px]">EGP</span></TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="outline" className="capitalize border-primary/30 text-primary bg-primary/5 font-bold text-[10px]">
                                                            {order.payment_method?.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 font-mono text-xs opacity-70">{order.payment_reference || 'N/A'}</TableCell>
                                                    <TableCell className="py-4">
                                                        {order.payment_proof_url ? (
                                                            <a
                                                                href={order.payment_proof_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 text-primary hover:text-primary/70 transition-colors text-xs font-bold"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" /> View
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter italic">No image</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-xs font-medium opacity-80">
                                                        {formatDate(order.created_at)}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-destructive hover:bg-destructive/10 h-8"
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to reject and cancel this order?'))
                                                                        rejectOrder.mutate(order.id);
                                                                }}
                                                                disabled={rejectOrder.isPending || verifyOrder.isPending}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-500 text-white h-8 font-bold shadow-lg shadow-green-500/20"
                                                                onClick={() => verifyOrder.mutate(order.id)}
                                                                disabled={verifyOrder.isPending || rejectOrder.isPending}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                                                {verifyOrder.isPending ? '...' : 'Approve'}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sellers">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Sellers</CardTitle>
                                <CardDescription>Manage writers and artists. Freeze accounts if needed.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sellersLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sellers?.map((seller: any) => (
                                                <TableRow key={seller.id} className={!seller.is_active ? 'bg-destructive/10' : ''}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                                                <img src={seller.avatar_url || `https://ui-avatars.com/api/?name=${seller.display_name}`} className="w-full h-full object-cover" alt="" />
                                                            </div>
                                                            <span className="font-medium">{seller.display_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="capitalize badge-cell">
                                                        <Badge variant="secondary">{seller.role}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{seller.email}</TableCell>
                                                    <TableCell>
                                                        {seller.is_active ? (
                                                            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                                                        ) : (
                                                            <Badge variant="destructive">Frozen</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant={seller.is_active ? "destructive" : "outline"}
                                                            className="gap-2"
                                                            onClick={() => freezeSeller.mutate({ userId: seller.id, isActive: !seller.is_active })}
                                                            disabled={freezeSeller.isPending}
                                                        >
                                                            {seller.is_active ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                            {seller.is_active ? "Freeze" : "Unfreeze"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!sellers || sellers.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        No sellers found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            <Footer />
        </div>
    );
}
