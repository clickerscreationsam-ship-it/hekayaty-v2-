import { useState } from "react";
import { useAdminSpotlight, useSpotlightMutations, SpotlightItem } from "@/hooks/use-spotlight";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Trash2, Eye, EyeOff, Plus, Search, BookOpen, Loader2, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

const BADGE_OPTIONS = [
  "Editor's Pick",
  "Hidden Gem",
  "Rising Star",
  "Must Read",
  "Community Favorite",
  "Best Seller",
  "New Release",
  "Award Winner",
];

async function searchProducts(query: string) {
  if (!query || query.length < 2) return [];
  
  const s = `%${query}%`;
  const { data, error } = await supabase
    .from('products')
    .select('id, title, cover_url, type')
    .eq('is_published', true)
    .or(`title.ilike.${s},description.ilike.${s}`)
    .limit(8);
    
  if (error) {
    console.error("Search error:", error);
    return [];
  }
  
  return data || [];
}

export default function SpotlightAdmin() {
  const { user } = useAuth();
  const { data: spotlightItems, isLoading } = useAdminSpotlight();
  const { add, update, remove } = useSpotlightMutations();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [badge, setBadge] = useState("Editor's Pick");
  const [editorialNote, setEditorialNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBadge, setEditBadge] = useState("");
  const [editNote, setEditNote] = useState("");

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const results = await searchProducts(q);
    setSearchResults(Array.isArray(results) ? results.slice(0, 8) : []);
    setIsSearching(false);
  };

  const handleAdd = () => {
    if (!selectedProduct || !user) return;
    add.mutate({
      productId: selectedProduct.id,
      badge,
      editorialNote,
      isActive: true,
    }, {
      onSuccess: () => {
        setSelectedProduct(null);
        setSearchQuery("");
        setSearchResults([]);
        setEditorialNote("");
        setBadge("Editor's Pick");
      }
    });
  };

  const startEdit = (item: SpotlightItem) => {
    setEditingId(item.id);
    setEditBadge(item.badge);
    setEditNote(item.editorialNote || item.editorial_note || "");
  };

  const saveEdit = () => {
    if (!editingId) return;
    update.mutate({ id: editingId, badge: editBadge, editorialNote: editNote }, {
      onSuccess: () => setEditingId(null)
    });
  };

  const toggleActive = (item: SpotlightItem) => {
    const isActive = item.isActive ?? item.is_active;
    update.mutate({ id: item.id, isActive: !isActive });
  };

  const handleRemove = (id: number) => {
    if (confirm("هل أنت متأكد من إزالة هذا الكتاب من Spotlight؟")) {
      remove.mutate(id);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <Sparkles className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">إدارة Hekayaty Spotlight</h2>
          <p className="text-muted-foreground">اختر الكتب التي تريد عرضها في واجهة Spotlight الاحترافية.</p>
        </div>
      </div>

      {/* Add Book Card */}
      <Card className="glass-card border-amber-500/20 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-300">
            <Plus className="w-5 h-5" />
            إضافة كتاب إلى Spotlight
          </CardTitle>
          <CardDescription>ابحث عن كتاب منشور وأضفه مع شارة وملاحظة تحريرية.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Search */}
          <div className="space-y-2">
            <Label>البحث عن كتاب</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="اكتب اسم الكتاب..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-white/5 border-white/10 pr-10"
                dir="rtl"
              />
            </div>

            {/* Search Results */}
            {(searchResults.length > 0 || isSearching) && !selectedProduct && (
              <div className="bg-black/80 border border-white/10 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> جاري البحث...
                  </div>
                ) : searchResults.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setSearchQuery(p.title); setSearchResults([]); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-right border-b border-white/5 last:border-0"
                  >
                    <img
                      src={p.coverUrl || p.cover_url}
                      alt={p.title}
                      className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x56/111/amber?text=📖"; }}
                    />
                    <div className="text-right overflow-hidden">
                      <p className="font-semibold text-sm truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected product */}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <img
                  src={selectedProduct.coverUrl || selectedProduct.cover_url}
                  alt={selectedProduct.title}
                  className="w-10 h-14 object-cover rounded-md"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x56/111/amber?text=📖"; }}
                />
                <div className="flex-1 text-right">
                  <p className="font-bold text-amber-300">{selectedProduct.title}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedProduct.id}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setSearchQuery(""); }}>
                  ✕
                </Button>
              </div>
            )}
          </div>

          {/* Badge & Note */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الشارة</Label>
              <Select value={badge} onValueChange={setBadge}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  {BADGE_OPTIONS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>الملاحظة التحريرية (اختيارية)</Label>
              <Textarea
                placeholder="اكتب سبب اختيارك لهذا الكتاب..."
                value={editorialNote}
                onChange={(e) => setEditorialNote(e.target.value)}
                className="bg-white/5 border-white/10 h-20 resize-none"
                dir="rtl"
              />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!selectedProduct || add.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700 gap-2 font-bold"
          >
            {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            إضافة إلى Spotlight
          </Button>
        </CardContent>
      </Card>

      {/* Current Spotlight Items */}
      <Card className="glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            كتب Spotlight الحالية
            <Badge className="bg-amber-600/20 text-amber-400 border border-amber-500/30 ml-2">
              {spotlightItems?.filter(i => i.isActive ?? i.is_active)?.length ?? 0} نشط
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          ) : !spotlightItems || spotlightItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد كتب في Spotlight حتى الآن.</p>
              <p className="text-sm">أضف أول كتاب باستخدام النموذج أعلاه.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {spotlightItems.map((item) => {
                const product = item.product;
                const isActive = item.isActive ?? (item as any).is_active;
                const note = item.editorialNote || (item as any).editorial_note;
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border transition-all",
                      isActive
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-white/2 border-white/5 opacity-60"
                    )}
                  >
                    {/* Cover */}
                    {product && (
                      <img
                        src={product.coverUrl || product.cover_url}
                        alt={product.title}
                        className="w-14 h-20 object-cover rounded-lg flex-shrink-0 shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/56x80/111/amber?text=📖"; }}
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {product && (
                        <Link href={`/product/${product.id}`}>
                          <h4 className="font-bold text-foreground hover:text-amber-400 transition-colors cursor-pointer">
                            {product.title}
                          </h4>
                        </Link>
                      )}

                      {isEditing ? (
                        <div className="space-y-2 mt-2">
                          <Select value={editBadge} onValueChange={setEditBadge}>
                            <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-white/10">
                              {BADGE_OPTIONS.map((b) => (
                                <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="bg-white/5 border-white/10 h-16 resize-none text-xs"
                            dir="rtl"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} disabled={update.isPending} className="bg-amber-600 hover:bg-amber-700 h-7 text-xs gap-1">
                              {update.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              حفظ
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs">
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Badge className="mt-1 bg-amber-600/20 text-amber-400 border border-amber-500/30 text-xs">
                            ✨ {item.badge}
                          </Badge>
                          {note && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2" dir="rtl">
                              "{note}"
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEdit(item)}
                          title="تعديل"
                        >
                          <BookOpen className="w-4 h-4 text-amber-400" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => toggleActive(item)}
                          title={isActive ? "إخفاء من العرض" : "إظهار للعرض"}
                        >
                          {isActive ? (
                            <Eye className="w-4 h-4 text-green-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-destructive/10"
                          onClick={() => handleRemove(item.id)}
                          title="إزالة من Spotlight"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
