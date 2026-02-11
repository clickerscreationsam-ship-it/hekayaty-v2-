import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useProducts } from "@/hooks/use-products";
import { useCollections } from "@/hooks/use-collections";
import { ProductCard } from "@/components/ProductCard";
import { Search, Book, Palette, Layers, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import marketplaceBg from "@/assets/d2c8245c-c591-4cc9-84d2-27252be8dffb.png";

export default function Marketplace() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const isAssetMode = location === "/assets";

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string | undefined>();
  const [type, setType] = useState<"ebook" | "asset" | "collection">(isAssetMode ? "asset" : "ebook");
  const [isSerialized, setIsSerialized] = useState<boolean | undefined>(
    new URLSearchParams(window.location.search).get('isSerialized') === 'true'
  );

  // Sync state with URL location
  useEffect(() => {
    if (location === "/assets") setType("asset");
    else if (location === "/marketplace") setType("ebook");

    const params = new URLSearchParams(window.location.search);
    setIsSerialized(params.get('isSerialized') === 'true');
  }, [location, window.location.search]);

  // Update URL when type changes via UI
  const handleTypeChange = (newType: "ebook" | "asset" | "collection") => {
    setType(newType);
    setGenre(undefined); // Reset genre when switching types
    if (newType === "asset") setLocation("/assets");
    else if (newType === "ebook") setLocation("/marketplace");
    else setLocation("/marketplace?type=collection");
  };

  const { data: productData, isLoading: productsLoading } = useProducts({ search, genre, type: type === 'collection' ? 'ebook' : type, isSerialized });
  const { data: collectionData, isLoading: collectionsLoading } = useCollections({ isPublished: true });

  const products = productData || [];
  const collections = collectionData || [];

  const isLoading = productsLoading || (type === 'collection' && collectionsLoading);

  const displayItems = type === 'collection'
    ? collections.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))
    : products;

  const bookGenres = ["Fantasy", "Sci-Fi", "Romance", "Mystery", "Horror", "Non-Fiction"];
  const assetGenres = ["Cover Art", "Illustrations", "Textures", "UI Kits", "Character Design"];

  const currentGenres = type === "asset" ? assetGenres : bookGenres;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Immersive Background Layer */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url(${marketplaceBg})` }}
      />

      <div className="relative z-10">
        <Navbar />

        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-4">
              {type === "asset" ? t("marketplace.assetsTitle") : t("marketplace.title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {type === "asset"
                ? t("marketplace.assetsSubtitle")
                : t("marketplace.subtitle")}
            </p>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => handleTypeChange("ebook")}
              className={`flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-all ${type === "ebook"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Book className="w-4 h-4" />
              {t("marketplace.tabs.stories")}
            </button>
            <button
              onClick={() => handleTypeChange("asset")}
              className={`flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-all ${type === "asset"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Palette className="w-4 h-4" />
              {t("marketplace.tabs.assets")}
            </button>
            <button
              onClick={() => handleTypeChange("collection")}
              className={`flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-all ${type === "collection"
                ? "border-b-2 border-secondary text-secondary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              {t("home.collections.badge")}
            </button>
            <button
              onClick={() => {
                const newSerialized = !isSerialized;
                setIsSerialized(newSerialized);
                const params = new URLSearchParams(window.location.search);
                if (newSerialized) params.set('isSerialized', 'true');
                else params.delete('isSerialized');
                setLocation(`${location}?${params.toString()}`);
              }}
              className={`flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-all ${isSerialized
                ? "border-b-2 border-amber-500 text-amber-500"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Layers className="w-4 h-4" />
              {t("marketplace.tabs.serialized", "Ongoing Series")}
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={type === "asset" ? t("marketplace.assetsSearchPlaceholder") : t("marketplace.searchPlaceholder")}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-card/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setGenre(undefined)}
                className={`px-4 py-3 rounded-xl whitespace-nowrap font-medium transition-colors ${!genre ? 'bg-primary text-white' : 'bg-card/50 hover:bg-card border border-border'}`}
              >
                {type === "asset" ? t("marketplace.allCategories") : t("marketplace.allGenres")}
              </button>
              {currentGenres.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-4 py-3 rounded-xl whitespace-nowrap font-medium transition-colors ${genre === g ? 'bg-primary text-white' : 'bg-card/50 hover:bg-card border border-border'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : displayItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayItems.map((item: any) => (
                <ProductCard
                  key={item.id}
                  product={type === 'collection' ? undefined : item}
                  collection={type === 'collection' ? item : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-muted mb-4">
                {type === "asset" ? <Layers className="w-10 h-10 text-muted-foreground" /> : <Book className="w-10 h-10 text-muted-foreground" />}
              </div>
              <h3 className="text-xl font-bold font-serif mb-2">{type === "asset" ? t("marketplace.noAssets") : t("marketplace.noStories")}</h3>
              <p className="text-muted-foreground">{t("marketplace.tryAdjusting")}</p>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
