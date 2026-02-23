import { useNotifications } from "@/hooks/use-notifications";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import {
    Bell,
    Check,
    Trash2,
    ShoppingCart,
    UserPlus,
    TrendingUp,
    Trophy,
    MessageSquare,
    Inbox,
    Search,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
    const { notifications, isLoading, markRead, markAllRead, unreadCount } = useNotifications();
    const { t } = useTranslation();
    const [, setLocation] = useLocation();
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const getIcon = (type: string) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case 'commerce': return <ShoppingCart className={cn(iconClass, "text-blue-400")} />;
            case 'content': return <Inbox className={cn(iconClass, "text-purple-400")} />;
            case 'social': return <UserPlus className={cn(iconClass, "text-green-400")} />;
            case 'creator': return <TrendingUp className={cn(iconClass, "text-orange-400")} />;
            case 'engagement': return <Trophy className={cn(iconClass, "text-yellow-400")} />;
            case 'store': return <MessageSquare className={cn(iconClass, "text-pink-400")} />;
            default: return <Bell className={cn(iconClass, "text-gray-400")} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'commerce': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case 'social': return "bg-green-500/10 text-green-400 border-green-500/20";
            case 'store': return "bg-pink-500/10 text-pink-400 border-pink-500/20";
            case 'creator': return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            default: return "bg-primary/10 text-primary border-primary/20";
        }
    };

    const handleNotificationClick = (n: any) => {
        if (!n.isRead) markRead(n.id);
        if (n.link) setLocation(n.link);
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === "all" || n.type === filter || (filter === "unread" && !n.isRead);
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#0a0604] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Bell className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-4xl font-serif font-black text-white tracking-tight">
                                {t("notifications.title", "Notifications")}
                                {unreadCount > 0 && (
                                    <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary text-black">
                                        {unreadCount}
                                    </span>
                                )}
                            </h1>
                        </motion.div>
                        <p className="text-muted-foreground text-lg italic">
                            {t("notifications.subtitle", "Your portal to the world of Hekayaty")}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllRead()}
                            disabled={unreadCount === 0}
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            {t("notifications.markAllRead", "Mark all read")}
                        </Button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t("notifications.search", "Search notifications...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white h-11 focus:ring-primary/50"
                        />
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Filter by type" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a0f0a] border-white/10 text-white font-medium">
                            <SelectItem value="all">All notifications</SelectItem>
                            <SelectItem value="unread">Unread only</SelectItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <SelectItem value="commerce">Orders & Earnings</SelectItem>
                            <SelectItem value="social">Social & Followers</SelectItem>
                            <SelectItem value="store">Store Messages</SelectItem>
                            <SelectItem value="creator">Creator Updates</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/10" />
                            <div className="h-4 w-48 bg-white/10 rounded" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center bg-white/5 rounded-3xl border border-white/5 mx-auto max-w-xl"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-4 ring-white/2 shadow-2xl">
                                <Bell className="w-10 h-10 text-muted-foreground/20" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2">
                                {searchQuery ? t("notifications.noMatch", "No matches found") : t("notifications.empty", "All quiet on the front")}
                            </h3>
                            <p className="text-muted-foreground max-w-sm px-6">
                                {searchQuery
                                    ? t("notifications.tryAnother", "Try adjusting your search or filters to find what you're looking for.")
                                    : t("notifications.emptySubtitle", "You're all caught up! New stories and events will appear here as they happen.")}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredNotifications.map((n, index) => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleNotificationClick(n)}
                                    >
                                        <Card className={cn(
                                            "relative overflow-hidden group border-white/10 transition-all duration-300 cursor-pointer hover:border-primary/50",
                                            !n.isRead ? "bg-primary/5 shadow-[0_0_20px_rgba(251,191,36,0.05)]" : "bg-white/5 shadow-none"
                                        )}>
                                            <CardContent className="p-6">
                                                <div className="flex gap-6">
                                                    {/* Icon Section */}
                                                    <div className="flex-shrink-0">
                                                        <div className={cn(
                                                            "w-14 h-14 rounded-2xl flex items-center justify-center relative transition-transform duration-500 group-hover:scale-110",
                                                            getTypeColor(n.type)
                                                        )}>
                                                            {getIcon(n.type)}
                                                            {!n.isRead && (
                                                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-[#1a110d]"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Content Section */}
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="space-y-1">
                                                                <h4 className={cn(
                                                                    "text-lg font-bold transition-colors truncate",
                                                                    !n.isRead ? "text-primary" : "text-white/90"
                                                                )}>
                                                                    {n.title}
                                                                </h4>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                                                                    <Badge variant="outline" className={cn("capitalize px-2 py-0", getTypeColor(n.type))}>
                                                                        {n.type}
                                                                    </Badge>
                                                                    <span className="flex items-center gap-1">
                                                                        <Bell className="w-3 h-3" />
                                                                        {formatDistanceToNow(new Date(n.createdAt!), { addSuffix: true })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {n.priority === 'high' && (
                                                                <Badge className="bg-primary text-black font-black uppercase tracking-tighter text-[10px] h-5">
                                                                    URGENT
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className={cn(
                                                            "text-base leading-relaxed line-clamp-2 transition-colors",
                                                            !n.isRead ? "text-white/80 font-medium" : "text-white/60"
                                                        )}>
                                                            {n.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            {/* Hover Glow Effect */}
                                            {!n.isRead && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none opacity-50" />
                                            )}
                                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
