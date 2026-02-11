import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProducts, useProduct, useUpdateProduct, useCreateProduct, useDeleteProduct } from "@/hooks/use-products";
import { useChapters, useCreateChapter, useUpdateChapter, useDeleteChapter } from "@/hooks/use-chapters";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch as UISwitch } from "@/components/ui/switch";
import {
    Book,
    Settings,
    Palette,
    Eye,
    Save,
    Plus,
    ChevronLeft,
    PenTool,
    Layout,
    Type,
    Layers,
    ExternalLink,
    Loader2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Sparkles
} from "lucide-react";
import { Link, useRoute, useLocation, Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";

export default function WriterStudio() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [, params] = useRoute("/studio/:id?");
    const [, setLocation] = useLocation();
    const selectedId = params?.id ? parseInt(params.id) : null;

    const { data: products, isLoading: productsLoading } = useProducts({
        writerId: user?.id,
        type: 'ebook'
    });

    const { data: currentProduct, isLoading: productLoading } = useProduct(selectedId || 0);

    const [activeTab, setActiveTab] = useState("write");
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [genre, setGenre] = useState("");
    const [price, setPrice] = useState(0);
    const [isFree, setIsFree] = useState(false);
    const [isSerialized, setIsSerialized] = useState(false);
    const [seriesStatus, setSeriesStatus] = useState("ongoing");
    const [appSettings, setAppSettings] = useState<any>({
        theme: 'sepia',
        fontFamily: 'serif',
        fontSize: 18,
        lineHeight: 1.8
    });

    const { data: chapters, isLoading: chaptersLoading } = useChapters(selectedId || 0);
    const createChapter = useCreateChapter();
    const updateChapter = useUpdateChapter();
    const deleteChapter = useDeleteChapter();
    const deleteProduct = useDeleteProduct();

    const [activeChapterId, setActiveChapterId] = useState<number | null>(null);

    // Initial load: Set content from product (legacy) OR first chapter
    useEffect(() => {
        if (currentProduct) {
            setTitle(currentProduct.title || "");
            setGenre(currentProduct.genre || "");
            setPrice(currentProduct.price || 0);
            setIsFree(currentProduct.price === 0);
            setIsSerialized(currentProduct.isSerialized || false);
            setSeriesStatus(currentProduct.seriesStatus || "ongoing");
            if (currentProduct.appearanceSettings) {
                setAppSettings(currentProduct.appearanceSettings);
            }
        }
    }, [currentProduct]);

    // Handle Chapter Selection / Content Sync
    useEffect(() => {
        if (chapters && chapters.length > 0) {
            // Logic: If no chapter selected, select the first one
            if (!activeChapterId) {
                setActiveChapterId(chapters[0].id);
                setContent(chapters[0].content || "");
            } else {
                // If chapter selected, update content to match selected chapter
                // (Only if we just switched chapters - simpler to just use effect on activeChapterId)
            }
        } else if (currentProduct) {
            // Legacy mode: no chapters, use product content
            setContent(currentProduct.content || "");
        }
    }, [chapters, currentProduct, activeChapterId]);

    // Update content when switching chapters manually
    const handleChapterSelect = (id: number) => {
        setActiveChapterId(id);
        const chapter = chapters?.find(c => c.id === id);
        if (chapter) setContent(chapter.content || "");
    };

    const handleAddChapter = () => {
        if (!selectedId) return;
        const nextIndex = chapters ? chapters.length : 0;
        createChapter.mutate({
            productId: selectedId,
            title: `Chapter ${nextIndex + 1}`,
            content: "",
            orderIndex: nextIndex
        }, {
            onSuccess: (newChapter) => {
                setActiveChapterId(newChapter.id);
                setContent("");
            }
        });
    };

    const createProduct = useCreateProduct();

    const handleCreateNew = () => {
        createProduct.mutate({
            writerId: user?.id,
            title: "Untitled Journey",
            description: "A new story begins...",
            content: "",
            type: "ebook",
            genre: "Fantasy",
            price: 50,
            isPublished: false,
            coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400&h=600",
            appearanceSettings: {
                theme: 'sepia',
                fontFamily: 'serif',
                fontSize: 18,
                lineHeight: 1.8
            }
        }, {
            onSuccess: (newProduct) => {
                setLocation(`/studio/${newProduct.id}`);
            }
        });
    };

    const handleDeleteProduct = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (confirm(t("studio.deleteConfirm") || "Are you sure you want to delete this masterpiece?")) {
            deleteProduct.mutate(id, {
                onSuccess: () => {
                    if (selectedId === id) {
                        setLocation("/studio");
                    }
                }
            });
        }
    };

    if (!user) return <Redirect to="/auth" />;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-foreground font-sans selection:bg-primary/30">
            <Navbar hideNav={true} />

            <div className="flex h-[calc(100-64px)] overflow-hidden">
                {/* Sidebar - Book Navigator */}
                <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col hidden md:flex">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-serif font-bold text-gradient flex items-center gap-2">
                            <PenTool className="w-5 h-5" />
                            {t("studio.title")}
                        </h2>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 mb-6 py-6"
                            onClick={handleCreateNew}
                            disabled={createProduct.isPending}
                        >
                            {createProduct.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {createProduct.isPending ? t("studio.starting") : t("studio.createNew")}
                        </Button>

                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 mb-4">
                            {t("studio.masterpieces")}
                        </div>

                        {productsLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : products?.map((p: any) => (
                            <button
                                key={p.id}
                                onClick={() => setLocation(`/studio/${p.id}`)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl transition-all group relative",
                                    selectedId === p.id
                                        ? "bg-primary/10 border border-primary/30 text-primary"
                                        : "hover:bg-white/5 text-muted-foreground border border-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="font-bold truncate flex-grow">{p.title}</div>
                                    <button
                                        onClick={(e) => handleDeleteProduct(e, p.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all"
                                        title={t("studio.deleteMasterpiece")}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="text-xs opacity-50 flex items-center gap-2 mt-1">
                                    <div className={cn("w-2 h-2 rounded-full", p.isPublished ? "bg-green-500" : "bg-amber-500")} />
                                    {p.isPublished ? t("studio.published_simple") : t("studio.draft_simple")} • {p.genre}
                                </div>
                                {selectedId === p.id && (
                                    <motion.div
                                        layoutId="active-line"
                                        className="absolute right-2 bottom-4"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-white/5 text-center">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-white">
                                <ChevronLeft className="w-4 h-4" /> {t("studio.exit")}
                            </Button>
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-grow overflow-hidden flex flex-col">
                    {!selectedId ? (
                        <div className="flex-grow flex items-center justify-center text-center p-12">
                            <div className="max-w-md space-y-6">
                                <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto ring-1 ring-primary/20">
                                    <Book className="w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-serif font-bold">{t("studio.selectStory")}</h2>
                                <p className="text-muted-foreground">{t("studio.selectDescription")}</p>
                                <Link href="/dashboard">
                                    <Button className="bg-primary text-white px-8">{t("studio.returnDashboard")}</Button>
                                </Link>
                            </div>
                        </div>
                    ) : productLoading ? (
                        <div className="flex-grow flex items-center justify-center"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                    ) : (
                        <>
                            {/* Studio Header */}
                            <header className="h-16 border-b border-white/5 bg-black/20 flex items-center justify-between px-8 backdrop-blur-md">
                                <div className="flex items-center gap-6">
                                    <Link href="/dashboard" className="md:hidden">
                                        <ChevronLeft className="w-6 h-6" />
                                    </Link>
                                    <div>
                                        <h1 className="font-serif font-bold text-xl">{currentProduct.title}</h1>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                                            {currentProduct.isPublished ? t("studio.public") : t("studio.draft")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/5 p-1 rounded-full">
                                        <TabsList className="bg-transparent h-8 border-none p-0">
                                            <TabsTrigger value="write" className="rounded-full px-4 text-xs">{t("studio.tabs.write")}</TabsTrigger>
                                            <TabsTrigger value="appearance" className="rounded-full px-4 text-xs">{t("studio.tabs.appearance")}</TabsTrigger>
                                            <TabsTrigger value="market" className="rounded-full px-4 text-xs">{t("studio.tabs.market")}</TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <div className="h-8 w-px bg-white/10" />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 rounded-full border-white/10 hover:bg-white/5 hidden sm:flex"
                                        onClick={() => {
                                            if (activeChapterId) {
                                                updateChapter.mutate({ id: activeChapterId, content }, {
                                                    onSuccess: () => setLocation(`/read/${selectedId}`)
                                                });
                                            } else {
                                                setLocation(`/read/${selectedId}`);
                                            }
                                        }}
                                        disabled={updateChapter.isPending}
                                    >
                                        {updateChapter.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                        {t("studio.preview")}
                                    </Button>

                                    <SaveButton
                                        product={currentProduct}
                                        content={content}
                                        title={title}
                                        genre={genre}
                                        price={price}
                                        isSerialized={isSerialized}
                                        seriesStatus={seriesStatus}
                                        appearanceSettings={appSettings}
                                        activeChapterId={activeChapterId}
                                        chapters={chapters}
                                    />
                                </div>
                            </header>

                            {/* Editor/Tabs Area */}
                            <div className="flex-grow overflow-hidden flex">
                                <div className="flex-grow overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {activeTab === "write" && (
                                            <div className="flex h-full">
                                                {/* Chapter Sidebar */}
                                                <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col">
                                                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                                        <h3 className="font-bold text-sm uppercase tracking-wider">{t("studio.chapters")}</h3>
                                                        <Button size="sm" variant="ghost" onClick={handleAddChapter} disabled={createChapter.isPending}>
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="overflow-y-auto flex-grow p-2 space-y-1">
                                                        {chapters && chapters.length > 0 ? (
                                                            chapters.map((chapter) => (
                                                                <button
                                                                    key={chapter.id}
                                                                    onClick={() => handleChapterSelect(chapter.id)}
                                                                    className={cn(
                                                                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                                                                        activeChapterId === chapter.id
                                                                            ? "bg-primary/20 text-primary border border-primary/20"
                                                                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                                                    )}
                                                                >
                                                                    <span className="truncate">{chapter.title}</span>
                                                                    {activeChapterId === chapter.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-muted-foreground opacity-50">
                                                                {t("studio.noChaptersYet") || "No chapters yet."}<br />{t("studio.clickPlus") || "Click + to add."}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-4 border-t border-white/5">
                                                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
                                                                <PenTool className="w-3 h-3" /> {t("studio.guide.title")}
                                                            </h4>
                                                            <p className="text-[9px] leading-relaxed text-muted-foreground">
                                                                {t("studio.guide.chapters")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Editor */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex-grow p-12 min-h-full flex flex-col"
                                                >
                                                    {(!chapters || chapters.length === 0) ? (
                                                        <div className="flex-grow flex items-center justify-center">
                                                            <div className="max-w-xl space-y-8 text-center bg-white/5 p-12 rounded-3xl border border-white/10 backdrop-blur-md">
                                                                <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                                                    <PenTool className="w-10 h-10" />
                                                                </div>
                                                                <h2 className="text-3xl font-serif font-bold text-gradient">{t("studio.guide.title")}</h2>

                                                                <div className="grid gap-6 text-left">
                                                                    <div className="flex gap-4">
                                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">1</div>
                                                                        <div>
                                                                            <h3 className="font-bold text-lg mb-1">{t("studio.chapters")}</h3>
                                                                            <p className="text-muted-foreground text-sm">{t("studio.guide.chapters")}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">2</div>
                                                                        <div>
                                                                            <h3 className="font-bold text-lg mb-1">{t("dashboard.products.uploadChapters")}</h3>
                                                                            <p className="text-muted-foreground text-sm">{t("studio.guide.copyPaste")}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">3</div>
                                                                        <div>
                                                                            <h3 className="font-bold text-lg mb-1">{t("studio.save")}</h3>
                                                                            <p className="text-muted-foreground text-sm">{t("studio.guide.save")}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    onClick={handleAddChapter}
                                                                    className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                                                                >
                                                                    <Plus className="w-5 h-5 mr-2" /> {t("studio.createNew")}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {activeChapterId && (
                                                                <div className="mb-6">
                                                                    <input
                                                                        className="bg-transparent border-none text-2xl font-serif font-bold w-full focus:outline-none placeholder:text-muted-foreground/30"
                                                                        value={chapters.find(c => c.id === activeChapterId)?.title || ""}
                                                                        onChange={(e) => updateChapter.mutate({ id: activeChapterId, title: e.target.value })}
                                                                        placeholder="Chapter Title"
                                                                    />
                                                                </div>
                                                            )}

                                                            <Textarea
                                                                value={content}
                                                                onChange={(e) => setContent(e.target.value)}
                                                                placeholder={t("studio.placeholder")}
                                                                className={cn(
                                                                    "flex-grow min-h-[70vh] text-xl leading-relaxed resize-none bg-transparent border-none focus-visible:ring-0 p-0 selection:bg-primary/20",
                                                                    appSettings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                                                                )}
                                                                style={{
                                                                    fontSize: `${appSettings.fontSize}px`,
                                                                    lineHeight: appSettings.lineHeight
                                                                }}
                                                                dir="auto"
                                                            />
                                                            <div className="mt-6 py-4 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest">
                                                                <span>{t("studio.words")}: {content?.trim() ? content.split(/\s+/).length : 0}</span>
                                                                <span>{t("studio.autosave")}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            </div>
                                        )}

                                        {activeTab === "appearance" && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="max-w-4xl mx-auto p-12 space-y-12"
                                            >
                                                <section>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">{t("studio.appearance.themes")}</h3>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        {['light', 'dark', 'sepia', 'fantasy'].map((t) => (
                                                            <button
                                                                key={t}
                                                                onClick={() => setAppSettings({ ...appSettings, theme: t })}
                                                                className={cn(
                                                                    "aspect-video rounded-xl border-2 transition-all p-3 flex flex-col justify-between overflow-hidden",
                                                                    appSettings.theme === t ? "border-primary bg-primary/5" : "border-white/5 hover:border-white/20 bg-white/5"
                                                                )}
                                                            >
                                                                <div className="w-full h-2 rounded-full bg-white/20" />
                                                                <div className="space-y-1">
                                                                    <div className="w-2/3 h-1 rounded-full bg-white/10" />
                                                                    <div className="w-1/2 h-1 rounded-full bg-white/10" />
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase tracking-widest mt-2">{t}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </section>

                                                <section>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">{t("studio.appearance.typography")}</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <label className="text-xs font-medium text-muted-foreground mr-4">{t("studio.appearance.fontFamily")}</label>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant={appSettings.fontFamily === 'serif' ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    className="rounded-full"
                                                                    onClick={() => setAppSettings({ ...appSettings, fontFamily: 'serif' })}
                                                                >
                                                                    {t("studio.appearance.serif")}
                                                                </Button>
                                                                <Button
                                                                    variant={appSettings.fontFamily === 'sans' ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    className="rounded-full"
                                                                    onClick={() => setAppSettings({ ...appSettings, fontFamily: 'sans' })}
                                                                >
                                                                    {t("studio.appearance.sans")}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("studio.appearance.fontSize")} ({appSettings.fontSize}px)</label>
                                                            <input
                                                                type="range"
                                                                min="12"
                                                                max="32"
                                                                value={appSettings.fontSize}
                                                                onChange={(e) => setAppSettings({ ...appSettings, fontSize: parseInt(e.target.value) })}
                                                                className="w-full accent-primary bg-white/10 rounded-lg h-2 cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20">
                                                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                                        <Eye className="w-4 h-4 text-primary" /> {t("studio.appearance.previewTitle")}
                                                    </h4>
                                                    <div className={cn(
                                                        "p-6 rounded-xl border border-white/5 h-48 overflow-hidden",
                                                        appSettings.theme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' :
                                                            appSettings.theme === 'dark' ? 'bg-gray-950 text-white' :
                                                                'bg-white text-gray-950',
                                                        appSettings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                                                    )} style={{ fontSize: `${appSettings.fontSize}px`, lineHeight: appSettings.lineHeight }}>
                                                        {t("studio.appearance.previewText")}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === "market" && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 1.05 }}
                                                className="max-w-4xl mx-auto p-12 space-y-12"
                                            >
                                                <section className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                                                    <div className="space-y-6">
                                                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{t("studio.market.identity")}</h3>
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">{t("studio.market.title")}</label>
                                                                <Input
                                                                    value={title}
                                                                    onChange={(e) => setTitle(e.target.value)}
                                                                    className="bg-white/5 border-white/10"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">{t("studio.market.genre")}</label>
                                                                <Input
                                                                    value={genre}
                                                                    onChange={(e) => setGenre(e.target.value)}
                                                                    className="bg-white/5 border-white/10"
                                                                />
                                                            </div>
                                                            {currentProduct.type !== 'promotional' && (
                                                                <div className="space-y-4 pt-2">
                                                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                                                        <div className="flex flex-col gap-1">
                                                                            <label className="text-sm font-bold flex items-center gap-2">
                                                                                <Sparkles className="w-4 h-4 text-primary" />
                                                                                {t("studio.market.free_story", "Free Story")}
                                                                            </label>
                                                                            <p className="text-[10px] text-muted-foreground">
                                                                                {t("studio.market.free_desc", "Readers can read this story for free.")}
                                                                            </p>
                                                                        </div>
                                                                        <UISwitch
                                                                            checked={isFree}
                                                                            onCheckedChange={(checked) => {
                                                                                setIsFree(checked);
                                                                                if (checked) setPrice(0);
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {!isFree && (
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-bold text-muted-foreground uppercase">{t("studio.market.price")} (EGP)</label>
                                                                            <Input
                                                                                type="number"
                                                                                value={price === 0 ? "" : price}
                                                                                onChange={(e) => setPrice(Number(e.target.value))}
                                                                                className="bg-white/5 border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                placeholder="0"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="pt-4 space-y-4">
                                                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-sm font-bold flex items-center gap-2">
                                                                            <Layers className="w-4 h-4 text-primary" />
                                                                            {t("studio.market.serialized", "Serialized Story")}
                                                                        </label>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {t("studio.market.serializedDesc", "Is this an ongoing series? It will appear in the 'Ongoing Stories' section.")}
                                                                        </p>
                                                                    </div>
                                                                    <UISwitch
                                                                        checked={isSerialized}
                                                                        onCheckedChange={setIsSerialized}
                                                                    />
                                                                </div>

                                                                {isSerialized && (
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs font-bold text-muted-foreground uppercase">{t("studio.market.seriesStatus", "Series Status")}</label>
                                                                        <select
                                                                            value={seriesStatus}
                                                                            onChange={(e) => setSeriesStatus(e.target.value)}
                                                                            className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                                        >
                                                                            <option value="ongoing">Ongoing</option>
                                                                            <option value="completed">Completed</option>
                                                                        </select>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{t("studio.market.cover")}</h3>
                                                        <CloudinaryUpload
                                                            label={t("studio.market.coverLabel")}
                                                            defaultImage={currentProduct.coverUrl}
                                                            folder="hekayaty_covers"
                                                            onUpload={(url) => console.log(url)}
                                                        />
                                                    </div>
                                                </section>

                                                <section className="pt-12 border-t border-white/5">
                                                    <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-full flex items-center justify-center",
                                                                currentProduct.isPublished ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                                                            )}>
                                                                {currentProduct.isPublished ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold">{currentProduct.isPublished ? t("studio.market.status.publicTitle") : t("studio.market.status.draftTitle")}</h4>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {currentProduct.isPublished
                                                                        ? t("studio.market.status.publicDesc")
                                                                        : t("studio.market.status.draftDesc")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <PublishToggle product={currentProduct} />
                                                    </div>
                                                </section>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

function SaveButton({ product, content, title, genre, price, isSerialized, seriesStatus, appearanceSettings, activeChapterId, chapters }: any) {
    const { t } = useTranslation();
    const updateProduct = useUpdateProduct();
    const updateChapter = useUpdateChapter();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // 1. Save Product Metadata (always)
        updateProduct.mutate({
            id: product.id,
            // Only update legacy content if NOT using chapters
            content: (!chapters || chapters.length === 0) ? content : undefined,
            title,
            genre,
            price,
            isSerialized,
            seriesStatus,
            appearanceSettings
        });

        // 2. Save Chapter Content (if chapters exist)
        if (activeChapterId) {
            updateChapter.mutate({
                id: activeChapterId,
                content
            }, {
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                }
            });
        } else {
            // Legacy save success feedback
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <Button
            onClick={handleSave}
            disabled={updateProduct.isPending}
            className={cn(
                "gap-2 px-6 rounded-full transition-all shadow-lg",
                saved ? "bg-green-500 hover:bg-green-500" : "bg-primary hover:bg-primary/90"
            )}
        >
            {updateProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? t("studio.saved") : t("studio.save")}
        </Button>
    );
}

function PublishToggle({ product }: any) {
    const { t } = useTranslation();
    const updateProduct = useUpdateProduct();
    const isPublished = product.is_published;

    return (
        <Button
            variant={isPublished ? "outline" : "default"}
            disabled={updateProduct.isPending}
            onClick={() => updateProduct.mutate({ id: product.id, isPublished: !isPublished })}
            className={cn(
                "rounded-full px-6",
                isPublished ? "border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/50" : "bg-primary text-white"
            )}
        >
            {isPublished ? t("studio.market.offline") : t("studio.market.publish")}
        </Button>
    );
}

