import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Trophy, Crown, Star, BookOpen, Plus, Trash2, Edit3, Eye, EyeOff,
  Loader2, CheckCircle2, Users, ExternalLink, Save, X, Medal, Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  useAllAwards, useAwardWinners, useCreateAward, useUpdateAward,
  usePublishAward, useDeleteAward, useUpsertWinners, useDeleteWinner,
  useHallOfFame, useAddToHallOfFame, useRemoveFromHallOfFame, useUpdateHallOfFame,
  type AwardWinner, type HekayatyAward
} from "@/hooks/use-awards";
import { cn } from "@/lib/utils";

const BADGE_OPTIONS = ["كاتب نخبة", "أسطورة حكايتي", "راوي متميز", "كاتب بارز", "أيقونة الأدب"];
const CATEGORY_LABELS: Record<string, string> = {
  best_novel: "أفضل رواية",
  best_writer: "أفضل كاتب",
  best_publisher: "أفضل دار نشر",
};

// ============================================================
// Winner Slot Component
// ============================================================
function WinnerSlot({
  awardId, category, rank, winner, onSave, onRemove, allWriters, allProducts
}: {
  awardId: number;
  category: string;
  rank: number;
  winner?: AwardWinner;
  onSave: (data: Partial<AwardWinner>) => void;
  onRemove: (id: number) => void;
  allWriters: any[];
  allProducts: any[];
}) {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState(winner?.specialNote || "");
  const [badge, setBadge] = useState(winner?.badgeLabel || "");
  const [selectedId, setSelectedId] = useState<string | number | null>(
    category === "best_novel" ? winner?.winnerProductId || null : winner?.winnerUserId || null
  );

  const isUser = category !== "best_novel";
  const list = isUser ? allWriters : allProducts;
  const filtered = list.filter((item: any) => {
    const name = isUser ? item.display_name || item.displayName : item.title;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const getRankIcon = (r: number) => {
    if (r === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (r === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (r === 3) return <Award className="w-4 h-4 text-amber-500" />;
    return <span className="text-gray-500 text-xs font-bold">#{r}</span>;
  };

  const handleSave = () => {
    const payload: Partial<AwardWinner> = {
      awardId, category: category as any, rank,
      specialNote: note || undefined,
      badgeLabel: badge || undefined,
    };
    if (isUser) payload.winnerUserId = selectedId as string;
    else payload.winnerProductId = selectedId as number;
    onSave(payload);
    setEditing(false);
  };

  const displayName = winner
    ? (winner.user?.displayName || winner.product?.title || "—")
    : null;

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all",
      winner ? "border-white/15 bg-white/[0.03]" : "border-dashed border-white/10 bg-transparent"
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0">{getRankIcon(rank)}</div>
          {winner ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {winner.user?.avatarUrl && (
                <img src={winner.user.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" alt="" />
              )}
              {winner.product?.coverUrl && (
                <img src={winner.product.coverUrl} className="w-8 h-10 rounded object-cover border border-white/10 shrink-0" alt="" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                {winner.badgeLabel && <p className="text-[10px] text-yellow-400/70 font-bold">{winner.badgeLabel}</p>}
                {winner.specialNote && <p className="text-[10px] text-gray-500 truncate">{winner.specialNote}</p>}
              </div>
            </div>
          ) : (
            <span className="text-gray-600 text-sm">فارغ — اضغط تعديل للإضافة</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {winner && (
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
              onClick={() => winner.id && onRemove(winner.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
            onClick={() => setEditing(true)}>
            <Edit3 className="w-3.5 h-3.5" />
            {winner ? "تعديل" : "إضافة"}
          </Button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">
              ابحث واختر {isUser ? "الكاتب/الناشر" : "الرواية"}
            </Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`ابحث عن ${isUser ? "اسم..." : "عنوان الرواية..."}`}
              className="bg-white/5 border-white/10 text-white text-sm mb-2"
            />
            <div className="max-h-40 overflow-y-auto space-y-1 bg-black/30 rounded-lg border border-white/10 p-1">
              {filtered.slice(0, 20).map((item: any) => {
                const id = isUser ? item.id : item.id;
                const name = isUser ? (item.display_name || item.displayName) : item.title;
                const sub = isUser ? `@${item.username}` : item.genre;
                return (
                  <button key={item.id}
                    onClick={() => setSelectedId(id)}
                    className={cn(
                      "w-full text-right px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                      selectedId === id ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-white/5"
                    )}
                  >
                    <span className="flex-1 font-medium truncate">{name}</span>
                    {sub && <span className="text-[10px] text-gray-500 shrink-0">{sub}</span>}
                    {selectedId === id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="text-center text-gray-600 text-sm py-4">لا توجد نتائج</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">شارة العنوان</Label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white outline-none"
              >
                <option value="" className="bg-slate-900">اختر شارة...</option>
                {rank === 1 && <option value={`الأول في ${CATEGORY_LABELS[category]} ${new Date().getFullYear()}`} className="bg-slate-900">الأول</option>}
                {rank === 2 && <option value={`المركز الثاني`} className="bg-slate-900">الثاني</option>}
                {rank === 3 && <option value={`المركز الثالث`} className="bg-slate-900">الثالث</option>}
                <option value={`فائز جوائز حكايتي`} className="bg-slate-900">فائز جوائز حكايتي</option>
                <option value={`روايات مميزة`} className="bg-slate-900">مميز</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">ملاحظة خاصة (اختياري)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظة..." className="bg-white/5 border-white/10 text-white text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-gray-400">
              <X className="w-3.5 h-3.5 mr-1" /> إلغاء
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!selectedId}
              className="bg-primary hover:bg-primary/80 gap-1">
              <Save className="w-3.5 h-3.5" /> حفظ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Award Year Editor
// ============================================================
function AwardYearEditor({ award, onClose }: { award: HekayatyAward; onClose: () => void }) {
  const { toast } = useToast();
  const { data: winners, isLoading: winnersLoading } = useAwardWinners(award.id);
  const upsertWinners = useUpsertWinners();
  const deleteWinner = useDeleteWinner();

  const { data: allWriters = [] } = useQuery({
    queryKey: ["admin-all-writers-for-awards"],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("id, username, display_name, avatar_url").in("role", ["writer", "artist"]).order("display_name");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["admin-all-products-for-awards"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, cover_url, genre, writer_id").eq("is_published", true).order("title");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getWinner = (category: string, rank: number) =>
    winners?.find((w) => w.category === category && w.rank === rank);

  const handleSave = async (data: Partial<AwardWinner>) => {
    try {
      await upsertWinners.mutateAsync({ awardId: award.id, winners: [data] });
      toast({ title: "تم الحفظ ✅" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteWinner.mutateAsync({ winnerId: id, awardId: award.id });
      toast({ title: "تم الحذف" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      {winnersLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Best Writers */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-yellow-400 uppercase tracking-widest mb-4">
              <Crown className="w-4 h-4" /> أفضل الكتّاب (Top 3)
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((rank) => (
                <WinnerSlot key={rank} awardId={award.id} category="best_writer" rank={rank}
                  winner={getWinner("best_writer", rank)}
                  onSave={handleSave} onRemove={handleRemove}
                  allWriters={allWriters} allProducts={allProducts} />
              ))}
            </div>
          </div>

          {/* Best Publishers */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase tracking-widest mb-4">
              <Users className="w-4 h-4" /> أفضل دور النشر (Top 3)
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((rank) => (
                <WinnerSlot key={rank} awardId={award.id} category="best_publisher" rank={rank}
                  winner={getWinner("best_publisher", rank)}
                  onSave={handleSave} onRemove={handleRemove}
                  allWriters={allWriters} allProducts={allProducts} />
              ))}
            </div>
          </div>

          {/* Best Novels */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">
              <BookOpen className="w-4 h-4" /> أفضل الروايات (Top 10)
            </h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rank) => (
                <WinnerSlot key={rank} awardId={award.id} category="best_novel" rank={rank}
                  winner={getWinner("best_novel", rank)}
                  onSave={handleSave} onRemove={handleRemove}
                  allWriters={allWriters} allProducts={allProducts} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Awards Tab
// ============================================================
function AwardsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: awards, isLoading } = useAllAwards();
  const createAward = useCreateAward();
  const updateAward = useUpdateAward();
  const publishAward = usePublishAward();
  const deleteAward = useDeleteAward();

  const [showCreate, setShowCreate] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingAward, setEditingAward] = useState<HekayatyAward | null>(null);

  const handleCreate = async () => {
    try {
      await createAward.mutateAsync({ year: Number(newYear), title: newTitle, description: newDesc });
      toast({ title: "✅ تم إنشاء جائزة السنة" });
      setShowCreate(false);
      setNewYear(new Date().getFullYear().toString());
      setNewTitle("");
      setNewDesc("");
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handlePublish = async (award: HekayatyAward) => {
    const action = award.status === "published" ? "إلغاء نشر" : "نشر";
    if (!confirm(`هل تريد ${action} جوائز ${award.year}؟`)) return;
    try {
      await publishAward.mutateAsync({ id: award.id, publish: award.status !== "published" });
      toast({ title: award.status === "published" ? "تم إلغاء النشر" : "✅ تم النشر للعامة" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (award: HekayatyAward) => {
    if (!confirm(`هل تريد حذف جوائز ${award.year} بالكامل؟ هذا لا يمكن التراجع عنه.`)) return;
    try {
      await deleteAward.mutateAsync(award.id);
      toast({ title: "تم الحذف" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> جوائز حكايتي السنوية
          </h2>
          <p className="text-sm text-gray-400 mt-1">إنشاء وإدارة الجوائز السنوية للمنصة</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold">
          <Plus className="w-4 h-4" /> إنشاء سنة جديدة
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#0e0a1f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> إنشاء جائزة سنوية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300 mb-1 block">السنة *</Label>
              <Input value={newYear} onChange={(e) => setNewYear(e.target.value)} type="number"
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">عنوان الجائزة</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`جوائز حكايتي ${newYear}`}
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">وصف (اختياري)</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="وصف مختصر لهذه الدورة..." rows={3}
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">إلغاء</Button>
              <Button onClick={handleCreate} disabled={!newYear || createAward.isPending}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold gap-1">
                {createAward.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إنشاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Awards List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !awards?.length ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">لا توجد جوائز بعد</p>
          <p className="text-gray-600 text-sm mt-1">ابدأ بإنشاء جائزة لسنة جديدة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {awards.map((award) => (
            <Card key={award.id} className="glass-card border-white/10 bg-black/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shrink-0",
                      award.status === "published" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-white/5 text-gray-400 border border-white/10"
                    )}>
                      {award.year}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{award.title}</h3>
                        <Badge className={award.status === "published" ? "bg-green-500/15 text-green-400 border-green-500/25 text-[10px]" : "bg-orange-500/15 text-orange-400 border-orange-500/25 text-[10px]"}>
                          {award.status === "published" ? "منشور" : "مسودة"}
                        </Badge>
                      </div>
                      {award.description && <p className="text-sm text-gray-500 mt-0.5 truncate max-w-sm">{award.description}</p>}
                      {award.publishedAt && <p className="text-[10px] text-gray-600 mt-1">نُشر: {new Date(award.publishedAt).toLocaleDateString("ar-EG")}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`/awards`} target="_blank">
                      <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-gray-400 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => setEditingAward(award)}
                      className="h-8 px-3 gap-1 text-primary hover:bg-primary/10 text-xs font-bold">
                      <Edit3 className="w-3.5 h-3.5" /> تعديل الفائزين
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handlePublish(award)}
                      className={cn("h-8 px-3 gap-1 text-xs font-bold",
                        award.status === "published" ? "text-orange-400 hover:bg-orange-500/10" : "text-green-400 hover:bg-green-500/10"
                      )}>
                      {award.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {award.status === "published" ? "إلغاء النشر" : "نشر"}
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleDelete(award)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Winner Editor Dialog */}
      <Dialog open={!!editingAward} onOpenChange={() => setEditingAward(null)}>
        <DialogContent className="bg-[#0e0a1f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              فائزو جوائز حكايتي {editingAward?.year}
            </DialogTitle>
          </DialogHeader>
          {editingAward && <AwardYearEditor award={editingAward} onClose={() => setEditingAward(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Hall of Fame Tab
// ============================================================
function HallOfFameTab() {
  const { toast } = useToast();
  const { data: hofWriters, isLoading } = useHallOfFame();
  const addToHOF = useAddToHallOfFame();
  const removeFromHOF = useRemoveFromHallOfFame();
  const updateHOF = useUpdateHallOfFame();

  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedWriterId, setSelectedWriterId] = useState("");
  const [reason, setReason] = useState("");
  const [achievement, setAchievement] = useState("");
  const [badge, setBadge] = useState("كاتب نخبة");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBadge, setEditBadge] = useState("");
  const [editReason, setEditReason] = useState("");

  const { data: allWriters = [] } = useQuery({
    queryKey: ["admin-all-writers-hof"],
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url, is_verified")
        .in("role", ["writer", "artist"])
        .order("display_name");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const existingIds = hofWriters?.map((h) => h.writerId) || [];
  const availableWriters = allWriters.filter((w: any) =>
    !existingIds.includes(w.id) &&
    (w.display_name?.toLowerCase().includes(search.toLowerCase()) || w.username?.includes(search))
  );

  const handleAdd = async () => {
    if (!selectedWriterId) return;
    try {
      await addToHOF.mutateAsync({ writerId: selectedWriterId, featuredReason: reason, achievementNote: achievement, badgeLabel: badge });
      toast({ title: "✅ تم إضافة الكاتب لقاعة الشهرة" });
      setShowAdd(false);
      setSelectedWriterId("");
      setReason("");
      setAchievement("");
      setBadge("كاتب نخبة");
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!confirm(`هل تريد إزالة "${name}" من قاعة الشهرة؟`)) return;
    try {
      await removeFromHOF.mutateAsync(id);
      toast({ title: "تم الإزالة" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await updateHOF.mutateAsync({ id, badgeLabel: editBadge, featuredReason: editReason });
      toast({ title: "تم التحديث ✅" });
      setEditingId(null);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" /> قاعة الشهرة الدائمة
          </h2>
          <p className="text-sm text-gray-400 mt-1">الكتّاب النخبة المختارون يدوياً من قِبل الإدارة</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-primary hover:bg-primary/80 font-bold">
          <Plus className="w-4 h-4" /> إضافة كاتب
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0e0a1f] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" /> إضافة كاتب لقاعة الشهرة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300 mb-1.5 block">ابحث عن كاتب</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="اكتب الاسم للبحث..."
                className="bg-white/5 border-white/10 text-white mb-2" />
              <div className="max-h-44 overflow-y-auto bg-black/30 rounded-lg border border-white/10 p-1">
                {availableWriters.slice(0, 15).map((w: any) => (
                  <button key={w.id} onClick={() => setSelectedWriterId(w.id)}
                    className={cn(
                      "w-full text-right px-3 py-2 rounded-lg flex items-center gap-3 transition-colors",
                      selectedWriterId === w.id ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-white/5"
                    )}>
                    <img src={w.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.display_name)}&background=1c1c2e&color=fff&size=40`}
                      className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" alt="" />
                    <div className="text-right flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{w.display_name}</div>
                      <div className="text-[10px] text-gray-500">@{w.username}</div>
                    </div>
                    {selectedWriterId === w.id && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
                {availableWriters.length === 0 && <p className="text-center text-gray-600 text-sm py-4">لا يوجد نتائج</p>}
              </div>
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">الشارة</Label>
              <select value={badge} onChange={(e) => setBadge(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white outline-none">
                {BADGE_OPTIONS.map((b) => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">سبب الاختيار (اختياري)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="لماذا يستحق هذا الكاتب الظهور؟"
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">إنجاز مميز (اختياري)</Label>
              <Input value={achievement} onChange={(e) => setAchievement(e.target.value)}
                placeholder="مثال: أكثر من 100 قصة منشورة"
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAdd(false)} className="text-gray-400">إلغاء</Button>
              <Button onClick={handleAdd} disabled={!selectedWriterId || addToHOF.isPending}
                className="bg-primary hover:bg-primary/80 gap-1">
                {addToHOF.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إضافة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* HOF List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !hofWriters?.length ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Star className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">قاعة الشهرة فارغة</p>
          <p className="text-gray-600 text-sm mt-1">أضف أول كاتب نخبة للمنصة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hofWriters.map((entry, idx) => (
            <Card key={entry.id} className="glass-card border-white/10 bg-black/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-gray-600 font-bold text-sm w-5 text-center shrink-0">#{idx + 1}</div>
                  <img
                    src={entry.writer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.writer?.displayName || "U")}&background=1c1c2e&color=fff&size=80`}
                    className="w-12 h-12 rounded-full object-cover border border-yellow-500/20 shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{entry.writer?.displayName}</span>
                      {entry.writer?.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[10px]">{entry.badgeLabel}</Badge>
                      {entry.featuredReason && <span className="text-xs text-gray-500 truncate">{entry.featuredReason}</span>}
                    </div>
                    {entry.achievementNote && <p className="text-[10px] text-gray-600 mt-0.5">{entry.achievementNote}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`/writer/${entry.writer?.username}`} target="_blank">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(entry.id); setEditBadge(entry.badgeLabel); setEditReason(entry.featuredReason || ""); }}
                      className="h-7 px-2 gap-1 text-primary hover:bg-primary/10 text-xs">
                      <Edit3 className="w-3 h-3" /> تعديل
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleRemove(entry.id, entry.writer?.displayName || "الكاتب")}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {editingId === entry.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400 mb-1 block">الشارة</Label>
                      <select value={editBadge} onChange={(e) => setEditBadge(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white outline-none">
                        {BADGE_OPTIONS.map((b) => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400 mb-1 block">سبب الاختيار</Label>
                      <Input value={editReason} onChange={(e) => setEditReason(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-sm" />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-gray-400 text-xs">إلغاء</Button>
                      <Button size="sm" onClick={() => handleSaveEdit(entry.id)} className="bg-primary hover:bg-primary/80 text-xs gap-1">
                        <Save className="w-3 h-3" /> حفظ
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Export
// ============================================================
export function AwardsAdmin() {
  return (
    <div className="mt-6 space-y-6">
      <Card className="glass-card border-white/10 bg-black/60 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-purple-500/5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gradient">الجوائز وقاعة الشهرة</CardTitle>
              <CardDescription>إدارة الجوائز السنوية وقاعة الشهرة الدائمة للكتّاب</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="awards">
            <TabsList className="bg-white/5 border border-white/10 mb-6">
              <TabsTrigger value="awards" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 gap-2">
                <Trophy className="w-4 h-4" /> الجوائز السنوية
              </TabsTrigger>
              <TabsTrigger value="hof" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
                <Star className="w-4 h-4" /> قاعة الشهرة
              </TabsTrigger>
            </TabsList>
            <TabsContent value="awards"><AwardsTab /></TabsContent>
            <TabsContent value="hof"><HallOfFameTab /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
