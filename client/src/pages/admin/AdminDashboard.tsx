import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ExternalLink, AlertTriangle, Users, Lock, Unlock, Loader2, Wallet, Truck, History, PenTool, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useAdminOrders, useVerifyOrder, useRejectOrder, useAdminSellers, useFreezeSeller, useAdminPayouts, useApprovePayout, useAdminPayoutHistory, useAdminOrderHistory } from "@/hooks/use-admin";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PhysicalOrdersAdmin } from "./PhysicalOrdersAdmin";
import { formatDate, cn } from "@/lib/utils";
import { useAdminPrivateMessages, useSendAdminPrivateMessage, useAdminAnnouncements, useCreateAdminAnnouncement, useDeleteAdminAnnouncement, useMarkMessageRead } from "@/hooks/use-admin-system";
import { MessageSquare, Send, Megaphone, Trash2, Pin } from "lucide-react";
import { useDesignRequests } from "@/hooks/use-commissions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CommissionThread } from "@/components/creative-hub/CommissionsManager";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


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

function MessagingAdmin({ sellers }: { sellers: any[] }) {
    const { data: messages } = useAdminPrivateMessages();
    const { data: announcements } = useAdminAnnouncements();
    const sendMessage = useSendAdminPrivateMessage();
    const createAnnouncement = useCreateAdminAnnouncement();
    const deleteAnnouncement = useDeleteAdminAnnouncement();
    const markRead = useMarkMessageRead();
    const { user } = useAuth();

    // Mark all unread messages as read when opening tab
    useEffect(() => {
        const unread = messages?.filter(m => !m.isRead && m.receiverId === user?.id);
        unread?.forEach(m => markRead.mutate(m.id));
    }, [messages?.length]);


    const [selectedSeller, setSelectedSeller] = useState<string>("");
    const [privateMsg, setPrivateMsg] = useState("");
    const [annTitle, setAnnTitle] = useState("");
    const [annContent, setAnnContent] = useState("");
    const [isPinned, setIsPinned] = useState(false);

    const handleSendPrivate = () => {
        if (!selectedSeller || !privateMsg || !user) return;
        sendMessage.mutate({
            senderId: user.id,
            receiverId: selectedSeller,
            content: privateMsg
        }, {
            onSuccess: () => {
                setPrivateMsg("");
            }
        });
    };

    const handleCreateAnn = () => {
        if (!annTitle || !annContent || !user) return;
        createAnnouncement.mutate({
            adminId: user.id,
            title: annTitle,
            content: annContent,
            isPinned
        }, {
            onSuccess: () => {
                setAnnTitle("");
                setAnnContent("");
                setIsPinned(false);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* Private Messages Section */}
            <Card className="glass-card border-primary/20 bg-black/60 shadow-2xl">
                <CardHeader className="bg-white/5 border-b border-white/5">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Direct Admin Messages
                    </CardTitle>
                    <CardDescription>Send private messages to specific writers.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white outline-none focus:border-primary/50"
                            value={selectedSeller}
                            onChange={(e) => setSelectedSeller(e.target.value)}
                        >
                            <option value="" className="bg-slate-900">Select a Writer...</option>
                            {sellers?.map((s: any) => (
                                <option key={s.id} value={s.id} className="bg-slate-900">{s.display_name} ({s.role})</option>
                            ))}
                        </select>
                        <Textarea
                            placeholder="Type your private message..."
                            className="bg-white/5 border-white/10 text-white min-h-[100px]"
                            value={privateMsg}
                            onChange={(e) => setPrivateMsg(e.target.value)}
                        />
                        <Button
                            className="w-full gap-2"
                            disabled={!selectedSeller || !privateMsg || sendMessage.isPending}
                            onClick={handleSendPrivate}
                        >
                            <Send className="w-4 h-4" />
                            {sendMessage.isPending ? "Sending..." : "Send Message"}
                        </Button>
                    </div>

                    <div className="mt-8 border-t border-white/5 pt-6">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Message History</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {messages?.map((msg: any) => (
                                <div key={msg.id} className={cn(
                                    "p-3 rounded-lg border text-sm",
                                    msg.senderId === user?.id
                                        ? "bg-primary/5 border-primary/20 ml-8"
                                        : "bg-white/5 border-white/10 mr-8"
                                )}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-xs text-primary/80">
                                            {msg.senderId === user?.id ? "Admin (You)" : msg.sender?.display_name} → {msg.receiver?.display_name}
                                        </span>
                                        <span className="text-[10px] opacity-40">{formatDate(msg.createdAt)}</span>
                                    </div>
                                    <p className="text-white/90">{msg.content}</p>
                                    {msg.isRead && msg.senderId === user?.id && (
                                        <div className="text-[9px] text-green-500 mt-1 flex justify-end">Seen</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Global Announcements Section */}
            <Card className="glass-card border-accent/20 bg-black/60 shadow-2xl">
                <CardHeader className="bg-white/5 border-b border-white/5">
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-accent" />
                        Writers Announcements
                    </CardTitle>
                    <CardDescription>Broadcast messages to ALL writers and artists.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <Input
                            placeholder="Announcement Title"
                            className="bg-white/5 border-white/10 text-white"
                            value={annTitle}
                            onChange={(e) => setAnnTitle(e.target.value)}
                        />
                        <Textarea
                            placeholder="Announcement content..."
                            className="bg-white/5 border-white/10 text-white min-h-[100px]"
                            value={annContent}
                            onChange={(e) => setAnnContent(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="pin"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="accent-primary"
                            />
                            <label htmlFor="pin" className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer">
                                <Pin className="w-3 h-3" /> Pin this announcement
                            </label>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full gap-2 border border-accent/20"
                            disabled={!annTitle || !annContent || createAnnouncement.isPending}
                            onClick={handleCreateAnn}
                        >
                            <Megaphone className="w-4 h-4" />
                            {createAnnouncement.isPending ? "Publishing..." : "Broadcast to Writers"}
                        </Button>
                    </div>

                    <div className="mt-8 border-t border-white/5 pt-6">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Past Announcements</h4>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {announcements?.map((ann: any) => (
                                <div key={ann.id} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {ann.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                                            <h5 className="font-bold text-sm text-foreground">{ann.title}</h5>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                if (confirm("Delete this announcement?")) deleteAnnouncement.mutate(ann.id);
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                                    <div className="mt-3 flex justify-between items-center text-[10px] opacity-40">
                                        <span>By {ann.admin?.display_name || "Admin"}</span>
                                        <span>{formatDate(ann.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CommissionsAdmin({ requestsResponse, isLoading }: { requestsResponse: any, isLoading: boolean }) {
    const [page, setPage] = useState(1);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const { user } = useAuth();

    return (
        <Card className="glass-card border-primary/20 bg-black/60 shadow-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white/5 border-b border-white/5">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-2xl text-gradient">Design Commissions</CardTitle>
                            {(requestsResponse?.data?.filter((r: any) => r.status === 'payment_under_review')?.length || 0) > 0 && (
                                <Badge className="bg-amber-600 text-white animate-pulse">
                                    {requestsResponse.data.filter((r: any) => r.status === 'payment_under_review').length} Pending Reviews
                                </Badge>
                            )}
                        </div>
                        <CardDescription>Monitor all active design requests and collaborations.</CardDescription>
                    </div>
                    <PenTool className="w-8 h-8 text-primary/40" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Artist</TableHead>
                                <TableHead>Budget</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requestsResponse?.data?.map((req: any) => (
                                <TableRow key={req.id} className={req.status === 'payment_under_review' ? 'bg-primary/5' : ''}>
                                    <TableCell className="font-bold">
                                        <div className="flex items-center gap-2">
                                            {req.title}
                                            {req.status === 'payment_under_review' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                        </div>
                                    </TableCell>
                                    <TableCell>{req.client?.display_name}</TableCell>
                                    <TableCell>{req.artist?.display_name}</TableCell>
                                    <TableCell className="font-bold text-primary">{req.budget} EGP</TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'payment_under_review' ? 'default' : 'outline'} className="capitalize">
                                            {req.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant={req.status === 'payment_under_review' ? 'default' : 'ghost'} className="gap-2" onClick={() => setSelectedRequestId(req.id)}>
                                            <MessageSquare className="w-4 h-4" /> {req.status === 'payment_under_review' ? 'Review Payment' : 'View Chat'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={!!selectedRequestId} onOpenChange={() => setSelectedRequestId(null)}>
                <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
                    {selectedRequestId && user && <CommissionThread requestId={selectedRequestId} user={user} />}
                </DialogContent>
            </Dialog>
        </Card>
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

    const { data: adminMessages } = useAdminPrivateMessages();
    const unreadCount = adminMessages?.filter(m => !m.isRead && m.receiverId === user?.id).length || 0;

    const [commissionPage, setCommissionPage] = useState(1);
    const { data: requestsResponse, isLoading: commissionsLoading } = useDesignRequests({ page: commissionPage });

    const searchParams = new URLSearchParams(window.location.search);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [window.location.search]);


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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        <TabsTrigger value="messaging" className="gap-2 relative">
                            <MessageSquare className="w-4 h-4" />
                            Messaging
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background">
                                    {unreadCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="commissions" className="gap-2 relative">
                            <PenTool className="w-4 h-4" /> Design Commissions
                            {requestsResponse?.data?.some((r: any) => r.status === 'payment_under_review') && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="w-4 h-4" /> Global History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="commissions">
                        <CommissionsAdmin requestsResponse={requestsResponse} isLoading={commissionsLoading} />
                    </TabsContent>

                    <TabsContent value="messaging">
                        <MessagingAdmin sellers={sellers || []} />
                    </TabsContent>

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
                                                <TableHead className="text-primary/70 font-bold uppercase text-xs tracking-wider py-4">Type</TableHead>
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
                                                        {order.shipping_address ? (
                                                            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1.5 font-bold text-[10px] uppercase">
                                                                <Truck className="w-3 h-3" /> Physical
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold text-[10px] uppercase">
                                                                <CreditCard className="w-3 h-3" /> Digital
                                                            </Badge>
                                                        )}
                                                    </TableCell>
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
