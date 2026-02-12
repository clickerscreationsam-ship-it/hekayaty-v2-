import { useState } from "react";
import { useDesignRequests, useUpdateRequestStatus, useSendDesignMessage, useDesignRequest, useArtistAnalytics } from "@/hooks/use-commissions";
import { User, DesignRequest, DesignMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MessageSquare, Clock, CheckCircle2, XCircle, Send, Paperclip, AlertCircle, DollarSign, BarChart3, TrendingUp, Trophy, Activity, PenTool, Download } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function CommissionsManager({ user }: { user: User }) {
    const { t } = useTranslation();
    const isArtist = user.role === 'artist';
    const [page, setPage] = useState(1);
    const { data: requestsResponse, isLoading } = useDesignRequests(isArtist ? { artistId: user.id, page } : { clientId: user.id, page });
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    if (isLoading) return <Loader2 className="w-8 h-8 animate-spin" />;

    return (
        <div className="space-y-6">
            {isArtist && <ArtistAnalytics />}

            <div>
                <h2 className="text-2xl font-bold font-serif">{t("commissions.title") || "My Commissions"}</h2>
                <p className="text-muted-foreground">{isArtist ? "Manage your incoming design requests." : "Track the progress of your ordered designs."}</p>
            </div>

            <div className="grid gap-4">
                {requestsResponse?.data?.map((req: any) => (
                    <Card key={req.id} className="glass-card border-white/10 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedRequestId(req.id)}>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10">
                                        <img src={(isArtist ? req.client?.avatar_url : req.artist?.avatar_url) || `https://ui-avatars.com/api/?name=${isArtist ? req.client?.display_name : req.artist?.display_name}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{req.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArtist ? "Client: " : "Artist: "}
                                            <span className="text-foreground">{isArtist ? req.client?.display_name : req.artist?.display_name}</span>
                                        </p>
                                        <div className="flex gap-4 mt-2">
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {formatDate(req.createdAt)}</span>
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-500"><DollarSign className="w-3 h-3" /> {req.budget} EGP</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col items-end justify-between gap-2">
                                    <Badge variant="outline" className={cn("px-3 py-1 font-bold", getStatusColor(req.status))}>
                                        {req.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    {req.escrowLocked && (
                                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20 font-bold">
                                            ESCROW SECURED
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {(!requestsResponse?.data || requestsResponse.data.length === 0) && (
                    <div className="py-20 text-center text-muted-foreground glass-card rounded-2xl border-dashed border-white/5 border-2">
                        <PenTool className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p>No commissions in progress. Time to start something new!</p>
                    </div>
                )}
            </div>

            {requestsResponse && requestsResponse.total > 10 && (
                <div className="flex justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >Previous</Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={requestsResponse.data.length < 10}
                    >Next</Button>
                </div>
            )}

            <Dialog open={!!selectedRequestId} onOpenChange={() => setSelectedRequestId(null)}>
                <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden">
                    {selectedRequestId && <CommissionThread requestId={selectedRequestId} user={user} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ArtistAnalytics() {
    const { data: stats, isLoading } = useArtistAnalytics();
    if (isLoading || !stats) return null;

    const cards = [
        { label: "Active Projects", val: stats.activeProject, icon: Activity, color: "text-blue-500" },
        { label: "Total Revenue", val: `${stats.revenue} EGP`, icon: TrendingUp, color: "text-green-500" },
        { label: "Completion Rate", val: `${stats.completionRate}%`, icon: Trophy, color: "text-amber-500" },
        { label: "Lifetime Orders", val: stats.totalCommissions, icon: BarChart3, color: "text-purple-500" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map(c => (
                <Card key={c.label} className="glass-card border-white/10">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <c.icon className={cn("w-6 h-6 mb-2", c.color)} />
                        <p className="text-secondary-foreground font-bold">{c.val}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{c.label}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function CommissionThread({ requestId, user }: { requestId: string, user: User }) {
    const { data: request, isLoading } = useDesignRequest(requestId);
    const updateStatus = useUpdateRequestStatus();
    const sendMessage = useSendDesignMessage();
    const [msg, setMsg] = useState("");
    const isArtist = user.id === request?.artistId;
    const isClient = user.id === request?.clientId;

    if (isLoading || !request) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;

    const handleSend = () => {
        if (!msg.trim()) return;
        sendMessage.mutate({ requestId, message: msg, senderId: user.id });
        setMsg("");
    };

    const [deliveryUrl, setDeliveryUrl] = useState("");
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);

    return (
        <>
            <DialogHeader className="p-6 border-b border-white/10 shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <DialogTitle className="text-xl">{request.title}</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{request.description}</p>
                        {request.finalFileUrl && (
                            <a
                                href={request.finalFileUrl}
                                target="_blank"
                                className="inline-flex items-center gap-2 text-xs text-primary hover:underline mt-2 bg-primary/10 px-2 py-1 rounded"
                            >
                                <Download className="w-3 h-3" /> Download Final Delivery
                            </a>
                        )}
                    </div>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20 custom-scrollbar">
                {request.messages?.map((m: any) => (
                    <div key={m.id} className={cn("flex gap-3 max-w-[80%]", m.senderId === user.id ? "ml-auto flex-row-reverse" : "")}>
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                            <img src={m.sender?.avatar_url || `https://ui-avatars.com/api/?name=${m.sender?.display_name}`} className="w-full h-full object-cover" />
                        </div>
                        <div className={cn("p-3 rounded-2xl text-sm", m.senderId === user.id ? "bg-primary text-white rounded-tr-none" : "bg-card border border-white/10 rounded-tl-none")}>
                            <p className="font-bold text-[10px] mb-1 opacity-70 uppercase tracking-tighter">{m.sender?.display_name}</p>
                            <p>{m.message}</p>
                            <p className="text-[10px] mt-1 opacity-40">{formatDate(m.createdAt)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-white/10 shrink-0 space-y-4">
                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                    {showDeliveryForm && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                            <h4 className="text-sm font-bold">Upload Final Delivery</h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Paste Final File URL (GDrive, Dropbox, etc)"
                                    value={deliveryUrl}
                                    onChange={e => setDeliveryUrl(e.target.value)}
                                />
                                <Button size="sm" onClick={() => updateStatus.mutate({ requestId, status: 'delivered', finalFileUrl: deliveryUrl })}>Deliver</Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowDeliveryForm(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {request.status === 'pending' && isArtist && (
                            <>
                                <Button size="sm" onClick={() => updateStatus.mutate({ requestId, status: 'accepted' })} disabled={updateStatus.isPending}>Accept & Secure Escrow</Button>
                                <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ requestId, status: 'rejected' })} disabled={updateStatus.isPending}>Reject</Button>
                            </>
                        )}
                        {request.status === 'accepted' && isArtist && (
                            <Button size="sm" onClick={() => updateStatus.mutate({ requestId, status: 'in_progress' })}>Start Working</Button>
                        )}
                        {request.status === 'in_progress' && isArtist && (
                            <Button size="sm" onClick={() => setShowDeliveryForm(true)}>Deliver Final Work</Button>
                        )}
                        {request.status === 'delivered' && isArtist && (
                            <p className="text-xs text-muted-foreground italic">Waiting for client approval...</p>
                        )}
                        {request.status === 'delivered' && isClient && (
                            <>
                                <Button size="sm" onClick={() => updateStatus.mutate({ requestId, status: 'completed' })} className="bg-green-600 hover:bg-green-700">Approve & Release Funds</Button>
                                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ requestId, status: 'in_progress' })}>Request Revision</Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Textarea
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[40px] max-h-[120px] resize-none"
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    />
                    <div className="flex flex-col gap-2">
                        <Button size="icon" className="shrink-0" onClick={handleSend} disabled={sendMessage.isPending || !msg.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="shrink-0">
                            <Paperclip className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'accepted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'in_progress': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'delivered': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
        case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'rejected':
        case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
}

