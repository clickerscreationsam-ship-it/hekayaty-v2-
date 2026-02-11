import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCollection, useUpdateCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch as UISwitch } from "@/components/ui/switch";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import {
    Save, Loader2, GripVertical, Plus, Trash2,
    CheckCircle2, AlertCircle, LayoutGrid,
    ArrowRight, Info, DollarSign, Percent, Sparkles
} from "lucide-react";
import { motion, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

interface CollectionEditorProps {
    collId: string;
    allStories: any[];
}

export function CollectionEditor({ collId, allStories }: CollectionEditorProps) {
    const { t } = useTranslation();
    const { data: collection, isLoading } = useCollection(collId);
    const updateCollection = useUpdateCollection();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [coverUrl, setCoverUrl] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [selectedStoryIds, setSelectedStoryIds] = useState<number[]>([]);

    useEffect(() => {
        if (collection) {
            setTitle(collection.title || "");
            setDescription(collection.description || "");
            setPrice(parseFloat(collection.price) || 0);
            setDiscount(parseFloat(collection.discount_percentage) || 0);
            setCoverUrl(collection.cover_image_url || "");
            setIsPublished(collection.is_published || false);
            setSelectedStoryIds(collection.items?.map((i: any) => i.story_id) || []);
        }
    }, [collection]);

    const handleSave = () => {
        updateCollection.mutate({
            id: collId,
            title,
            description,
            price,
            discount_percentage: discount,
            cover_image_url: coverUrl,
            is_published: isPublished,
            storyIds: selectedStoryIds
        });
    };

    const toggleStory = (id: number) => {
        if (selectedStoryIds.includes(id)) {
            setSelectedStoryIds(selectedStoryIds.filter(sid => sid !== id));
        } else {
            setSelectedStoryIds([...selectedStoryIds, id]);
        }
    };

    const totalIndividualPrice = selectedStoryIds.reduce((sum, id) => {
        const story = allStories.find(s => s.id === id);
        return sum + (story?.price || 0);
    }, 0);

    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-secondary w-12 h-12" /></div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full overflow-hidden"
        >
            <header className="h-16 border-b border-white/5 bg-black/20 flex items-center justify-between px-8 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <h1 className="font-serif font-bold text-xl">{title || t("studio.collections.new")}</h1>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={updateCollection.isPending}
                    className="bg-secondary hover:bg-secondary/90 text-white gap-2 rounded-full px-6"
                >
                    {updateCollection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t("common.save")}
                </Button>
            </header>

            <div className="flex-grow overflow-y-auto p-12">
                <div className="max-w-5xl mx-auto space-y-12 pb-24">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12">
                        <div className="space-y-12">
                            {/* Basic Info */}
                            <section className="space-y-6">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">{t("studio.market.identity")}</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{t("studio.market.title")}</label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="bg-white/5 border-white/10 h-12 text-lg font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{t("studio.market.description")}</label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="bg-white/5 border-white/10 min-h-[120px] resize-none"
                                            dir="auto"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Story Selection */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">{t("studio.collections.selectStories")}</h2>
                                    <span className="text-xs font-bold px-2 py-0.5 bg-white/5 rounded-full text-muted-foreground">
                                        {selectedStoryIds.length} {t("home.collections.storiesCount")}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {allStories?.map(story => (
                                        <button
                                            key={story.id}
                                            onClick={() => toggleStory(story.id)}
                                            className={cn(
                                                "p-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                                                selectedStoryIds.includes(story.id)
                                                    ? "bg-secondary/10 border-secondary/30 ring-1 ring-secondary/20"
                                                    : "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <div className="w-10 h-14 bg-black/40 rounded overflow-hidden shrink-0 border border-white/10">
                                                {story.coverUrl && <img src={story.coverUrl} className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold truncate">{story.title}</div>
                                                <div className="text-[10px] text-muted-foreground">{story.price} {t("common.egp")}</div>
                                            </div>
                                            {selectedStoryIds.includes(story.id) && <CheckCircle2 className="w-4 h-4 text-secondary ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Ordering */}
                            {selectedStoryIds.length > 0 && (
                                <section className="space-y-6">
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">{t("studio.collections.orderStories")}</h2>
                                    <Reorder.Group axis="y" values={selectedStoryIds} onReorder={setSelectedStoryIds} className="space-y-2">
                                        {selectedStoryIds.map(id => {
                                            const story = allStories.find(s => s.id === id);
                                            return (
                                                <Reorder.Item key={id} value={id}>
                                                    <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl group cursor-grab active:cursor-grabbing hover:border-white/10 transition-colors">
                                                        <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-white" />
                                                        <span className="font-bold text-sm truncate">{story?.title}</span>
                                                    </div>
                                                </Reorder.Item>
                                            );
                                        })}
                                    </Reorder.Group>
                                </section>
                            )}
                        </div>

                        <div className="space-y-8">
                            {/* Cover Upload */}
                            <section className="space-y-4">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">{t("studio.market.cover")}</h2>
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl bg-white/5">
                                    <CloudinaryUpload
                                        label={t("studio.market.coverLabel")}
                                        defaultImage={coverUrl}
                                        folder="collection_covers"
                                        onUpload={setCoverUrl}
                                    />
                                </div>
                            </section>

                            {/* Pricing Card */}
                            <section className="p-6 rounded-3xl bg-secondary/5 border border-secondary/20 space-y-6">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-4">{t("studio.collections.analytics")}</h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs text-muted-foreground/60 uppercase font-bold">
                                        <span>{t("studio.collections.individualTotal")}</span>
                                        <span>{totalIndividualPrice} {t("common.egp")}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{t("studio.collections.bundlePrice")}</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                            <Input
                                                type="number"
                                                value={price === 0 ? "" : price}
                                                onChange={(e) => setPrice(Number(e.target.value))}
                                                className="bg-black/40 border-secondary/20 h-12 pl-10 text-xl font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{t("studio.collections.discount")} (%)</label>
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                            <Input
                                                type="number"
                                                value={discount === 0 ? "" : discount}
                                                onChange={(e) => setDiscount(Number(e.target.value))}
                                                className="bg-black/40 border-secondary/20 h-12 pl-10 text-xl font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {price < totalIndividualPrice && (
                                        <div className="p-3 bg-secondary/20 rounded-xl flex items-center gap-3 text-secondary border border-secondary/20">
                                            <Sparkles className="w-5 h-5 shrink-0" />
                                            <div className="text-[10px] font-bold leading-tight">
                                                {t("studio.collections.youSave")}: <br />
                                                <span className="text-sm font-black text-white">{totalIndividualPrice - price} {t("common.egp")}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Publish Status */}
                            <section className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-sm font-bold">{isPublished ? t("studio.market.status.publicTitle") : t("studio.market.status.draftTitle")}</h3>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold">
                                            <div className={cn("w-2 h-2 rounded-full", isPublished ? "bg-green-500" : "bg-amber-500")} />
                                            {isPublished ? t("studio.published_simple") : t("studio.draft_simple")}
                                        </div>
                                    </div>
                                    <UISwitch checked={isPublished} onCheckedChange={setIsPublished} />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
