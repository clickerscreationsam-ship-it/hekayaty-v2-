import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shirt,
  BookOpen,
  Film,
  Music,
  Megaphone,
  Youtube,
  Map,
  Users,
  Mic,
  Star,
  Layout,
  Globe,
  Radio,
  Gamepad,
  Video,
  PenTool,
  Trophy,
  Package
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// --- Components ---

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(40)].map((_, i) => (
        <motion.div
           key={i}
           className="absolute w-1 h-1 bg-primary/20 rounded-full"
           initial={{ 
             x: Math.random() * 100 + "%", 
             y: Math.random() * 100 + "%",
             opacity: 0 
           }}
           animate={{ 
             y: [null, "-40%"],
             opacity: [0, 0.3, 0],
             scale: [1, 2.5, 1]
           }}
           transition={{ 
             duration: Math.random() * 10 + 10, 
             repeat: Infinity, 
             ease: "linear",
             delay: Math.random() * 20
           }}
        />
      ))}
    </div>
  );
};

const SectionHeader = ({ title, subtitle, layer }: { title: string; subtitle?: string; layer?: string }) => (
  <div className="mb-24 text-center space-y-6">
    {layer && (
        <motion.span 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-[11px] font-black uppercase tracking-[0.6em] text-primary block mb-4"
        >
          {layer}
        </motion.span>
    )}
    <motion.h2 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-5xl md:text-8xl font-serif font-black text-gradient leading-tight"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground text-xl md:text-2xl max-w-4xl mx-auto font-sans leading-relaxed opacity-60"
      >
        {subtitle}
      </motion.p>
    )}
    <motion.div 
      initial={{ width: 0 }}
      whileInView={{ width: "120px" }}
      viewport={{ once: true }}
      className="h-1 bg-primary/30 rounded-full mt-10 mx-auto"
    />
  </div>
);

const ServiceCard = ({ icon: Icon, title, items, variant = "brown" }: { icon: any; title: string; items: string[]; variant?: "brown" | "gold" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
          "p-12 rounded-[4rem] border transition-all duration-700 relative overflow-hidden group",
          variant === "brown" 
            ? "bg-[#24160a]/40 border-[#d4af37]/10 hover:border-primary/30" 
            : "bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20 hover:border-primary/50"
      )}
    >
      <div className="absolute -top-12 -right-12 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 scale-150">
        <Icon size={200} />
      </div>
      
      <div className="relative z-10 space-y-10">
        <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center ring-1 transition-all duration-700 shadow-2xl group-hover:scale-110",
            variant === "brown" ? "bg-primary/10 text-primary ring-primary/20" : "bg-primary text-primary-foreground ring-primary"
        )}>
          <Icon size={36} />
        </div>
        
        <h3 className="text-3xl font-serif font-black text-white group-hover:text-primary transition-colors">{title}</h3>
        
        <ul className="space-y-5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-4 text-sm font-bold text-white/40 group-hover:text-white/70 transition-all font-sans">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

// --- Page Sections ---

const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#120a05] via-transparent to-[#120a05] z-10 opacity-90" />
        <div className="absolute inset-0 bg-[#120a05]/60 z-10" />
        <motion.div 
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="w-full h-full"
        >
            <img 
                src="/images/studio-bg.png" 
                alt="Studio Universe" 
                className="w-full h-full object-cover object-center grayscale-[0.3] sepia-[0.2]"
            />
        </motion.div>
        <FloatingParticles />
      </div>
      
      <div className="container-responsive relative z-20 text-center space-y-16">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.5 }}
        >
          <span className="px-10 py-4 rounded-full border border-primary/40 bg-[#2d1b0d]/80 text-primary text-[11px] font-black uppercase tracking-[0.6em] backdrop-blur-3xl shadow-2xl ring-1 ring-[#d4af37]/20">
            {t("studioPage.hero.tagline")}
          </span>
        </motion.div>
        
        <motion.h1 
          className="text-7xl md:text-[11rem] font-serif font-black tracking-tighter leading-[0.85] drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
        >
          <span className="block text-white mb-2">{t("studioPage.hero.title1")}</span>
          <span className="block text-gradient">{t("studioPage.hero.title2")}</span>
        </motion.h1>
        
        <motion.p 
          className="text-2xl md:text-4xl text-white/60 max-w-5xl mx-auto font-sans leading-relaxed font-light italic"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.2 }}
        >
          {t("studioPage.hero.subtitle")}
        </motion.p>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 2 }}
            className="pt-24 flex flex-col items-center gap-10"
        >
            <div className="w-[1px] h-32 bg-gradient-to-b from-primary/60 to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white/30 animate-pulse">Scroll to Discover</span>
        </motion.div>
      </div>
    </section>
  );
};

const LayerCore = () => {
    const { t } = useTranslation();
    const coreServices = [
        { title: t("studioPage.services.merch.title"), icon: Shirt, items: t("studioPage.services.merch.items", { returnObjects: true }) as string[] },
        { title: t("studioPage.services.marketing.title"), icon: Megaphone, items: t("studioPage.services.marketing.items", { returnObjects: true }) as string[] },
        { title: t("studioPage.services.music.title"), icon: Music, items: t("studioPage.services.music.items", { returnObjects: true }) as string[] },
        { title: t("studioPage.services.branding.title"), icon: Layout, items: t("studioPage.services.branding.items", { returnObjects: true }) as string[] },
        { title: t("studioPage.services.youtube.title"), icon: Youtube, items: t("studioPage.services.youtube.items", { returnObjects: true }) as string[] }
    ];

    return (
        <section className="container-responsive py-48">
            <SectionHeader 
                layer={t("studioPage.layers.core.title")}
                title="The Foundation"
                subtitle={t("studioPage.layers.core.subtitle")}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {coreServices.map((s, i) => (
                    <ServiceCard key={i} {...s} />
                ))}
            </div>
        </section>
    );
};

const LayerHighValue = () => {
    const { t } = useTranslation();
    const highValueServices = [
        { title: t("studioPage.services.audiobook.title"), icon: Mic, items: t("studioPage.services.audiobook.items", { returnObjects: true }) as string[] },
        { title: t("studioPage.services.film.title"), icon: Film, items: t("studioPage.services.film.items", { returnObjects: true }) as string[] },
        { title: t("studioPage.services.identity.title"), icon: Users, items: t("studioPage.services.identity.items", { returnObjects: true }) as string[] }
    ];

    return (
        <section className="bg-[#1a0f05]/60 backdrop-blur-3xl py-48 border-y border-[#d4af37]/10">
            <div className="container-responsive">
                <SectionHeader 
                    layer={t("studioPage.layers.highValue.title")}
                    title="The Elite Craft"
                    subtitle={t("studioPage.layers.highValue.subtitle")}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {highValueServices.map((s, i) => (
                        <ServiceCard key={i} {...s} variant="gold" />
                    ))}
                </div>
            </div>
        </section>
    );
};

const LayerPremium = () => {
    const { t } = useTranslation();
    const premiumServices = [
        { title: t("studioPage.services.world.title"), icon: Map, items: t("studioPage.services.world.items", { returnObjects: true }) as string[] },
        { title: t("studioPage.services.interactive.title"), icon: Gamepad, items: t("studioPage.services.interactive.items", { returnObjects: true }) as string[] }
    ];

    return (
        <section className="container-responsive py-48">
            <SectionHeader 
                layer={t("studioPage.layers.premium.title")}
                title="The Future Horizon"
                subtitle={t("studioPage.layers.premium.subtitle")}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {premiumServices.map((s, i) => (
                    <div key={i} className="bg-[#2d1b0d]/40 p-20 rounded-[5rem] border border-[#d4af37]/20 flex flex-col md:flex-row gap-16 items-center group overflow-hidden relative transition-all duration-1000 hover:border-primary/40">
                         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="w-40 h-40 rounded-[3rem] bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/30 shrink-0 group-hover:scale-110 shadow-2xl transition-transform duration-700">
                             <s.icon size={80} />
                         </div>
                         <div className="space-y-8 flex-1">
                             <h4 className="text-4xl font-serif font-black text-white group-hover:text-primary transition-colors">{s.title}</h4>
                             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {s.items.map((item, idx) => (
                                    <li key={idx} className="text-base font-bold text-white/30 group-hover:text-white/60 transition-all font-sans flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-primary/20" />
                                        {item}
                                    </li>
                                ))}
                             </ul>
                         </div>
                    </div>
                ))}
            </div>
            
            {/* Subscriber Website Teaser */}
            <motion.div 
               whileHover={{ scale: 1.01 }}
               className="mt-20 p-20 rounded-[5rem] bg-gradient-to-r from-[#d4af37]/20 to-transparent border border-primary/20 text-center space-y-6 group transition-all duration-700"
            >
                <Globe className="mx-auto text-primary group-hover:rotate-[360deg] transition-transform duration-[2000ms]" size={64} />
                <h4 className="text-4xl font-serif font-black text-gradient">Custom Subscriber Ecosystems</h4>
                <p className="text-white/40 text-xl font-sans max-w-2xl mx-auto">Each creator receives a bespoke, high-performance portal to host their universe's home base.</p>
            </motion.div>
        </section>
    );
};

const MarketplaceAndCommunity = () => {
    const { t } = useTranslation();
    return (
        <section className="bg-[#120a05] py-48 border-t border-white/5">
            <div className="container-responsive">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
                    {/* Marketplace */}
                    <div className="space-y-16">
                        <SectionHeader layer="Supporting" title={t("studioPage.marketplace.title")} subtitle={t("studioPage.marketplace.subtitle")} />
                        <div className="grid grid-cols-2 gap-6">
                            {(t("studioPage.marketplace.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <div key={i} className="flex items-center gap-6 p-8 bg-white/5 rounded-3xl border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 font-sans font-bold text-white/50 group">
                                    <div className="w-3 h-3 bg-primary/20 rounded-full group-hover:bg-primary transition-colors" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Community */}
                    <div className="space-y-16">
                        <SectionHeader layer="Engagement" title={t("studioPage.community.title")} />
                        <div className="space-y-8">
                            {[
                                { title: t("studioPage.community.merch"), icon: Package },
                                { title: t("studioPage.community.competitions"), icon: Trophy },
                                { title: t("studioPage.community.challenges"), icon: PenTool },
                                { title: t("studioPage.community.events"), icon: Users }
                            ].map((c, i) => (
                                <div key={i} className="flex items-center gap-10 p-10 bg-[#2d1b0d]/30 rounded-3xl border border-[#d4af37]/5 group hover:border-primary/20 transition-all">
                                    <div className="p-4 rounded-xl bg-primary/10 text-primary transition-all group-hover:rotate-12">
                                        <c.icon size={28} />
                                    </div>
                                    <span className="text-xl font-serif font-black text-white/60 group-hover:text-primary transition-colors">{c.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FinalPortfolioTag = () => {
    const { t } = useTranslation();
    return (
        <section className="py-80 text-center relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-[#120a05] to-[#0c0703] z-0" />
            <motion.div
               animate={{ opacity: [0.2, 0.4, 0.2] }}
               transition={{ duration: 5, repeat: Infinity }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[200px] z-0" 
            />
            
            <div className="container-responsive relative z-10 space-y-16">
                <motion.h2 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-6xl md:text-[13rem] font-serif font-black tracking-tighter leading-[0.8] drop-shadow-2xl"
                >
                    {t("studioPage.final.title")}<br/>
                    <span className="text-gradient leading-relaxed">{t("studioPage.final.titleHighlight")}</span>
                </motion.h2>
                
                <p className="text-white/40 text-2xl md:text-5xl max-w-5xl mx-auto leading-relaxed italic font-light font-sans opacity-60">
                    {t("studioPage.final.subtitle")}
                </p>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="pt-24 space-y-10"
                >
                    <div className="text-[12px] font-black uppercase tracking-[1em] text-primary animate-pulse flex flex-col items-center gap-8">
                        <div className="w-1 h-32 bg-gradient-to-b from-primary to-transparent" />
                        {t("studioPage.final.footerTag")}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const HekayatyStudio = () => {
  const { i18n } = useTranslation();
  return (
    <div className={cn(
        "min-h-screen bg-[#120a05] text-white selection:bg-primary/40 selection:text-white pb-0",
        i18n.language === 'ar' ? 'font-arabic' : 'font-sans'
    )}>
      <Navbar />
      <Hero />
      <LayerCore />
      <LayerHighValue />
      <LayerPremium />
      <MarketplaceAndCommunity />
      <FinalPortfolioTag />
      
      {/* Cinematic Simple Footer */}
      <footer className="py-24 border-t border-white/5 bg-[#0c0703]">
        <div className="container-responsive flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-2xl font-serif font-black text-gradient">Hekayaty Studio</div>
            <div className="flex gap-16 text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
                <span>IMAGINATION</span>
                <span>PRODUCTION</span>
                <span>LEGACY</span>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 italic">Est. 2026 Collective</div>
        </div>
      </footer>
    </div>
  );
};

export default HekayatyStudio;
