import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useProducts } from "@/hooks/use-products";
import { useCollections } from "@/hooks/use-collections";
import { ProductCard } from "@/components/ProductCard";
import { Search, Book, Palette, Layers, LayoutGrid, ShoppingBag, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import marketplaceBg from "@/assets/d2c8245c-c591-4cc9-84d2-27252be8dffb.png";
import { cn } from "@/lib/utils";

type MarketplaceType = "ebook" | "asset" | "collection" | "merchandise";

export default function Marketplace() {
  const [location, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [search, setSearch] = useState("");
  const [type, setType] = useState<MarketplaceType>("ebook");
  const [isSerialized, setIsSerialized] = useState<boolean | undefined>(
    new URLSearchParams(window.location.search).get('isSerialized') === 'true'
  );

  // Sync state with URL location
  useEffect(() => {
    if (location === "/assets") setType("asset");
    else if (location === "/merchandise") setType("merchandise");
    else if (location === "/marketplace") {
      const params = new URLSearchParams(window.location.search);
      if (params.get('type') === 'collection') setType("collection");
      else setType("ebook");
    }

    const params = new URLSearchParams(window.location.search);
    setIsSerialized(params.get('isSerialized') === 'true');
  }, [location, window.location.search]);

  const handleTypeChange = (newType: MarketplaceType) => {
    setType(newType);
    if (newType === "asset") setLocation("/assets");
    else if (newType === "merchandise") setLocation("/merchandise");
    else if (newType === "collection") setLocation("/marketplace?type=collection");
    else setLocation("/marketplace");
  };

  const { data: productData, isLoading: productsLoading } = useProducts({
    search,
    type: type === 'collection' ? 'ebook' : type,
    isSerialized
  });
  const { data: collectionData, isLoading: collectionsLoading } = useCollections({ isPublished: true });

  const products = productData || [];
  const collections = collectionData || [];

  const isLoading = productsLoading || (type === 'collection' && collectionsLoading);

  const displayItems = type === 'collection'
    ? collections.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))
    : products;

  const getPageTitle = () => {
    switch (type) {
      case "asset": return t("marketplace.assetsTitle");
      case "merchandise": return t("marketplace.merchandiseTitle");
      case "collection": return t("home.collections.title");
      default: return t("marketplace.title");
    }
  };

  const getPageSubtitle = () => {
    switch (type) {
      case "asset": return t("marketplace.assetsSubtitle");
      case "merchandise": return t("marketplace.merchandiseSubtitle");
      case "collection": return t("home.collections.subtitle");
      default: return t("marketplace.subtitle");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Immersive Background Layer */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url(${marketplaceBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/60 backdrop-blur-[1px]" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 text-white drop-shadow-lg">
              {getPageTitle()}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
              {getPageSubtitle()}
            </p>
          </div>

          {/* Professional Navigation Tab Bar */}
          <div className="mb-10 p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-wrap gap-1 shadow-2xl">
            {[
              { id: "ebook", label: t("marketplace.tabs.stories"), icon: Book },
              { id: "asset", label: t("marketplace.tabs.assets"), icon: Palette },
              { id: "merchandise", label: t("marketplace.tabs.merchandise"), icon: ShoppingBag },
              { id: "collection", label: t("marketplace.tabs.collections"), icon: LayoutGrid },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTypeChange(tab.id as MarketplaceType)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex-1 md:flex-none justify-center",
                  type === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}

            <div className="h-8 w-[1px] bg-white/10 my-auto hidden md:block" />

            <button
              onClick={() => {
                const newSerialized = !isSerialized;
                setIsSerialized(newSerialized);
                const params = new URLSearchParams(window.location.search);
                if (newSerialized) params.set('isSerialized', 'true');
                else params.delete('isSerialized');
                setLocation(`${location}?${params.toString()}`);
              }}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex-1 md:flex-none justify-center",
                isSerialized
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Layers className="w-4 h-4" />
              {t("marketplace.tabs.serialized")}
            </button>
          </div>

          {/* Integrated Search Bar */}
          <div className="mb-12">
            <div className="relative group max-w-2xl mx-auto md:mx-0">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={
                  type === "asset"
                    ? t("marketplace.assetsSearchPlaceholder")
                    : type === "merchandise"
                      ? t("marketplace.merchandiseSearchPlaceholder")
                      : t("marketplace.searchPlaceholder")
                }
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-white/30 text-lg shadow-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Grid View */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
              ))}
            </div>
          ) : displayItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {displayItems.map((item: any) => (
                <div key={item.id} className="transition-transform duration-300 hover:scale-[1.02]">
                  <ProductCard
                    product={type === 'collection' ? undefined : item}
                    collection={type === 'collection' ? item : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 glass-card rounded-3xl border border-white/10 max-w-lg mx-auto">
              <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-white/5 mb-6">
                {type === "asset" ? <Layers className="w-12 h-12 text-white/20" /> : type === "merchandise" ? <ShoppingBag className="w-12 h-12 text-white/20" /> : <Book className="w-12 h-12 text-white/20" />}
              </div>
              <h3 className="text-2xl font-bold font-serif mb-2 text-white">
                {type === "asset" ? t("marketplace.noAssets") : type === "merchandise" ? t("marketplace.noMerchandise") : t("marketplace.noStories")}
              </h3>
              <p className="text-white/40">{t("marketplace.tryAdjusting")}</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
