import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useUser } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Twitter, Instagram, Settings, Plus, Palette, X, ChevronLeft, ChevronRight } from "lucide-react";
import { StoreChat } from "@/components/StoreChat";
import { SEO } from "@/components/SEO";
import { usePortfolios, useCreateDesignRequest } from "@/hooks/use-commissions";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Product } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";


export default function WriterStore() {
  const [, params] = useRoute("/writer/:username");
  const username = params?.username || "";

  const { t } = useTranslation();
  const { user: currentUser } = useAuth(); // Get logged-in user
  const { data: user, isLoading: userLoading } = useUser(username);
  const { data: products, isLoading: productsLoading } = useProducts({ writerId: user?.id });

  // Check if the current user is viewing their own store
  const isOwnStore = currentUser?.username === username;

  if (userLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-4xl font-serif font-bold mb-4">{t("writerStore.notFoundTitle")}</h1>
        <p className="text-muted-foreground">{t("writerStore.notFoundSubtitle")}</p>
      </div>
    );
  }

  // Fallback for store settings
  const settings = user.storeSettings as any;
  const themeColor = settings?.themeColor || "#9333ea"; // Default purple
  const welcomeMessage = settings?.welcomeMessage || `Welcome to ${user.displayName}'s official store.`;
  const font = settings?.font || "serif";
  const headerLayout = settings?.headerLayout || "standard";

  const getFontClass = (f: string) => {
    switch (f) {
      case "sans": return "font-sans";
      case "display": return "font-display";
      default: return "font-serif";
    }
  };

  const fontClass = getFontClass(font);

  return (
    <div className="min-h-screen relative">
      <SEO
        title={`${user.displayName}'s Store`}
        description={user.bio || undefined}
        image={user.avatarUrl || user.bannerUrl || undefined}
      />
      <Navbar />

      {/* Full Page Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: `url(${user.bannerUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'})`,
        }}
      />

      {/* Dark Overlay for Readability */}
      <div className="fixed inset-0 z-0 bg-black/80 backdrop-blur-[2px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24">
        {/* Store Owner Welcome Banner */}
        {isOwnStore && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Palette className="w-6 h-6 text-primary" />
                  {t("writerStore.ownStoreWelcome")}
                </h3>
                <p className="text-muted-foreground">
                  {t("writerStore.ownStoreSubtitle")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button className="gap-2" size="lg">
                    <Settings className="w-4 h-4" />
                    {t("writerStore.customizeButton")}
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="gap-2" size="lg">
                    <Plus className="w-4 h-4" />
                    {t("writerStore.addProductButton")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-card shadow-2xl">
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}`}
              alt={user.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 pb-2">
            <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${fontClass}`}>{user.displayName}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-4">{user.bio}</p>
          </div>
          <div className="flex gap-4 pb-4">
            {user.storeSettings?.socialLinks?.map((link: any, i: number) => (
              <a
                key={i}
                href={link.url}
                className="p-3 rounded-full glass hover:bg-white/20 transition-colors text-foreground"
              >
                {link.platform === 'twitter' ? <Twitter className="w-5 h-5" /> :
                  link.platform === 'instagram' ? <Instagram className="w-5 h-5" /> :
                    <Globe className="w-5 h-5" />}
              </a>
            ))}
          </div>


        </div>

        {(headerLayout !== 'minimal') && (
          <div className="p-6 rounded-2xl glass-card mb-12 border-l-4" style={{ borderLeftColor: themeColor }}>
            <p className={`text-lg font-medium italic ${fontClass}`}>"{welcomeMessage}"</p>
          </div>
        )}

        <div className="mb-12">
          {user.role === 'artist' ? (
            <ArtistContent user={user} products={products} themeColor={themeColor} fontClass={fontClass} />
          ) : (
            <>
              <h2 className={`text-3xl font-bold mb-8 flex items-center gap-3 ${fontClass}`}>
                <span className="w-8 h-1 bg-primary rounded-full" style={{ backgroundColor: themeColor }}></span>
                {t("writerStore.publishedWorks")}
              </h2>

              {/* Filtering Toggle */}
              {(products?.some(p => p.type === 'merchandise') && products?.some(p => p.type !== 'merchandise')) && (
                <div className="flex justify-center mb-8">
                  <div className="glass p-1 rounded-xl flex gap-1">
                    <Button
                      variant={(params as any).filter === 'all' || !(params as any).filter ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => window.history.replaceState(null, "", window.location.pathname)}
                    >
                      {t("writerStore.allWorks")}
                    </Button>
                    <Button
                      variant={(params as any).filter === 'books' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => window.history.replaceState(null, "", `${window.location.pathname}?filter=books`)}
                    >
                      {t("dashboard.products.types.ebook")}
                    </Button>
                    <Button
                      variant={(params as any).filter === 'merch' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => window.history.replaceState(null, "", `${window.location.pathname}?filter=merch`)}
                    >
                      {t("dashboard.products.types.merchandise")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Books Section */}
              {((params as any).filter !== 'merch') && (
                <div className="space-y-8 mb-16">
                  {(products?.some(p => p.type === 'merchandise')) && (
                    <h3 className="text-xl font-bold opacity-60 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" /> {t("dashboard.products.types.ebook")}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products?.filter(p => p.type !== 'merchandise').map((product: Product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {/* Merchandise Section */}
              {((params as any).filter !== 'books') && products?.some(p => p.type === 'merchandise') && (
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> {t("dashboard.products.types.merchandise")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products?.filter(p => p.type === 'merchandise').map((product: Product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {(!products || products.length === 0) && (
                <p className="text-muted-foreground col-span-full py-10 text-center">
                  {t("writerStore.noWorks")}
                </p>
              )}
            </>
          )}
        </div>
      </div>



      <StoreChat storeId={user.id} storeName={user.displayName} />



      <Footer />
    </div >
  );
}

function ArtistContent({ user, products, themeColor, fontClass }: { user: any, products: any, themeColor: string, fontClass: string }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const { data: portfoliosResponse } = usePortfolios(user.id, selectedCategory);
  const { t } = useTranslation();

  const categories = ["All", "Cover", "Character", "Map", "UI", "Branding", "Other"];

  return (
    <Tabs defaultValue="portfolio" className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="portfolio" className="gap-2 px-6">
            <ImageIcon className="w-4 h-4" /> {t("writerStore.portfolio")}
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2 px-6">
            <Palette className="w-4 h-4" /> {t("writerStore.designAssets")}
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full text-xs h-8"
              style={selectedCategory === cat ? { backgroundColor: themeColor } : {}}
            >
              {t(`writerStore.categories.${cat}`)}
            </Button>
          ))}
        </div>
      </div>

      <TabsContent value="portfolio">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {portfoliosResponse?.data?.map((item: any) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-card hover:border-primary/50 transition-all duration-300 shadow-xl cursor-pointer"
            >
              <img src={item.imageUrl || item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-white/70 uppercase tracking-widest">{item.category}</p>
                  {item.yearCreated && <span className="text-[10px] text-white/50">{item.yearCreated}</span>}
                </div>
              </div>
            </div>
          ))}
          {(!portfoliosResponse?.data || portfoliosResponse.data.length === 0) && (
            <div className="col-span-full py-20 text-center glass-card rounded-2xl border-dashed border-white/10 border-2">
              <p className="text-muted-foreground">{t("writerStore.noPortfolio")}</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="assets">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products?.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {(!products || products.length === 0) && (
            <p className="text-muted-foreground col-span-full py-10 text-center">
              {t("writerStore.noAssets")}
            </p>
          )}
        </div>
      </TabsContent>

      {/* Hero Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-6xl bg-black/95 p-0 border-none h-[90vh] flex flex-col items-center justify-center">
          {selectedImage && <LightboxContent item={selectedImage} onClose={() => setSelectedImage(null)} />}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

function LightboxContent({ item, onClose }: { item: any, onClose: () => void }) {
  const images = [
    item.imageUrl || item.image_url,
    ...(item.additionalImages || item.additional_images || [])
  ].filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="w-full h-full flex flex-col relative text-white">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/40">
        <img
          src={images[currentIndex]}
          alt={item.title}
          className="max-w-full max-h-full object-contain shadow-2xl"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Details & Thumbnails */}
      <div className="p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 w-full shrink-0">
        <div className="flex flex-col md:flex-row gap-6 items-end justify-between max-w-7xl mx-auto">
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-serif mb-2">{item.title}</h2>
            <p className="text-gray-300 text-sm max-w-2xl">{item.description}</p>
            <div className="flex gap-2 mt-4">
              {item.tags?.split(',').map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-white/10 text-xs">{tag.trim()}</Badge>
              ))}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 max-w-md custom-scrollbar">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-primary opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




