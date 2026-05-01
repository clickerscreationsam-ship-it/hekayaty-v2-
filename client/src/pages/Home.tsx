import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Feather, BookOpen, PenTool, Info, Layers, LayoutGrid, ShoppingBag, Palette, ChevronLeft, ChevronRight, Star, Play, HelpCircle } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useTopWriters, useUserById, usePlatformStats } from "@/hooks/use-users";
import { useBestSellerProducts, useSerializedProducts, useProducts } from "@/hooks/use-products";
import { useCollections } from "@/hooks/use-collections";
import { useMediaVideos } from "@/hooks/use-media";
import { FeaturedWriter } from "@/components/FeaturedWriter";
import { ProductCard } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { GridSkeleton, HeroSkeleton } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: writers } = useTopWriters(8);
  const { data: bestSellers } = useBestSellerProducts(8);
  const { data: serializedStories } = useSerializedProducts(8);
  const { data: collections } = useCollections({ isPublished: true });
  const { data: mediaHub } = useMediaVideos({ isFeatured: true });
  const { data: merchandise } = useProducts({ type: 'merchandise' });
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Slider logic
  const { data: allBooks } = useProducts({ isPublished: true });
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: 'rtl' }, [Autoplay({ delay: 3000 })]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  React.useEffect(() => {
    document.body.classList.add('is-homepage');
    return () => {
      document.body.classList.remove('is-homepage');
    };
  }, []);

  const writersMap = React.useMemo(() => 
    Object.fromEntries(writers?.map(w => [w.id, w.displayName]) || []),
    [writers]
  );

  const { data: stats } = usePlatformStats();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Hekayaty",
    "url": "https://hekayaty.com",
    "logo": "https://hekayaty.com/logo.png",
    "sameAs": [
      "https://twitter.com/Hekayaty",
      "https://www.youtube.com/@Hekayaty-q2i"
    ],
    "description": "The ultimate universe for storytellers and worldbuilders."
  };

  return (
    <div className="min-h-screen bg-[#000000] text-right" dir="rtl">
      <SEO
        title="Home"
        description="The ultimate universe for storytellers and worldbuilders. Publish your stories, build your digital bookstore, and connect with readers directly."
        schema={organizationSchema}
      />
      <Navbar />

      {/* New Redesigned Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center pt-24 pb-12 overflow-hidden bg-[#000000]">
        {/* Dynamic Animated Story Grid Background */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-transparent to-[#000000] z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-transparent to-[#000000] z-10" />
          <div className="absolute inset-0 bg-[#000000]/60 z-10" />
          
          <div className="relative h-full w-[200%] rotate-[-4deg] scale-125 opacity-40 grayscale-[0.2] blur-[1px]">
            {[0, 1, 2].map((row) => (
              <motion.div 
                key={row}
                initial={{ x: row % 2 === 0 ? 0 : -1000 }}
                animate={{ x: row % 2 === 0 ? [0, -1000] : [-1000, 0] }}
                transition={{ 
                  duration: 60 + (row * 10), 
                  repeat: Infinity, 
                  ease: "linear",
                  // Only run background animation if device is not low-performance
                  // This is a simple check for desktop vs mobile
                }}
                className={`flex gap-6 mb-6 ${row > 1 ? 'hidden md:flex' : 'flex'}`}
              >
                {[... (allBooks || []), ... (allBooks || []), ... (allBooks || [])].slice(0, 30).map((book: any, i: number) => (
                  <div key={`${row}-${i}`} className="w-48 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0 bg-white/5">
                    <img src={book.coverUrl} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="container-responsive relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Right Side - Book Slider (Shows first on mobile) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative flex flex-col items-center justify-center order-1"
          >
            <div className="embla overflow-hidden w-full max-w-[320px] sm:max-w-[380px]" ref={emblaRef}>
              <div className="embla__container flex">
                {(allBooks && allBooks.length > 0 ? allBooks : Array(1).fill(null)).map((book, idx) => (
                  <div key={book?.id || idx} className="embla__slide flex-[0_0_100%] min-w-0 px-2">
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl group bg-[#000000] border border-white/5">
                      {/* Publisher Badge */}
                      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 px-3 py-1 rounded-lg bg-[#F5C000] text-black text-[10px] font-black uppercase tracking-tighter">
                        {book ? (writersMap[book.writerId] || "دار كاتب") : "تحميل..."}
                      </div>
                      
                      {/* Feather Action Button */}
                      <button className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-10 h-10 rounded-full bg-[#F5C000] flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                        <Feather className="w-5 h-5 text-black fill-black" />
                      </button>

                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                      
                      {/* Book Cover */}
                      <img 
                        src={book?.coverUrl || "/images/placeholder-book.png"} 
                        alt={book?.title || "Book Cover"}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Hidden on touch devices to avoid clutter, using swipe instead */}
            <div className="hidden sm:block">
              <button 
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="flex gap-2 mt-8">
              {(allBooks?.slice(0, 5) || Array(5).fill(null)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedIndex === i ? 'bg-[#F5C000] w-6' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Left Side - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-right gap-6 order-2"
          >
            <div className="flex flex-col items-center lg:items-start gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <Feather className="w-4 h-4 text-[#F5C000]" />
                <span className="text-sm font-bold text-[#F5C000]">الكون الجامع لكل الرواة</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">من إنتاج شركة كليكرز</span>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-black text-white leading-[1.1]">
                لكل كاتب
              </h1>
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-black text-[#F5C000] leading-[1.1]">
                عالم يستحقه
              </h1>
            </div>

            <p className="text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
              أنشئ مكتبتك الرقمية الخاصة، تواصل مع القراء، وبع قصصك مباشرة. لا حواجز. فقط سحر الكلمات.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
              <Link href="/marketplace" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 bg-[#F5C000] hover:bg-[#F5C000]/90 text-black font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,192,0,0.3)] hover:shadow-[0_0_30px_rgba(245,192,0,0.5)] transition-all">
                  <BookOpen className="w-5 h-5" />
                  {t("hero.explore", "Explore Portal")}
                </Button>
              </Link>

              <Link href="/guide" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 backdrop-blur-md transition-all"
                >
                  <HelpCircle className="w-5 h-5 text-[#F5C000]" />
                  {t("nav.guide", "Platform Guide")}
                </Button>
              </Link>

              <Link href="/media" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 backdrop-blur-md transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  {t("nav.mediaHub", "Media Hub")}
                </Button>
              </Link>
            </div>

            {/* Bottom Stats Row */}
            <div className="flex items-center gap-8 mt-12 pt-12 border-t border-white/5 w-full max-w-xl">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-white">500K+</span>
                <span className="text-xs text-white/40">قارئ</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-white">+{stats?.books || 500}</span>
                <span className="text-xs text-white/40">كتاب</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background gradient removed for pure black background */}
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

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {bestSellers?.map((product) => (
              <ProductCard key={product.id} product={product} />
            )) || <GridSkeleton count={8} />}
            {bestSellers && bestSellers.length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-10">
                {t("home.bestSellers.empty")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Media Hub Cinematic Section */}
      <section className="py-32 relative overflow-hidden bg-[#000000]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                <Play className="w-3 h-3 fill-primary" />
                {t("nav.mediaHub")}
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-black text-white leading-tight">
                {t("blog.posts.post1.category", "Cinematic")} <span className="text-primary">{t("nav.mediaHub")}</span>
              </h2>
              <p className="text-white/40 max-w-xl text-lg">
                {t("blog.subtitle", "Experience the stories beyond the pages. Watch official trailers, listen to theme songs, and explore the expanded universes.")}
              </p>
            </div>
            <Link href="/media">
              <Button variant="outline" className="rounded-full px-8 h-12 border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all">
                {t("home.bestSellers.viewAll")}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mediaHub?.slice(0, 3).map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative aspect-video rounded-[2rem] overflow-hidden border border-white/10 bg-white/5 hover:border-primary/40 transition-all duration-500 shadow-2xl"
              >
                <img 
                  src={video.thumbnailUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={video.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <a 
                    href={video.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-16 h-16 rounded-full bg-primary text-black flex items-center justify-center shadow-[0_0_30px_rgba(245,192,0,0.5)] hover:scale-110 active:scale-95 transition-all"
                  >
                    <Play className="w-6 h-6 fill-black" />
                  </a>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">
                    {t(`dashboard.products.types.${video.category}`)}
                  </span>
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                    {video.title}
                  </h3>
                </div>
              </motion.div>
            ))}
            
            {!mediaHub && Array(3).fill(0).map((_, i) => (
              <div key={i} className="aspect-video rounded-[2rem] bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* Hekayaty Studio Teaser */}
      <section className="py-32 relative overflow-hidden group">
         <div className="absolute inset-0 bg-black/60 z-10" />
         <img 
           src="/images/studio-home-hero.png" 
           className="absolute inset-0 w-full h-full object-cover group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" 
           alt="Studio"
         />
         <div className="container-responsive relative z-20">
            <div className="max-w-3xl space-y-8">
               <span className="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest ring-1 ring-primary/30 backdrop-blur-sm">Premium Services</span>
               <h2 className="text-5xl md:text-7xl font-serif font-black text-white leading-tight">
                  Elevate Your Story to <span className="text-primary">Universal Status</span>
               </h2>
               <p className="text-xl text-white/70 leading-relaxed max-w-2xl">
                  Transform your writing into a professional brand. From cinematic trailers and custom merch to world-building maps and global marketing.
               </p>
               <Link href="/hekayaty-studio">
                 <button className="h-16 px-10 rounded-2xl bg-primary text-black font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20 flex items-center gap-4 group">
                    Enter the Studio
                    <Palette size={20} className="group-hover:rotate-12 transition-transform" />
                 </button>
               </Link>
            </div>
         </div>
      </section>

      {/* Merchandise Section */}
      <section className="py-24 relative overflow-hidden bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-4xl font-serif font-bold mb-2">{t("home.merchandise.title")}</h2>
                <p className="text-muted-foreground">{t("home.merchandise.subtitle")}</p>
              </div>
            </div>
            <Link href="/marketplace?type=merchandise">
              <button className="text-amber-500 font-medium hover:underline flex items-center gap-2">
                {t("home.bestSellers.viewAll")} <ArrowRight className={cn("w-4 h-4", i18n.language === 'ar' ? 'rotate-180' : '')} />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {merchandise?.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            )) || <GridSkeleton count={8} />}
            {merchandise && merchandise.length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-10">
                {t("home.merchandise.empty")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Ongoing Series Section */}
      <section className="py-24 relative overflow-hidden bg-[#000000] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-4xl font-serif font-bold mb-2">{t("home.serialized.title")}</h2>
                <p className="text-muted-foreground">{t("home.serialized.subtitle")}</p>
              </div>
            </div>
            <Link href="/marketplace?isSerialized=true">
              <button className="text-primary font-medium hover:underline flex items-center gap-2">
                {t("home.bestSellers.viewAll")} <ArrowRight className={cn("w-4 h-4", i18n.language === 'ar' ? 'rotate-180' : '')} />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {serializedStories?.map((product) => (
              <ProductCard key={product.id} product={product} />
            )) || <GridSkeleton count={8} />}
            {serializedStories && serializedStories.length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-10">
                {t("home.serialized.empty")}
              </p>
            )}
          </div>
        </div>
      </section>
      {/* Collections Section */}
      <section className="py-24 relative overflow-hidden bg-[#000000] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-secondary/20 text-secondary border border-secondary/20 shadow-xl shadow-secondary/10">
                <LayoutGrid className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-4xl font-serif font-bold mb-2">{t("home.collections.title")}</h2>
                <p className="text-muted-foreground">{t("home.collections.subtitle")}</p>
              </div>
            </div>
            <Link href="/marketplace?type=collection">
              <button className="text-secondary font-bold hover:underline flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 transition-all hover:bg-secondary/20">
                {t("home.bestSellers.viewAll")} <ArrowRight className={cn("w-4 h-4", i18n.language === 'ar' ? 'rotate-180' : '')} />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {collections?.slice(0, 8).map((c) => (
              <ProductCard key={c.id} collection={c} />
            )) || <GridSkeleton count={8} />}
            {collections && collections.length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-10">
                {t("home.collections.empty")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Writers Section */}
      <section className="py-24 bg-[#000000] relative">
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

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {writers?.map((writer) => (
              <FeaturedWriter key={writer.id} writer={writer} showStats={false} />
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
          {/* Background gradient removed for pure black background */}
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
              {t("home.cta.title")}
            </h2>
            <p className="text-xl text-white font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-10">
              {t("home.cta.subtitle")}
            </p>
            <Link href="/auth?mode=register">
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
