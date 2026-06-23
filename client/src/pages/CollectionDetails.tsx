import { useRoute, useLocation } from "wouter";
import { useCollection } from "@/hooks/use-collections";
import { useAddToCart } from "@/hooks/use-cart";
import { useUserOrders } from "@/hooks/use-orders";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, Library, CheckCircle, Percent, Unlock } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

// Map raw Supabase snake_case product to the camelCase shape ProductCard expects
function mapProduct(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    writerId: p.writer_id,
    title: p.title,
    description: p.description,
    coverUrl: p.cover_url,        // ← KEY FIX: snake_case → camelCase
    fileUrl: p.file_url,
    type: p.type,
    genre: p.genre,
    isPublished: p.is_published ?? false,
    rating: p.rating ?? 0,
    reviewCount: p.review_count ?? 0,
    price: p.price,
    licenseType: p.license_type ?? 'personal',
    isSerialized: p.is_serialized ?? false,
    seriesStatus: p.series_status ?? 'ongoing',
    salesCount: p.sales_count ?? 0,
    createdAt: p.created_at,
  } as any;
}

export default function CollectionDetails() {
  const [, params] = useRoute("/collections/:slug");
  const slug = params?.slug || "";
  const { data: collection, isLoading, error } = useCollection(slug);
  const addToCart = useAddToCart();
  const { data: orders } = useUserOrders();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if collection is already purchased
  const hasPurchased = orders?.some((order: any) => 
    order.isVerified && order.order_items?.some((item: any) => item.product?.collectionId === collection?.id)
  );

  // Redirect to reader if already purchased
  if (hasPurchased) {
    setLocation(`/collections/${slug}/read`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <Library className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
        <h1 className="text-3xl font-bold font-serif mb-2">المجموعة غير موجودة</h1>
        <p className="text-muted-foreground mb-6">عذراً، لم نتمكن من العثور على هذه المجموعة أو تم إزالتها.</p>
        <Button onClick={() => setLocation("/market")}>العودة للمتجر</Button>
      </div>
    );
  }

  const handleAddToCart = async () => {
    try {
      await addToCart.mutateAsync({
        userId: "",
        collectionId: collection.id,
        quantity: 1
      } as any);
      toast({
        title: "تمت الإضافة للسلة",
        description: `تمت إضافة ${collection.title} إلى سلة التسوق.`
      });
    } catch (e: any) {
      toast({
        title: "حدث خطأ",
        description: e.message || "فشل في الإضافة للسلة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col selection:bg-primary/30">
      <SEO 
        title={collection.title} 
        description={collection.description || `استكشف ${collection.title} على حكايتي`} 
      />

      {/* Immersive Background Layer */}
      {collection.cover_image_url && (
        <>
          <div
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 scale-105"
            style={{ 
              backgroundImage: `url(${collection.cover_image_url})`,
              filter: 'brightness(0.5) saturate(1.2)' 
            }}
          />
          <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-black/20 to-black" />
        </>
      )}
      {!collection.cover_image_url && (
        <div className="fixed inset-0 z-0 bg-background" />
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-16">
            {/* Image / Banner */}
            <div className="md:col-span-5 lg:col-span-4 relative group">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 bg-card border border-white/10 aspect-[3/4]"
              >
                {collection.cover_image_url ? (
                  <img 
                    src={collection.cover_image_url} 
                    alt={collection.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                    <Library className="w-20 h-20 text-muted-foreground opacity-30 mb-4" />
                    <span className="font-bold opacity-50">بدون غلاف</span>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Badge className="bg-primary text-primary-foreground font-bold shadow-lg text-sm px-3 py-1">
                    {collection.collection_type === 'bundle' ? 'حزمة' :
                     collection.collection_type === 'series' ? 'سلسلة' :
                     collection.collection_type === 'event' ? 'حدث' : 'تخفيض'}
                  </Badge>
                  {collection.label && (
                    <Badge className="bg-amber-500 text-black font-bold shadow-lg animate-pulse">
                      {collection.label}
                    </Badge>
                  )}
                  {collection.discount_percentage > 0 && (
                    <Badge className="bg-red-500 text-white font-bold shadow-lg gap-1">
                      <Percent className="w-3 h-3" /> خصم {collection.discount_percentage}%
                    </Badge>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Details */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-4xl md:text-5xl font-black font-serif text-gradient mb-4 leading-tight">
                  {collection.title}
                </h1>
                
                <div className="prose prose-invert max-w-none text-lg text-muted-foreground mb-8 leading-relaxed">
                  {collection.description ? (
                    <p>{collection.description}</p>
                  ) : (
                    <p className="italic opacity-70">لا يوجد وصف متاح لهذه المجموعة.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mb-10 items-end">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">السعر الإجمالي</span>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-black text-primary">{collection.price}</span>
                      <span className="text-2xl font-bold mb-1">ج.م</span>
                    </div>
                  </div>
                  
                  {collection.original_total_price > collection.price && (
                    <div className="flex flex-col justify-end pb-1.5 opacity-50">
                      <span className="text-sm line-through decoration-red-500/50 decoration-2 font-bold text-muted-foreground">
                        بدلاً من {collection.original_total_price} ج.م
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-8">
                  {hasPurchased ? (
                    <Button 
                      disabled
                      size="lg"
                      className="h-14 px-8 text-lg font-bold rounded-xl shadow-xl shadow-green-500/30 bg-green-500/20 text-green-500 border border-green-500/30 w-full md:w-auto"
                    >
                      <Unlock className="w-5 h-5 mr-2" />
                      تم شراء المجموعة
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleAddToCart}
                      disabled={addToCart.isPending}
                      size="lg"
                      className="h-14 px-8 text-lg font-bold rounded-xl shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform bg-primary text-primary-foreground w-full md:w-auto"
                    >
                      {addToCart.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
                      أضف إلى السلة
                    </Button>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm font-bold text-green-500 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                    <CheckCircle className="w-4 h-4" />
                    وصول فوري بعد الدفع
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Included Products */}
          {collection.items && collection.items.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-20"
            >
              <div className="flex items-center gap-3 mb-8">
                <Library className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold font-serif">محتويات المجموعة</h2>
                <Badge variant="outline" className="text-lg font-bold px-3 ml-2 border-white/20">
                  {collection.items.length} منتجات
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {collection.items.map((item: any, index: number) => {
                  const mappedProduct = mapProduct(item.product);
                  if (!mappedProduct) return null;
                  return (
                    <div key={mappedProduct.id || index} className="relative group">
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg z-10 border-2 border-background">
                        {(item.order_index ?? index) + 1}
                      </div>
                      <ProductCard product={mappedProduct} locked={!hasPurchased} />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>
      </main>

      <Footer />
      </div>
    </div>
  );
}
