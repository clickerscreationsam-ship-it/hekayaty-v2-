import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Search, Book, Palette, Layers, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import marketplaceBg from "@/assets/d2c8245c-c591-4cc9-84d2-27252be8dffb.png";

export default function Marketplace() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const isAssetMode = location === "/assets";

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string | undefined>();
  const [type, setType] = useState<"ebook" | "asset">(isAssetMode ? "asset" : "ebook");

  // Sync state with URL location
  useEffect(() => {
    if (location === "/assets") setType("asset");
    else if (location === "/marketplace") setType("ebook");
  }, [location]);

  // Update URL when type changes via UI
  const handleTypeChange = (newType: "ebook" | "asset") => {
    setType(newType);
    setGenre(undefined); // Reset genre when switching types
    if (newType === "asset") setLocation("/assets");
    else setLocation("/marketplace");
  };

  const { data: productData, isLoading } = useProducts({ search, genre, type });
  const products = productData || [];

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
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
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

        {/* Sell CTA Section */}
        <section className="py-24 relative overflow-hidden mt-12">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass animate-in fade-in slide-in-from-bottom-10 duration-1000 p-8 md:p-16 rounded-[2.5rem] text-center border border-white/10 shadow-2xl overflow-hidden relative"
            >
              {/* Decorative elements */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-[80px]" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-white leading-tight">
                  {t("marketplace.sell.title")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                  {t("marketplace.sell.subtitle")}
                </p>
                <Link href="/dashboard">
                  <button className="px-10 py-5 rounded-2xl bg-primary text-white font-bold text-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all flex items-center gap-3 mx-auto group">
                    {t("marketplace.sell.button")}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
