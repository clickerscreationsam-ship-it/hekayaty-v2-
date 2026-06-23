import { useRoute, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useCollection } from "@/hooks/use-collections";
import { useUserOrders } from "@/hooks/use-orders";
import { useProduct, useProductContent } from "@/hooks/use-products";
import { useChapters } from "@/hooks/use-chapters";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft, ArrowRight, Type, Moon, Sun, Lock, CheckCircle, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

function ReaderEngine({ productId, onNextBook, onPrevBook, hasNext, hasPrev, isSidebarOpen, onToggleSidebar }: { productId: number, onNextBook: () => void, onPrevBook: () => void, hasNext: boolean, hasPrev: boolean, isSidebarOpen: boolean, onToggleSidebar: () => void }) {
    const { data: product, isLoading: productLoading } = useProduct(productId);
    const { data: fetchedContent, isLoading: contentLoading } = useProductContent(productId);
    const { data: chapters, isLoading: chaptersLoading } = useChapters(productId);
    const { t, i18n } = useTranslation();

    const [fontSize, setFontSize] = useState(18);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);
    const [textContent, setTextContent] = useState("");

    const isLoading = productLoading || contentLoading || chaptersLoading;

    useEffect(() => {
        let actualContent = "";
        if (chapters && chapters.length > 0) {
            const chapter = chapters[activeChapterIndex];
            actualContent = chapter ? (chapter.content || "") : "";
        } else {
            actualContent = fetchedContent || product?.content || product?.description || "";
        }
        setTextContent(actualContent);

        if (product?.appearanceSettings) {
            const settings = product.appearanceSettings;
            if (settings.theme) setTheme(settings.theme === "sepia" ? "light" : settings.theme as any);
            if (settings.fontSize) setFontSize(settings.fontSize);
            if (settings.fontFamily) setFontFamily(settings.fontFamily as any);
        }
    }, [product, fetchedContent, chapters, activeChapterIndex]);

    useEffect(() => {
        // Digital Content Protection
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleCopy = (e: ClipboardEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            const forbiddenKeys = ['c', 's', 'u', 'p', 'i', 'j'];
            if ((e.ctrlKey || e.metaKey) && forbiddenKeys.includes(e.key.toLowerCase())) e.preventDefault();
            if (e.key === 'F12' || e.key === 'PrintScreen') e.preventDefault();
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('copy', handleCopy);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('copy', handleCopy);
        };
    }, []);

    if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!product) return <div className="h-full flex items-center justify-center">الكتاب غير موجود</div>;

    const bgColors = {
        light: "bg-white text-gray-900",
        dark: "bg-gray-900 text-gray-100",
    };

    const isLight = theme === 'light';

    return (
        <div className={cn("min-h-full flex flex-col relative transition-colors duration-500", isLight ? bgColors.light : bgColors.dark)}>
            <div className={cn("sticky top-0 z-10 w-full px-6 py-4 border-b flex items-center justify-between backdrop-blur-md", isLight ? 'bg-white/90 border-gray-200' : 'bg-gray-900/90 border-gray-800')}>
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    {!isSidebarOpen && (
                        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className={cn("shrink-0", isLight ? "text-amber-900 hover:text-amber-700 hover:bg-amber-100/50" : "text-amber-500 hover:text-amber-400")}>
                            <Menu className="w-5 h-5" />
                        </Button>
                    )}
                    <h2 className={cn("font-bold text-lg truncate", isLight ? "text-amber-900" : "text-amber-500")} dir="auto">{product.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-full p-1 gap-1">
                        <button onClick={() => setTheme("light")} className={cn("p-1.5 rounded-full hover:bg-black/10 transition-colors", isLight ? 'bg-white shadow-sm text-black' : 'text-gray-400')}>
                            <Sun className="w-4 h-4" />
                        </button>
                        <button onClick={() => setTheme("dark")} className={cn("p-1.5 rounded-full hover:bg-white/10 transition-colors", !isLight ? 'bg-gray-800 shadow-sm text-white' : 'text-gray-500')}>
                            <Moon className="w-4 h-4" />
                        </button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFontFamily(f => f === 'serif' ? 'sans' : 'serif')}>
                        <Type className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <main className="flex-1 p-6 sm:p-12 max-w-3xl mx-auto w-full" style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily === 'serif' ? 'Merriweather, serif' : 'Inter, sans-serif' }}>
                <div className={cn("prose prose-lg max-w-none leading-loose whitespace-pre-wrap select-none", !isLight && "prose-invert text-white", fontFamily === 'serif' ? 'font-serif' : 'font-sans')}>
                    {textContent ? (
                        <div dir="auto">
                            {chapters && chapters.length > 0 && (
                                <h3 className={cn("text-3xl font-bold mb-8 opacity-90", isLight ? "text-amber-950" : "text-amber-400")}>{chapters[activeChapterIndex]?.title}</h3>
                            )}
                            <div className="opacity-90 leading-relaxed">{textContent}</div>
                        </div>
                    ) : (
                        <div className="text-center py-20 opacity-50">
                            <h2 className={cn(isLight ? "text-amber-900" : "text-amber-500")}>لا يوجد محتوى متاح</h2>
                            <p>{product.description || "لم يقم المؤلف بإضافة أي محتوى بعد."}</p>
                        </div>
                    )}
                </div>

                <div className="mt-20 flex justify-between items-center border-t py-8 opacity-60">
                    <Button
                        variant="outline"
                        disabled={activeChapterIndex === 0 && !hasPrev}
                        onClick={() => {
                            if (activeChapterIndex > 0) {
                                window.scrollTo(0, 0);
                                setActiveChapterIndex(prev => prev - 1);
                            } else {
                                onPrevBook();
                            }
                        }}
                    >
                        {activeChapterIndex === 0 && hasPrev ? "الكتاب السابق" : t("common.previous")}
                    </Button>
                    
                    <span className="text-sm">
                        {chapters && chapters.length > 0 ? `الفصل ${activeChapterIndex + 1} / ${chapters.length}` : (hasNext ? "نهاية الكتاب" : "النهاية")}
                    </span>

                    <Button
                        variant="outline"
                        disabled={(!chapters || activeChapterIndex >= chapters.length - 1) && !hasNext}
                        onClick={() => {
                            if (chapters && activeChapterIndex < chapters.length - 1) {
                                window.scrollTo(0, 0);
                                setActiveChapterIndex(prev => prev + 1);
                            } else {
                                onNextBook();
                            }
                        }}
                    >
                        {(!chapters || activeChapterIndex >= chapters.length - 1) && hasNext ? "الكتاب التالي" : t("common.next")}
                    </Button>
                </div>
            </main>
        </div>
    );
}

export default function CollectionReader() {
    const [, params] = useRoute("/collections/:slug/read");
    const slug = params?.slug || "";
    const { data: collection, isLoading: collectionLoading } = useCollection(slug);
    const { data: orders, isLoading: ordersLoading } = useUserOrders();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    
    const [activeProductId, setActiveProductId] = useState<number | null>(null);
    const [readProgress, setReadProgress] = useState<Record<number, boolean>>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const isLoading = collectionLoading || ordersLoading;

    // Load progress
    useEffect(() => {
        if (collection?.id) {
            const saved = localStorage.getItem(`collection_progress_${collection.id}`);
            if (saved) {
                try { setReadProgress(JSON.parse(saved)); } catch (e) {}
            }
        }
    }, [collection?.id]);

    // Save progress and set initial book
    useEffect(() => {
        if (collection?.items && collection.items.length > 0) {
            if (!activeProductId) {
                // Find first unread book, or default to first
                const firstUnread = collection.items.find((item: any) => !readProgress[item.story_id]);
                setActiveProductId(firstUnread ? firstUnread.story_id : collection.items[0].story_id);
            }
        }
    }, [collection, activeProductId, readProgress]);

    const markAsRead = (id: number) => {
        if (!collection?.id) return;
        const newProgress = { ...readProgress, [id]: true };
        setReadProgress(newProgress);
        localStorage.setItem(`collection_progress_${collection.id}`, JSON.stringify(newProgress));
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    if (!collection) {
        return <div className="min-h-screen flex items-center justify-center">المجموعة غير موجودة</div>;
    }

    const isOwner = user?.id === collection.writer_id;
    const hasPurchased = orders?.some((order: any) => order.isVerified && order.order_items?.some((item: any) => item.product?.collectionId === collection.id));

    if (!isOwner && !hasPurchased) {
        // No access, redirect back to store
        setLocation(`/collections/${slug}`);
        return null;
    }

    const items = collection.items || [];
    const activeIndex = items.findIndex((item: any) => item.story_id === activeProductId);
    
    const handleNextBook = () => {
        if (activeProductId) markAsRead(activeProductId);
        if (activeIndex < items.length - 1) {
            setActiveProductId(items[activeIndex + 1].story_id);
        }
    };

    const handlePrevBook = () => {
        if (activeIndex > 0) {
            setActiveProductId(items[activeIndex - 1].story_id);
        }
    };

    const completedCount = Object.values(readProgress).filter(Boolean).length;
    const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SEO title={`${collection.title} - مساحة القراءة`} />
            
            {/* Sidebar Library */}
            <aside className={cn(
                "border-l border-white/10 bg-card flex flex-col shrink-0 transition-all duration-300",
                isSidebarOpen ? "w-80" : "w-0 overflow-hidden border-none opacity-0"
            )}>
                <div className="p-6 border-b border-white/10 bg-black/20 relative">
                    <div className="flex items-center justify-between mb-6">
                        <Link href={`/dashboard`} className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors">
                            <ArrowRight className="w-4 h-4 ml-1" /> العودة للمكتبة
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-white">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <h1 className="text-2xl font-black font-serif mb-2 text-gradient">{collection.title}</h1>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase rounded border border-green-500/30">
                            تم الشراء
                        </span>
                        <span className="text-xs text-muted-foreground">{items.length} كتب</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 rounded-full h-2 mb-1 overflow-hidden">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>التقدم</span>
                        <span>{progressPercent}%</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {items.map((item: any, index: number) => {
                        const product = item.product;
                        if (!product) return null;
                        const isActive = activeProductId === item.story_id;
                        const isRead = readProgress[item.story_id];

                        return (
                            <button
                                key={item.story_id}
                                onClick={() => setActiveProductId(item.story_id)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-2 rounded-xl transition-all text-right",
                                    isActive ? "bg-primary/10 border-primary/30 border shadow-sm" : "hover:bg-white/5 border border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden shadow-sm">
                                    <img src={product.cover_url} alt={product.title} className="w-full h-full object-cover" />
                                    {isRead && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="text-xs font-bold text-muted-foreground mb-1">الكتاب {index + 1}</span>
                                    <span className={cn("font-bold truncate", isActive ? "text-primary" : "text-foreground")}>
                                        {product.title}
                                    </span>
                                </div>
                                {isActive && <BookOpen className="w-4 h-4 text-primary shrink-0 ml-2" />}
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* Main Reading Area */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-black/50">
                {activeProductId ? (
                    <ReaderEngine 
                        key={activeProductId} // Force re-mount when book changes
                        productId={activeProductId} 
                        onNextBook={handleNextBook}
                        onPrevBook={handlePrevBook}
                        hasNext={activeIndex < items.length - 1}
                        hasPrev={activeIndex > 0}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center opacity-50">
                        <Loader2 className="animate-spin w-8 h-8" />
                    </div>
                )}
            </main>
        </div>
    );
}
