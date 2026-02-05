import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Send,
    X,
    MoreVertical,
    Flag,
    User,
    Clock,
    UserX,
    Users,
    ChevronLeft,
    ChevronRight,
    Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useChat, ChatMessage } from '@/hooks/use-chat';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

export function GlobalChat() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const {
        messages,
        sendMessage,
        reportMessage,
        isLoading
    } = useChat('global');

    const [inputValue, setInputValue] = useState('');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const isArabic = i18n.language === 'ar';
    const currentLocale = isArabic ? ar : enUS;

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current && isOpen) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim() || !user) return;
        await sendMessage({ content: inputValue });
        setInputValue('');
    };

    const handleReport = async () => {
        if (!selectedMessage || !reportReason.trim()) return;
        await reportMessage({ messageId: selectedMessage, reason: reportReason });
        setIsReportOpen(false);
        setReportReason('');
        setSelectedMessage(null);
    };

    return (
        <>
            {/* Floating Bubble */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "fixed bottom-8 z-[100]",
                    isArabic ? "left-8" : "right-8"
                )}
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-16 w-16 rounded-full shadow-2xl shadow-primary/40 bg-primary hover:scale-110 transition-transform flex items-center justify-center p-0"
                >
                    {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}

                    {!isOpen && messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
                            {messages.length > 99 ? '99+' : messages.length}
                        </span>
                    )}
                </Button>
            </motion.div>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: isArabic ? -400 : 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: isArabic ? -400 : 400 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed top-0 bottom-0 w-full sm:w-[400px] bg-background/80 backdrop-blur-2xl border-l border-white/10 z-[101] shadow-2xl flex flex-col pt-20",
                            isArabic ? "left-0 border-r" : "right-0 border-l"
                        )}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-serif font-bold text-lg">{t('chat.global.title', 'Community Chat')}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('chat.global.live', 'Live Universe')}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                                <ChevronRight className={cn("w-5 h-5", isArabic && "rotate-180")} />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            <div className="space-y-6">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex gap-3", msg.sender_id === user?.id && "flex-row-reverse")}>
                                        <Avatar className="h-8 w-8 shrink-0 border border-primary/20">
                                            <AvatarImage src={msg.sender?.avatar_url || ''} />
                                            <AvatarFallback className="bg-primary/5 text-[10px]">{msg.sender?.display_name?.[0]}</AvatarFallback>
                                        </Avatar>

                                        <div className={cn("flex flex-col max-w-[80%]", msg.sender_id === user?.id ? "items-end" : "items-start")}>
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className="text-[10px] font-bold text-primary/80">{msg.sender?.display_name}</span>
                                                <span className="text-[8px] text-muted-foreground">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: currentLocale })}</span>
                                            </div>

                                            <div className="group relative">
                                                <div className={cn(
                                                    "px-4 py-2 rounded-2xl text-sm",
                                                    msg.sender_id === user?.id
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted text-foreground rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                </div>

                                                {/* Actions menu */}
                                                <div className={cn(
                                                    "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex",
                                                    msg.sender_id === user?.id ? "-left-10" : "-right-10"
                                                )}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align={isArabic ? 'start' : 'end'}>
                                                            <DropdownMenuItem className="text-destructive gap-2" onClick={() => {
                                                                setSelectedMessage(msg.id);
                                                                setIsReportOpen(true);
                                                            }}>
                                                                <Flag className="w-4 h-4" /> {t('chat.actions.report', 'Report')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-xs text-muted-foreground animate-pulse">Loading the universe...</span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 bg-primary/5 border-t border-white/10">
                            <div className="flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={user ? t('chat.global.placeholder', 'Say hello...') : t('chat.global.loginToChat', 'Login to chat')}
                                    disabled={!user}
                                    className="bg-black/20 border-white/10 rounded-xl"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <Button
                                    size="icon"
                                    className="rounded-xl shrink-0"
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || !user}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            {!user && (
                                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                    Join the community to participate in the discussion.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Dialog */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('chat.report.title', 'Report Content')}</DialogTitle>
                        <DialogDescription>
                            {t('chat.report.description', 'Help us maintain a safe community. Why are you reporting this message?')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder={t('chat.report.reasonPlaceholder', 'e.g. Hate speech, Spam, Harassment...')}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsReportOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={handleReport} disabled={!reportReason.trim()}>
                            {t('chat.actions.confirmReport', 'Submit Report')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
