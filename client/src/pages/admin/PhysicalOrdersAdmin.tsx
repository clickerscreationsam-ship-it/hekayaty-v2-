import { useState } from "react";
import { useMakerOrders, type MakerOrder } from "@/hooks/use-physical-orders";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FulfillmentStatusBadge } from "@/components/FulfillmentStatusBadge";
import { Search, Package, MapPin, User, Store, Truck, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function PhysicalOrdersAdmin() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const { data: orders = [], isLoading } = useMakerOrders(statusFilter);

    const filteredOrders = orders.filter((o: any) =>
        o.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.makerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.orderId.toString().includes(searchTerm)
    );

    const statusOptions = ['All', 'pending', 'accepted', 'preparing', 'shipped', 'delivered', 'rejected'];

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('admin.physicalOrders.searchPlaceholder')}
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map(status => (
                        <Button
                            key={status}
                            variant={statusFilter === (status === 'All' ? undefined : status) ? 'default' : 'outline'}
                            onClick={() => setStatusFilter(status === 'All' ? undefined : status)}
                            size="sm"
                            className="h-8 text-xs px-3"
                        >
                            {status === 'All' ? t('makerOrders.filterAll') : t(`orderTracking.statuses.${status}`)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                        <p className="text-muted-foreground font-medium">{t('admin.physicalOrders.noResultsFound')}</p>
                    </div>
                ) : (
                    filteredOrders.map((order: any) => (
                        <Card key={order.orderItemId} className="glass-card p-0 overflow-hidden border border-white/10 hover:border-primary/30 transition-all group">
                            <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono">#{order.orderId}</Badge>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                        {formatDate(order.orderDate)}
                                    </span>
                                </div>
                                <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                            </div>

                            <div className="p-6 flex flex-col md:flex-row gap-8">
                                <div className="flex gap-6 flex-1">
                                    <img src={order.productCoverUrl} className="w-24 h-32 object-cover rounded-xl shadow-2xl transition-transform group-hover:scale-105" />
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-xl text-gradient">{order.productTitle}</h3>
                                        <div className="flex flex-col gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-blue-400 font-medium">
                                                <User className="w-4 h-4" />
                                                {t('admin.physicalOrders.buyer')} <span className="text-foreground">{order.buyerName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-orange-400 font-medium">
                                                <Store className="w-4 h-4" />
                                                {t('admin.physicalOrders.seller')} <span className="text-foreground">{order.makerName}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="secondary" className="bg-primary/20 text-primary border border-primary/20 font-black">
                                                {order.price} {t('common.egp')}
                                            </Badge>
                                            {order.trackingNumber && (
                                                <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-mono">
                                                    <Truck className="w-3 h-3 mr-1" />
                                                    {order.trackingNumber}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:w-72 border-l border-white/10 md:pl-8 space-y-4">
                                    <div className="flex items-start gap-2">
                                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="text-xs leading-relaxed">
                                            <p className="font-bold text-foreground mb-1">{t('admin.physicalOrders.shippingDestination')}</p>
                                            <p className="font-medium text-primary/80">{order.shippingAddress?.fullName}</p>
                                            <p className="text-muted-foreground italic">"{order.shippingAddress?.addressLine}"</p>
                                            <p className="text-muted-foreground">{order.shippingAddress?.city}</p>
                                            <p className="text-primary mt-2 font-mono font-bold tracking-tighter">{order.shippingAddress?.phoneNumber}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 mt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary/50 uppercase tracking-widest mb-2">
                                            <Info className="w-3 h-3" />
                                            {t('admin.physicalOrders.trackingLogistics')}
                                        </div>
                                        {order.fulfillmentStatus === 'shipped' ? (
                                            <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                                                <p className="text-[10px] text-green-500 font-bold">{t('orderTracking.statuses.shipped')}: {formatDate(order.shippedAt)}</p>
                                            </div>
                                        ) : order.fulfillmentStatus === 'rejected' ? (
                                            <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
                                                <p className="text-[10px] text-destructive font-bold">{t('orderTracking.statuses.rejected').toUpperCase()}: {order.rejectionReason}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground italic">{t('admin.physicalOrders.waitingCreator')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
