import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, BookOpen, PenTool } from "lucide-react";
import { useWriters } from "@/hooks/use-users";
import { useBestSellerProducts } from "@/hooks/use-products";
import { FeaturedWriter } from "@/components/FeaturedWriter";
import { ProductCard } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { data: writers } = useWriters();
  const { data: bestSellers } = useBestSellerProducts();
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background Elements */}

        {/* Background Elements - Removed for pure photo visibility */}
        {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/40" /> */}
        {/* <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] opacity-30" /> */}
        {/* <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] opacity-30" /> */}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white border border-primary/20 shadow-lg backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm md:text-base font-bold tracking-wide">{t("hero.tagline")}</span>
              </div>
              <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {t("hero.production")}
              </span>
            </div>

            <h1
              className="text-[6rem] sm:text-[8rem] md:text-[11rem] lg:text-[14rem] xl:text-[17rem] 2xl:text-[20rem] font-serif font-black mb-12 tracking-tighter leading-[0.85] text-white drop-shadow-[0_25px_60px_rgba(0,0,0,1)]"
              style={{ fontSize: 'clamp(6rem, 15vw, 20rem)' }}
            >
              <span className="block mb-4 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">{t("hero.title_line1")}</span>
              <span className="text-gradient block transition-all duration-700 hover:scale-[1.05] cursor-default">
                {t("hero.title_line2")}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/marketplace">
                <button className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {t("hero.cta_explore")}
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="px-8 py-4 rounded-xl glass text-foreground font-bold text-lg hover:bg-white/50 transition-all flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  {t("hero.cta_write")}
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-4">{t("home.bestSellers.title")}</h2>
              <p className="text-muted-foreground">{t("home.bestSellers.subtitle")}</p>
            </div>
            <Link href="/marketplace">
              <button className="text-primary font-medium hover:underline flex items-center gap-2">
                {t("home.bestSellers.viewAll")} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers?.map((product) => (
              <ProductCard key={product.id} product={product} />
            )) || (
                // Loading skeletons
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-96 rounded-2xl bg-card/50 animate-pulse" />
                ))
              )}
            {bestSellers && bestSellers.length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-10">
                {t("home.bestSellers.empty")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Writers Section */}
      <section className="py-24 bg-muted/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-4">{t("home.featuredWriters.title")}</h2>
              <p className="text-muted-foreground">{t("home.featuredWriters.subtitle")}</p>
            </div>
            <Link href="/worldbuilders">
              <button className="text-primary font-medium hover:underline flex items-center gap-2">
                {t("home.featuredWriters.viewAll")} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {writers?.slice(0, 4).map((writer) => (
              <FeaturedWriter key={writer.id} writer={writer} />
            )) || (
                // Loading skeletons
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-80 rounded-2xl bg-card/50 animate-pulse" />
                ))
              )}
          </div>
        </div>
      </section>

      {/* CTA Section - Only for guests */}
      {!user && (
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
              {t("home.cta.title")}
            </h2>
            <p className="text-xl text-white font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-10">
              {t("home.cta.subtitle")}
            </p>
            <Link href="/auth">
              <button className="px-8 py-4 rounded-xl bg-foreground text-background font-bold text-lg hover:scale-105 transition-transform">
                {t("home.cta.button")}
              </button>
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
