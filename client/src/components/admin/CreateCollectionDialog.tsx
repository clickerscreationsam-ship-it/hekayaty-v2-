import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateCollection } from "@/hooks/use-collections";
import { useProducts } from "@/hooks/use-products";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search, CheckSquare, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCollectionDialog({ open, onOpenChange }: CreateCollectionDialogProps) {
  const createCollection = useCreateCollection();
  const { data: allProducts, isLoading: isLoadingProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    collectionType: "bundle",
    label: "",
    price: "",
    originalTotalPrice: "",
    discountPercentage: "",
    coverImageUrl: "",
    bookIds: [] as number[],
    isPublished: true,
    visibility: "public"
  });

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((p: any) => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.writerName && p.writerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allProducts, searchQuery]);

  const toggleProduct = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      bookIds: prev.bookIds.includes(productId) 
        ? prev.bookIds.filter(id => id !== productId)
        : [...prev.bookIds, productId]
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0621-\u064A\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') + '-' + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.bookIds.length === 0) {
        throw new Error("يجب اختيار منتج واحد على الأقل للمجموعة.");
      }

      await createCollection.mutateAsync({
        ...formData,
        slug: generateSlug(formData.title),
        price: parseFloat(formData.price),
        originalTotalPrice: formData.originalTotalPrice ? parseFloat(formData.originalTotalPrice) : undefined,
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
      });
      
      toast({
        title: "تم إنشاء المجموعة بنجاح",
        description: "تم إضافة المجموعة إلى النظام."
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-background border-primary/20 max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-gradient">مجموعة جديدة</DialogTitle>
          <DialogDescription>
            قم بإنشاء مجموعة أو حزمة منتجات جديدة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Right Column: Basic Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>عنوان المجموعة</Label>
                <Input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                  className="bg-white/5"
                  placeholder="مثال: حزمة روايات الخيال العلمي"
                />
              </div>

              <div className="space-y-2">
                <Label>لافتة خاصة (اختياري)</Label>
                <Input 
                  value={formData.label}
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  className="bg-white/5"
                  placeholder="مثال: لفترة محدودة"
                />
                <p className="text-xs text-amber-400/70">⚡ ستظهر كبادج متوهج على الكارت</p>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="bg-white/5 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select 
                    value={formData.collectionType} 
                    onValueChange={(val) => setFormData({...formData, collectionType: val})}
                  >
                    <SelectTrigger className="bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bundle">حزمة (Bundle)</SelectItem>
                      <SelectItem value="series">سلسلة (Series)</SelectItem>
                      <SelectItem value="event">حدث (Event)</SelectItem>
                      <SelectItem value="sale">تخفيض (Sale)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>صورة الغلاف</Label>
                  <CloudinaryUpload
                    onUpload={(url) => setFormData({ ...formData, coverImageUrl: url })}
                    defaultImage={formData.coverImageUrl}
                    aspectRatio="square"
                    folder="hekayaty_collections"
                    label=""
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>سعر البيع (ج.م)</Label>
                  <Input 
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    className="bg-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>السعر الأصلي (اختياري)</Label>
                  <Input 
                    type="number"
                    value={formData.originalTotalPrice}
                    onChange={e => setFormData({...formData, originalTotalPrice: e.target.value})}
                    min="0"
                    step="0.01"
                    className="bg-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نسبة الخصم %</Label>
                  <Input 
                    type="number"
                    value={formData.discountPercentage}
                    onChange={e => setFormData({...formData, discountPercentage: e.target.value})}
                    min="0"
                    max="100"
                    className="bg-white/5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.isPublished}
                    onCheckedChange={c => setFormData({...formData, isPublished: c})}
                  />
                  <Label>نشر فوراً</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>الرؤية:</Label>
                  <Select 
                    value={formData.visibility} 
                    onValueChange={(val) => setFormData({...formData, visibility: val})}
                  >
                    <SelectTrigger className="w-[120px] bg-white/5 border-none h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">عام</SelectItem>
                      <SelectItem value="unlisted">غير مدرج</SelectItem>
                      <SelectItem value="private">خاص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Left Column: Product Selection */}
            <div className="space-y-4 flex flex-col h-full bg-white/5 p-4 rounded-xl border border-white/10">
              <div>
                <Label className="text-lg font-bold mb-2 block">المنتجات المتضمنة ({formData.bookIds.length})</Label>
                <p className="text-xs text-muted-foreground mb-4">ابحث واختر المنتجات التي تود إضافتها لهذه الحزمة</p>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="ابحث باسم الكتاب أو المؤلف..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/20 pr-10 border-white/10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 h-[400px] rounded-lg border border-white/10 bg-black/20 p-2">
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="space-y-2">
                    {filteredProducts.map((product: any) => {
                      const isSelected = formData.bookIds.includes(product.id);
                      return (
                        <div 
                          key={product.id}
                          onClick={() => toggleProduct(product.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                            isSelected ? "bg-primary/20 border-primary/50" : "bg-white/5 border-transparent hover:bg-white/10"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          {product.coverUrl && (
                            <img src={product.coverUrl} className="w-10 h-14 rounded object-cover shrink-0 bg-black" alt="" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate text-white">{product.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{product.writerName}</p>
                          </div>
                          <div className="text-sm font-bold text-primary shrink-0">
                            {product.price > 0 ? `${product.price} ج.م` : 'مجاني'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    لا يوجد منتجات مطابقة للبحث
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createCollection.isPending || formData.bookIds.length === 0} className="bg-primary text-primary-foreground font-bold">
              {createCollection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ المجموعة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
