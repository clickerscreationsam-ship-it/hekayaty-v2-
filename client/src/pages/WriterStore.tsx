import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useUser } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Twitter, Instagram, Settings, Plus, Palette } from "lucide-react";
import { StoreChat } from "@/components/StoreChat";
import { SEO } from "@/components/SEO";
import { usePortfolios, useCreateDesignRequest } from "@/hooks/use-commissions";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Product } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PrivateStoreChat } from "@/components/PrivateStoreChat";

export default function WriterStore() {
  const [, params] = useRoute("/writer/:username");
  const username = params?.username || "";

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
        <h1 className="text-4xl font-serif font-bold mb-4">Writer Not Found</h1>
        <p className="text-muted-foreground">The scribe you are looking for has not yet chronicled their tale here.</p>
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
                  Welcome to Your Store! 🎨
                </h3>
                <p className="text-muted-foreground">
                  Make it yours! Customize your appearance, add your logo, and start publishing your amazing work.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button className="gap-2" size="lg">
                    <Settings className="w-4 h-4" />
                    Customize Store
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="gap-2" size="lg">
                    <Plus className="w-4 h-4" />
                    Add Product
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
                Published Works
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products?.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
                {(!products || products.length === 0) && (
                  <p className="text-muted-foreground col-span-full py-10 text-center">
                    This scribe hasn't published any items yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>



      <StoreChat storeId={user.id} storeName={user.displayName} />

      {/* Private Chat for 1-on-1 */}
      {
        currentUser && !isOwnStore && (
          <PrivateStoreChat artistId={user.id} artistName={user.displayName} />
        )
      }

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
            <ImageIcon className="w-4 h-4" /> Portfolio
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2 px-6">
            <Palette className="w-4 h-4" /> Design Assets
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
              {cat}
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
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
              <p className="text-muted-foreground">This artist hasn't organized their portfolio yet.</p>
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
              No design assets available for purchase.
            </p>
          )}
        </div>
      </TabsContent>

      {/* Hero Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl bg-black/90 p-0 border-none">
          {selectedImage && (
            <div className="relative group">
              <img src={selectedImage.imageUrl} alt={selectedImage.title} className="w-full max-h-[85vh] object-contain" />
              <div className="p-6 bg-gradient-to-t from-black to-transparent">
                <h2 className="text-2xl font-bold font-serif">{selectedImage.title}</h2>
                <p className="text-muted-foreground mt-2">{selectedImage.description}</p>
                <div className="flex gap-2 mt-4">
                  {selectedImage.tags?.split(',').map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-white/10">{tag.trim()}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}



