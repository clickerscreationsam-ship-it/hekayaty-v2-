import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateCollection } from "@/hooks/use-collections";
import { useProducts } from "@/hooks/use-products";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search, CheckSquare, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: any;
}

export default function EditCollectionDialog({ open, onOpenChange, collection }: EditCollectionDialogProps) {
  const updateCollection = useUpdateCollection();
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
    isPublished: true,
    visibility: "public"
  });

  // Pre-fill form when collection changes
  useEffect(() => {
    if (collection) {
      setFormData({
        title: collection.title || "",
        description: collection.description || "",
        collectionType: collection.collection_type || "bundle",
        label: collection.label || "",
        price: collection.price?.toString() || "",
        originalTotalPrice: collection.original_total_price?.toString() || "",
        discountPercentage: collection.discount_percentage?.toString() || "",
        coverImageUrl: collection.cover_image_url || "",
        isPublished: collection.is_published ?? true,
        visibility: collection.visibility || "public"
      });
    }
  }, [collection]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((p: any) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.writerName && p.writerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allProducts, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCollection.mutateAsync({
        id: collection.id,
        data: {
          title: formData.title,
          description: formData.description,
          collectionType: formData.collectionType,
          label: formData.label,
          coverImageUrl: formData.coverImageUrl,
          price: parseFloat(formData.price),
          originalTotalPrice: formData.originalTotalPrice ? parseFloat(formData.originalTotalPrice) : undefined,
          discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
          isPublished: formData.isPublished,
          visibility: formData.visibility,
        }
      });
      
      toast({
        title: "تم تحديث المجموعة بنجاح",
        description: "تم حفظ جميع التغييرات."
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

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background border-primary/20 max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-gradient">تعديل المجموعة</DialogTitle>
          <DialogDescription>
            قم بتعديل بيانات المجموعة: <span className="text-primary font-bold">{collection.title}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Basic Info */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>عنوان المجموعة</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                  className="bg-white/5"
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
                  className="bg-white/5 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={formData.collectionType} onValueChange={(val) => setFormData({...formData, collectionType: val})}>
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

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>سعر البيع (ج.م)</Label>
                  <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required min="0" className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>السعر الأصلي</Label>
                  <Input type="number" value={formData.originalTotalPrice} onChange={e => setFormData({...formData, originalTotalPrice: e.target.value})} min="0" className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>الخصم %</Label>
                  <Input type="number" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: e.target.value})} min="0" max="100" className="bg-white/5" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.isPublished} onCheckedChange={c => setFormData({...formData, isPublished: c})} />
                  <Label>منشور</Label>
                </div>
                <Select value={formData.visibility} onValueChange={(val) => setFormData({...formData, visibility: val})}>
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

            {/* Right: Cover Image */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-bold">صورة الغلاف</Label>
                <CloudinaryUpload
                  onUpload={(url) => setFormData({ ...formData, coverImageUrl: url })}
                  defaultImage={formData.coverImageUrl}
                  aspectRatio="banner"
                  folder="hekayaty_collections"
                  label=""
                />
              </div>

              {/* Current cover preview */}
              {formData.coverImageUrl && (
                <div className="rounded-xl overflow-hidden border border-white/10 h-40">
                  <img src={formData.coverImageUrl} className="w-full h-full object-cover" alt="cover preview" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={updateCollection.isPending} className="bg-primary text-primary-foreground font-bold">
              {updateCollection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
