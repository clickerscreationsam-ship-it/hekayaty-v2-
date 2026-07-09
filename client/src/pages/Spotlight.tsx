import { useSpotlight } from "@/hooks/use-spotlight";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { Sparkles, BookOpen, ArrowRight, Loader2, Star } from "lucide-react";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SpotlightPage() {
  const { data: items, isLoading } = useSpotlight();

  return (
    <div className="min-h-screen bg-[#000000] text-right" dir="rtl">
      <SEO
        title="Hekayaty Spotlight - أضواء هكايتي"
        description="قصص اختارها فريق هكايتي بعناية لتستحق مكانها في الضوء. اكتشف أفضل ما كتبه الكتّاب على منصتنا."
      />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,192,0,0.08)_0%,_transparent_65%)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Animated stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
              <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-amber-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-serif font-black mb-4"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300">
              Hekayaty Spotlight
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            قصص اختارها فريق هكايتي بعناية فائقة لتستحق مكانها في دائرة الضوء.
            كل كتاب هنا يمثل تجربة استثنائية تستحق أن تُقرأ.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-3 mt-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>مختارات افتراضية من فريق هكايتي</span>
            </div>
            {items && items.length > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span>{items.length} كتاب في الضوء الآن</span>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-amber-500/10" />
        </div>
        <div className="relative flex justify-center">
          <div className="px-4 bg-[#000000]">
            <Sparkles className="w-5 h-5 text-amber-500/40" />
          </div>
        </div>
      </div>

      {/* Spotlight Items Grid */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
              <p className="text-muted-foreground">جاري تحميل الكتب المختارة...</p>
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-24">
              <Sparkles className="w-16 h-16 mx-auto mb-6 text-amber-500/20" />
              <h2 className="text-2xl font-bold mb-3">قريباً...</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                لم يتم إضافة أي كتب إلى Spotlight بعد. تابعنا قريباً لاكتشاف أفضل المحتوى.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {items.map((item: any, index: number) => {
                const product = item.product;
                if (!product) return null;
                const coverUrl = product.coverUrl || product.cover_url;
                const note = item.editorialNote || item.editorial_note;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07 }}
                  >
                    <Link href={`/product/${product.id}`}>
                      <div className="group relative flex gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-amber-500/30 hover:bg-amber-500/[0.04] transition-all duration-300 cursor-pointer overflow-hidden">
                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,192,0,0.1)_0%,_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        
                        {/* Order number */}
                        <div className="absolute top-3 left-3 text-[10px] font-black text-amber-500/30 font-mono">
                          #{String(index + 1).padStart(2, '0')}
                        </div>

                        {/* Cover */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={coverUrl}
                            alt={product.title}
                            className="w-24 h-34 sm:w-28 sm:h-40 object-cover rounded-xl shadow-2xl group-hover:shadow-amber-500/20 transition-all duration-300 group-hover:scale-[1.02]"
                            style={{ aspectRatio: "2/3" }}
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/112x160/111/f5c000?text=📖"; }}
                          />
                          {/* Spotlight badge on cover */}
                          <div className="absolute -top-2 -right-2 p-1.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/30 border-2 border-black">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between relative z-10 pt-1">
                          <div>
                            {/* Badge */}
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/12 text-amber-400 border border-amber-500/20 mb-3">
                              ✨ {item.badge}
                            </span>

                            {/* Title */}
                            <h3 className="font-bold text-lg sm:text-xl leading-tight group-hover:text-amber-300 transition-colors line-clamp-2 mb-1">
                              {product.title}
                            </h3>

                            {/* Genre & type */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs text-muted-foreground">
                                {product.type === "story" ? "قصة" : product.type === "novel" ? "رواية" : product.type}
                              </span>
                              {product.genre && (
                                <>
                                  <span className="text-white/20">·</span>
                                  <span className="text-xs text-muted-foreground">{product.genre}</span>
                                </>
                              )}
                            </div>

                            {/* Editorial note */}
                            {note && (
                              <div className="border-r-2 border-amber-500/30 pr-3">
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 italic" dir="rtl">
                                  "{note}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Read button */}
                          <div className="flex items-center gap-2 mt-4">
                            <div className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                              <BookOpen className="w-4 h-4" />
                              <span>اقرأ الآن</span>
                              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
