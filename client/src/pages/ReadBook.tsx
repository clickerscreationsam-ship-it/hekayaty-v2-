import { useProduct, useUpdateProduct, useProductContent } from "@/hooks/use-products";
import { useChapters } from "@/hooks/use-chapters";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft, Settings, Type, Moon, Sun, Bookmark, Edit, Save, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReadBook() {
    const [, params] = useRoute("/read/:id");
    const id = parseInt(params?.id || "0");
    const { data: product, isLoading: productLoading } = useProduct(id);
    const { data: fetchedContent, isLoading: contentLoading } = useProductContent(id);
    const { data: chapters, isLoading: chaptersLoading } = useChapters(id);
    const updateProduct = useUpdateProduct();
    const { user } = useAuth(); // Get current user

    const [fontSize, setFontSize] = useState(18);
    const [theme, setTheme] = useState<"light" | "dark" | "sepia">("light");
    const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

    const [isEditing, setIsEditing] = useState(false);
    const [textContent, setTextContent] = useState("");
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);

    const isLoading = productLoading || contentLoading || chaptersLoading;

    // Initialize text content and appearance when product loads
    useEffect(() => {
        let actualContent = "";

        if (chapters && chapters.length > 0) {
            // Chapter Mode
            const chapter = chapters[activeChapterIndex];
            actualContent = chapter ? (chapter.content || "") : "";
        } else {
            // Legacy Mode
            actualContent = fetchedContent || product?.content || product?.description || "";
        }

        setTextContent(actualContent);

        if (product?.appearanceSettings) {
            const settings = product.appearanceSettings;
            if (settings.theme) setTheme(settings.theme as any);
            if (settings.fontSize) setFontSize(settings.fontSize);
            if (settings.fontFamily) setFontFamily(settings.fontFamily as any);
        }
    }, [product, fetchedContent, chapters, activeChapterIndex]);

    const handleSave = () => {
        if (!product) return;
        updateProduct.mutate({ id: product.id, content: textContent }, {
            onSuccess: () => setIsEditing(false)
        });
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!product) return <div>Book not found</div>;

    const bgColors = {
        light: "bg-white text-gray-900 border-gray-200",
        dark: "bg-gray-900 text-gray-100 border-gray-800",
        sepia: "bg-[#f4ecd8] text-[#5b4636] border-[#e3d7bf]"
    };

    // Genre-based Thematic Overrides
    const getGenreTheme = () => {
        const genre = product.genre?.toLowerCase() || "";
        if (genre.includes("fantasy")) {
            return {
                base: theme === "light" ? "bg-[#fdfcf0] text-[#432d1d]" : "bg-[#1a1b26] text-[#c0caf5]",
                accent: "text-[#d97706]",
                font: "font-serif",
                overlay: "bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10"
            };
        }
        if (genre.includes("romance")) {
            return {
                base: theme === "light" ? "bg-[#fffafa] text-[#702459]" : "bg-[#2d1b2d] text-[#fbcfe8]",
                accent: "text-[#db2777]",
                font: "font-serif",
                overlay: "bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')] opacity-5"
            };
        }
        if (genre.includes("sci-fi") || genre.includes("scifi")) {
            return {
                base: theme === "light" ? "bg-[#f0f9ff] text-[#0c4a6e]" : "bg-[#020617] text-[#38bdf8]",
                accent: "text-[#0ea5e9]",
                font: "font-sans",
                overlay: "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"
            };
        }
        if (genre.includes("horror") || genre.includes("mystery")) {
            return {
                base: theme === "light" ? "bg-[#f3f4f6] text-[#111827]" : "bg-[#09090b] text-[#a1a1aa]",
                accent: "text-[#ef4444]",
                font: "font-serif",
                overlay: "bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10"
            };
        }
        return {
            base: bgColors[theme],
            accent: "text-primary",
            font: fontFamily === 'serif' ? 'font-serif' : 'font-sans',
            overlay: ""
        };
    };

    const gTheme = getGenreTheme();

    return (
        <div className={`min-h-screen transition-all duration-500 relative overflow-hidden ${gTheme.base}`}>
            {/* Atmospheric Overlay */}
            {gTheme.overlay && <div className={`fixed inset-0 pointer-events-none z-0 ${gTheme.overlay}`} />}

            <div className="relative z-10 w-full">
                {/* Reader Nav */}
                <nav className={`fixed top-0 w-full h-16 flex items-center justify-between px-4 sm:px-8 border-b z-50 transition-all duration-500 backdrop-blur-md bg-opacity-80 ${gTheme.base}`}>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Exit
                        </Button>
                    </Link>

                    <h1 className={`${gTheme.font} font-bold truncate max-w-[200px] sm:max-w-md hidden sm:block`}>
                        {product.title}
                        {chapters && chapters.length > 0 && (
                            <span className="opacity-50 font-normal ml-2 text-sm">
                                — {chapters[activeChapterIndex]?.title}
                            </span>
                        )}
                        <span className="ml-4 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                            Protected View
                        </span>
                    </h1>

                    <div className="flex items-center gap-2">
                        {/* Edit Mode Toggle (Only for Author) */}
                        {user && product && user.id === product.writerId && (
                            <div className="mr-2 border-r pr-2">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSave} disabled={updateProduct.isPending}>
                                            <Save className="w-4 h-4 mr-1" /> Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                        <Edit className="w-4 h-4 mr-2" /> Edit Book
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <div className="flex items-center border rounded-full p-1 gap-1">
                            <button
                                onClick={() => setTheme("light")}
                                className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${theme === 'light' ? 'bg-white shadow-sm text-black' : ''}`}
                            >
                                <Sun className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setTheme("sepia")}
                                className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${theme === 'sepia' ? 'bg-[#e3d7bf] shadow-sm text-[#5b4636]' : ''}`}
                            >
                                <BookOpenIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setTheme("dark")}
                                className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${theme === 'dark' ? 'bg-gray-800 shadow-sm text-white' : ''}`}
                            >
                                <Moon className="w-4 h-4" />
                            </button>
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => setFontFamily(f => f === 'serif' ? 'sans' : 'serif')}>
                            <Type className="w-4 h-4" />
                        </Button>
                    </div>
                </nav>

                {/* Reader Content (Focus Mode) */}
                <main className="pt-24 pb-20 px-4 sm:px-8 max-w-3xl mx-auto focus:outline-none relative" style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily === 'serif' ? 'Merriweather, serif' : 'Inter, sans-serif' }}>
                    {isEditing ? (
                        <Textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className={`min-h-[80vh] w-full p-4 ${gTheme.font} bg-transparent border-none resize-none focus-visible:ring-0 leading-loose whitespace-pre-wrap`}
                            style={{ fontSize: `${fontSize}px` }}
                            dir="auto"
                        />
                    ) : (
                        <div className={`prose prose-lg max-w-none dark:prose-invert ${gTheme.font} leading-loose whitespace-pre-wrap`}>
                            {product.content ? (
                                <div>{product.content}</div>
                            ) : (
                                <div>
                                    <h2 className={gTheme.accent}>Chapter 1: The Beginning</h2>
                                    <p className="leading-relaxed mb-6">
                                        {product.description || "No content available for this book."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-20 flex justify-between items-center border-t py-8 opacity-50">
                        <Button
                            variant="outline"
                            disabled={activeChapterIndex === 0}
                            onClick={() => {
                                window.scrollTo(0, 0);
                                setActiveChapterIndex(prev => Math.max(0, prev - 1));
                            }}
                        >
                            Previous Chapter
                        </Button>
                        <span className="text-sm">
                            {chapters && chapters.length > 0 ? `Chapter ${activeChapterIndex + 1} of ${chapters.length}` : 'End'}
                        </span>
                        <Button
                            variant="outline"
                            disabled={!chapters || activeChapterIndex >= chapters.length - 1}
                            onClick={() => {
                                window.scrollTo(0, 0);
                                setActiveChapterIndex(prev => prev + 1);
                            }}
                        >
                            Next Chapter
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}

function BookOpenIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    )
}
