import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProducts, useProduct, useUpdateProduct, useCreateProduct } from "@/hooks/use-products";
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
    AlertCircle
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
    const [appSettings, setAppSettings] = useState<any>({
        theme: 'sepia',
        fontFamily: 'serif',
        fontSize: 18,
        lineHeight: 1.8
    });

    useEffect(() => {
        if (currentProduct) {
            setContent(currentProduct.content || "");
            if (currentProduct.appearanceSettings) {
                setAppSettings(currentProduct.appearanceSettings);
            }
        }
    }, [currentProduct]);

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
                            Writer Studio
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
                            {createProduct.isPending ? "Starting Journey..." : "Create New Journey"}
                        </Button>

                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 mb-4">
                            Your Masterpieces
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
                                <div className="font-bold truncate pr-6">{p.title}</div>
                                <div className="text-xs opacity-50 flex items-center gap-2 mt-1">
                                    <div className={cn("w-2 h-2 rounded-full", p.isPublished ? "bg-green-500" : "bg-amber-500")} />
                                    {p.isPublished ? "Published" : "Draft"} • {p.genre}
                                </div>
                                {selectedId === p.id && (
                                    <motion.div
                                        layoutId="active-line"
                                        className="absolute right-4 top-1/2 -translate-y-1/2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-white/5 text-center">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-white">
                                <ChevronLeft className="w-4 h-4" /> Exit Studio
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
                                <h2 className="text-3xl font-serif font-bold">Select a Story</h2>
                                <p className="text-muted-foreground">Choose a novel from the sidebar to start writing or refine its appearance.</p>
                                <Link href="/dashboard">
                                    <Button className="bg-primary text-white px-8">Return to Dashboard</Button>
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
                                            {currentProduct.isPublished ? "Public Marketplace" : "Draft Mode"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/5 p-1 rounded-full">
                                        <TabsList className="bg-transparent h-8 border-none p-0">
                                            <TabsTrigger value="write" className="rounded-full px-4 text-xs">Write</TabsTrigger>
                                            <TabsTrigger value="appearance" className="rounded-full px-4 text-xs">Appearance</TabsTrigger>
                                            <TabsTrigger value="market" className="rounded-full px-4 text-xs">Market</TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <div className="h-8 w-px bg-white/10" />

                                    <Link href={`/read/${selectedId}`} className="hidden sm:block">
                                        <Button variant="outline" size="sm" className="gap-2 rounded-full border-white/10 hover:bg-white/5">
                                            <Eye className="w-4 h-4" /> Preview
                                        </Button>
                                    </Link>

                                    <SaveButton product={currentProduct} content={content} appearanceSettings={appSettings} />
                                </div>
                            </header>

                            {/* Editor/Tabs Area */}
                            <div className="flex-grow overflow-hidden flex">
                                <div className="flex-grow overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {activeTab === "write" && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="max-w-4xl mx-auto p-12 min-h-full flex flex-col"
                                            >
                                                <Textarea
                                                    value={content}
                                                    onChange={(e) => setContent(e.target.value)}
                                                    placeholder="Once upon a time..."
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
                                                <div className="mt-12 py-6 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest">
                                                    <span>Words: {content?.trim() ? content.split(/\s+/).length : 0}</span>
                                                    <span>Auto-save enabled</span>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === "appearance" && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="max-w-4xl mx-auto p-12 space-y-12"
                                            >
                                                <section>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Reader Themes</h3>
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
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Typography</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <label className="text-xs font-medium text-muted-foreground mr-4">Font Family</label>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant={appSettings.fontFamily === 'serif' ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    className="rounded-full"
                                                                    onClick={() => setAppSettings({ ...appSettings, fontFamily: 'serif' })}
                                                                >
                                                                    Serif (Classic)
                                                                </Button>
                                                                <Button
                                                                    variant={appSettings.fontFamily === 'sans' ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    className="rounded-full"
                                                                    onClick={() => setAppSettings({ ...appSettings, fontFamily: 'sans' })}
                                                                >
                                                                    Sans (Modern)
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <label className="text-xs font-medium text-muted-foreground mb-2 block">Font Size ({appSettings.fontSize}px)</label>
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
                                                        <Eye className="w-4 h-4 text-primary" /> Live Style Preview
                                                    </h4>
                                                    <div className={cn(
                                                        "p-6 rounded-xl border border-white/5 h-48 overflow-hidden",
                                                        appSettings.theme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' :
                                                            appSettings.theme === 'dark' ? 'bg-gray-950 text-white' :
                                                                'bg-white text-gray-950',
                                                        appSettings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                                                    )} style={{ fontSize: `${appSettings.fontSize}px`, lineHeight: appSettings.lineHeight }}>
                                                        This is a preview of how your readers will see your masterpiece. You can customize the font, size, and ambient themes to match the mood of your story.
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
                                                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Market Identity</h3>
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Story Title</label>
                                                                <Input defaultValue={currentProduct.title} className="bg-white/5 border-white/10" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Genre</label>
                                                                <Input defaultValue={currentProduct.genre} className="bg-white/5 border-white/10" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Pricing (EGP)</label>
                                                                <Input type="number" defaultValue={currentProduct.price} className="bg-white/5 border-white/10" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Cover Imagery</h3>
                                                        <CloudinaryUpload
                                                            label="Public Book Cover"
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
                                                                <h4 className="font-bold">{currentProduct.isPublished ? "Publicly Listed" : "Story in Draft Mode"}</h4>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {currentProduct.isPublished
                                                                        ? "Your story is visible to thousands of readers in the marketplace."
                                                                        : "Your story is only visible to you. Complete your first chapter to publish!"}
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

function SaveButton({ product, content, appearanceSettings }: any) {
    const updateProduct = useUpdateProduct();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        updateProduct.mutate({
            id: product.id,
            content,
            appearanceSettings
        }, {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        });
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
            {saved ? "Saved" : "Save Journey"}
        </Button>
    );
}

function PublishToggle({ product }: any) {
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
            {isPublished ? "Take Offline" : "Publish to Market"}
        </Button>
    );
}

