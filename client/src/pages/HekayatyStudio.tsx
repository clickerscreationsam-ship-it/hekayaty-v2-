import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Sparkles,
  Shirt,
  Box,
  Image as ImageIcon,
  BookOpen,
  Film,
  Music,
  Share2,
  Megaphone,
  Youtube,
  Map,
  Users,
  Mic,
  Star,
  Play,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Layout,
  Globe,
  Radio,
  Briefcase,
  Timer,
  Palette
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// --- Components ---

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
           key={i}
           className="absolute w-1 h-1 bg-primary/30 rounded-full"
           initial={{ 
             x: Math.random() * 100 + "%", 
             y: Math.random() * 100 + "%",
             opacity: 0 
           }}
           animate={{ 
             y: [null, "-30%"],
             opacity: [0, 0.4, 0],
             scale: [1, 2, 1]
           }}
           transition={{ 
             duration: Math.random() * 8 + 8, 
             repeat: Infinity, 
             ease: "linear",
             delay: Math.random() * 15
           }}
        />
      ))}
    </div>
  );
};

const SectionTitle = ({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) => (
  <div className={cn("mb-16 space-y-6", centered && "text-center")}>
    <motion.h2 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-5xl md:text-7xl font-serif font-black text-gradient leading-tight"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto font-sans leading-relaxed opacity-80"
      >
        {subtitle}
      </motion.p>
    )}
    <motion.div 
      initial={{ width: 0 }}
      whileInView={{ width: centered ? "100px" : "150px" }}
      viewport={{ once: true }}
      className={cn("h-1 bg-primary/40 rounded-full mt-8", centered && "mx-auto")}
    />
  </div>
);

const ServiceCard = ({ icon: Icon, title, description, badge, items }: { icon: any; title: string; description: string; badge?: string; items?: string[] }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -15, transition: { duration: 0.4, ease: "easeOut" } }}
      className="bg-[#24160a]/60 backdrop-blur-md p-10 rounded-[3rem] group relative overflow-hidden h-full flex flex-col border border-[#d4af37]/20 transition-all duration-500 hover:border-primary hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] shadow-2xl"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
        <Icon size={180} />
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-primary/30 to-primary/5 text-primary flex items-center justify-center mb-10 ring-1 ring-primary/40 group-hover:ring-primary transition-all duration-700 group-hover:scale-110 shadow-2xl">
          <Icon size={36} />
        </div>
        
        {badge && (
          <span className="inline-block self-start px-4 py-1.5 rounded-xl bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 ring-1 ring-primary/20 backdrop-blur-md">
            {badge}
          </span>
        )}
        
        <h3 className="text-3xl font-serif font-black mb-6 group-hover:text-primary transition-colors underline-offset-8 group-hover:underline decoration-primary/20">{title}</h3>
        <p className="text-muted-foreground text-base leading-relaxed mb-10 opacity-70 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
        
        {items && (
          <ul className="space-y-4 mt-auto border-t border-white/5 pt-8">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 text-xs font-bold text-white/40 group-hover:text-white/80 transition-all font-sans">
                <div className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
  );
};

// --- Page Sections ---

const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[110vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#120a05] via-transparent to-[#120a05] z-10 opacity-80" />
        <div className="absolute inset-0 bg-[#120a05]/40 z-10" />
        <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-full h-full"
        >
            <img 
                src="/images/studio-bg.png" 
                alt="Cinematic Universe" 
                className="w-full h-full object-cover object-center grayscale-[0.2] sepia-[0.3]"
            />
        </motion.div>
        <FloatingParticles />
      </div>
      
      <div className="container-responsive relative z-20 text-center space-y-12">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.2 }}
        >
          <span className="px-8 py-3 rounded-full border border-primary/40 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.4em] backdrop-blur-xl shadow-2xl ring-1 ring-[#d4af37]/30">
            {t("studioPage.hero.tagline")}
          </span>
        </motion.div>
        
        <motion.h1 
          className="text-7xl md:text-[9.5rem] font-serif font-black tracking-tight drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
        >
          <span className="block text-white mb-2 leading-[0.9]">{t("studioPage.hero.title1")}</span>
          <span className="block text-gradient leading-[0.9]">{t("studioPage.hero.title2")}</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-3xl text-white/70 max-w-4xl mx-auto font-sans leading-relaxed font-medium drop-shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          {t("studioPage.hero.subtitle")}
        </motion.p>
        
        <motion.div
          className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          <Button size="lg" className="h-20 px-16 rounded-[2.5rem] bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 transition-all text-xl font-black group shadow-[0_20px_50px_rgba(212,175,55,0.3)] border-none">
            {t("studioPage.hero.ctaPrimary")}
            <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform" />
          </Button>
          
          <Button variant="outline" size="lg" className="h-20 px-14 rounded-[2.5rem] border-white/20 bg-white/5 hover:bg-white/10 text-xl font-bold backdrop-blur-2xl transition-all hover:scale-105">
            {t("studioPage.hero.ctaSecondary")}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const JourneyBar = () => {
  const { t } = useTranslation();
  const steps = [
    { label: t("studioPage.journey.idea"), icon: Sparkles, desc: t("studioPage.journey.genesis") },
    { label: t("studioPage.journey.writing"), icon: BookOpen, desc: t("studioPage.journey.scripture") },
    { label: t("studioPage.journey.design"), icon: Layout, desc: t("studioPage.journey.visuals") },
    { label: t("studioPage.journey.marketing"), icon: Megaphone, desc: t("studioPage.journey.echo") },
    { label: t("studioPage.journey.universe"), icon: Globe, desc: t("studioPage.journey.legacy") }
  ];

  return (
    <div className="container-responsive py-48">
      <div className="relative p-20 rounded-[4rem] bg-gradient-to-b from-[#24160a] to-[#120a05] border border-[#d4af37]/20 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="absolute top-1/2 left-32 right-32 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 z-0 opacity-40" />
        <div className="absolute top-1/2 left-32 right-32 h-[3px] bg-primary/10 -translate-y-1/2 blur-lg pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-16 md:gap-0">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="flex flex-col items-center group flex-1"
            >
              <div className="relative w-24 h-24 mb-8">
                 <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <div className="relative w-full h-full rounded-[2.5rem] bg-[#3d2511] border border-[#d4af37]/10 flex items-center justify-center group-hover:border-primary group-hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-700 group-hover:-translate-y-3">
                    <step.icon size={36} className="text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                    {idx < steps.length - 1 && (
                      <div className="absolute -right-8 top-1/2 -translate-y-1/2 hidden md:block opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-700">
                         <ChevronRight size={24} className="text-primary/40" />
                      </div>
                    )}
                 </div>
              </div>
              <span className="text-sm font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-primary transition-all duration-500 mb-2 font-sans">{step.label}</span>
              <span className="text-[10px] font-serif italic text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{step.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketplaceAndCompetition = () => {
  const { t } = useTranslation();
  return (
    <section className="container-responsive py-48 pb-64">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
          {/* Marketplace */}
          <div className="space-y-16">
             <div className="space-y-6">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">{t("studioPage.council.tagline")}</span>
                <h3 className="text-5xl md:text-6xl font-serif font-black text-gradient leading-tight">{t("studioPage.council.title")}</h3>
                <p className="text-muted-foreground text-xl leading-relaxed max-w-xl opacity-70 font-sans">
                   {t("studioPage.council.desc")}
                </p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { name: "Samer A.", role: "Lead Illustrator", rating: 5, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samer" },
                  { name: "Laila H.", role: "Sound Architect", rating: 4.9, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laila" }
                ].map((freelancer, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -8, scale: 1.02 }} 
                    className="p-8 rounded-[2.5rem] bg-[#2d1b0d]/40 border border-[#d4af37]/10 flex items-center gap-6 group hover:bg-[#2d1b0d]/60 transition-all duration-500"
                  >
                     <div className="w-20 h-20 rounded-3xl bg-white/5 overflow-hidden shrink-0 border border-white/10 group-hover:border-primary/40 shadow-2xl transition-all">
                        <img src={freelancer.img} alt={freelancer.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black truncate group-hover:text-primary transition-colors mb-1 font-serif">{freelancer.name}</h4>
                        <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] group-hover:text-white/60 transition-colors font-sans">{freelancer.role}</p>
                        <div className="flex items-center gap-2 mt-3 text-primary">
                           <Star size={12} fill="currentColor" />
                           <span className="text-sm font-bold tracking-tighter">{freelancer.rating}</span>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
             <Button variant="ghost" className="text-primary hover:bg-primary/10 gap-3 font-black uppercase tracking-[0.2em] text-[11px] h-14 px-8 rounded-2xl ring-1 ring-primary/20">
                {t("studioPage.council.browse")} <ArrowRight size={16} />
             </Button>
          </div>

          {/* Competitions */}
          <div className="space-y-16">
             <div className="space-y-6">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">{t("studioPage.arena.tagline")}</span>
                <h3 className="text-5xl md:text-6xl font-serif font-black text-gradient leading-tight">{t("studioPage.arena.title")}</h3>
                <p className="text-muted-foreground text-xl leading-relaxed max-w-xl opacity-70 font-sans">
                   {t("studioPage.arena.desc")}
                </p>
             </div>
             
             <div className="rounded-[3.5rem] border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-transparent p-12 relative overflow-hidden group shadow-2xl">
                <div className="absolute -top-24 -right-24 p-8 opacity-[0.05] group-hover:scale-125 group-hover:opacity-10 transition-all duration-1000">
                   <Star size={250} className="text-primary" />
                </div>
                <div className="space-y-10 relative z-10">
                   <div className="flex items-center gap-6">
                      <div className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl">{t("studioPage.arena.activeChallenge")}</div>
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 font-sans"><Timer size={14}/> {t("studioPage.arena.daysLeft", { count: 4 })}</span>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-3xl font-serif font-black leading-tight text-white">{t("studioPage.arena.challengeTitle")}</h4>
                      <p className="text-base text-muted-foreground leading-relaxed max-w-md italic font-sans">
                        "{t("studioPage.arena.challengeDesc")}"
                      </p>
                   </div>
                   <div className="flex items-center gap-8 border-y border-white/5 py-8">
                       <div className="flex items-center -space-x-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-12 h-12 rounded-full border-4 border-[#120a05] bg-white/10 overflow-hidden shadow-2xl hover:scale-110 transition-transform cursor-pointer">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 50}`} alt="user" />
                            </div>
                          ))}
                          <div className="w-12 h-12 rounded-full border-4 border-[#120a05] bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shadow-2xl">+124</div>
                       </div>
                   </div>
                   <Button className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-[0_15px_40px_rgba(212,175,55,0.3)] border-none">
                     {t("studioPage.arena.join")}
                   </Button>
                </div>
             </div>
          </div>
       </div>
    </section>
  );
};

const ServicesGrid = () => {
  const { t } = useTranslation();
  const sections = [
    {
      title: t("studioPage.arsenal.merch.title"),
      icon: Shirt,
      description: t("studioPage.arsenal.merch.desc"),
      badge: t("nav.merchandise"),
      items: t("studioPage.arsenal.merch.items", { returnObjects: true }) as string[]
    },
    {
      title: t("studioPage.arsenal.media.title"),
      icon: Film,
      description: t("studioPage.arsenal.media.desc"),
      badge: "Cinematic",
      items: t("studioPage.arsenal.media.items", { returnObjects: true }) as string[]
    },
    {
      title: t("studioPage.arsenal.music.title"),
      icon: Music,
      description: t("studioPage.arsenal.music.desc"),
      badge: "Acoustic",
      items: t("studioPage.arsenal.music.items", { returnObjects: true }) as string[]
    },
    {
      title: t("studioPage.arsenal.branding.title"),
      icon: Megaphone,
      description: t("studioPage.arsenal.branding.desc"),
      badge: "Legacy",
      items: t("studioPage.arsenal.branding.items", { returnObjects: true }) as string[]
    }
  ];

  return (
    <section className="container-responsive py-48 pb-64">
      <SectionTitle 
        centered
        title={t("studioPage.arsenal.title")}
        subtitle={t("studioPage.arsenal.subtitle")}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {sections.map((section, idx) => (
          <ServiceCard key={idx} {...section} />
        ))}
      </div>
    </section>
  );
};

const AdvancedLabs = () => {
  const { t } = useTranslation();
  return (
    <section className="bg-[#1a0f05]/80 py-48 rounded-[6rem] mx-4 md:mx-16 overflow-hidden border border-[#d4af37]/20 relative shadow-[0_50px_150px_rgba(0,0,0,0.7)] backdrop-blur-3xl">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] -mr-64 -mt-64 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] -ml-64 -mb-64 rounded-full" />
      
      <div className="container-responsive relative z-10">
        <SectionTitle 
          title={t("studioPage.forge.title")}
          subtitle={t("studioPage.forge.subtitle")}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* World Building Lab */}
          <div className="lg:col-span-2 bg-[#2d1b0d]/60 p-16 rounded-[4rem] overflow-hidden group border border-[#d4af37]/10 hover:border-primary/40 transition-all duration-700">
            <div className="flex flex-col md:flex-row gap-20">
              <div className="flex-1 space-y-10">
                <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                  <Map size={48} />
                </div>
                <h3 className="text-4xl md:text-5xl font-serif font-black leading-tight">{t("studioPage.forge.world.title")}</h3>
                <p className="text-muted-foreground italic text-xl leading-relaxed opacity-80 font-sans">
                  "{t("studioPage.forge.world.desc")}"
                </p>
                <div className="space-y-6 pt-6">
                  <div className="flex items-center gap-6 text-base font-black text-primary uppercase tracking-[0.2em] font-sans">
                    <ChevronRight size={20} /> {t("studioPage.forge.world.preview")}
                  </div>
                  <div className="flex items-center gap-6 text-base font-black text-white/30 uppercase tracking-[0.2em] font-sans">
                    <ChevronRight size={20} /> {t("studioPage.forge.world.evolution")}
                  </div>
                </div>
                <Button variant="outline" className="h-16 rounded-2xl border-primary/20 text-primary hover:bg-primary/10 px-12 mt-10 text-xs font-black uppercase tracking-[0.2em] ring-1 ring-primary/20">
                   {t("studioPage.forge.world.cta")}
                </Button>
              </div>
              <div className="flex-1 relative aspect-[4/3] md:aspect-auto min-h-[400px]">
                 <div className="absolute inset-0 bg-[#0a0a0b] rounded-[3rem] overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/40 transition-all duration-1000 shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548345680-f5475ee511d7?q=80&w=1000')] bg-cover opacity-30 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-1000" />
                    <motion.div 
                      className="absolute top-1/2 left-1/3 w-6 h-6 bg-primary rounded-full shadow-[0_0_30px_rgba(212,175,55,1)] z-20"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                       <div className="w-[85%] h-[85%] border border-primary/20 rounded-full animate-[spin_80s_linear_infinite]" />
                       <div className="w-[65%] h-[65%] border border-primary/10 rounded-full animate-[spin_60s_linear_infinite_reverse]" />
                    </div>
                    {/* UI HUD Overlay */}
                    <div className="absolute top-10 left-10 p-6 glass rounded-[1.5rem] border border-white/10 space-y-3 z-20">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 font-sans">{t("studioPage.labsExtras.liveAnalytics")}</span>
                       </div>
                       <div className="text-primary font-black uppercase text-xs font-sans">{t("studioPage.labsExtras.region")}: ELDORIA</div>
                       <div className="text-white/40 text-[9px] uppercase tracking-widest font-sans">{t("studioPage.labsExtras.stability")}: 94%</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
          
          {/* Interactive Experience */}
          <div className="bg-[#2d1b0d]/60 p-14 rounded-[4rem] flex flex-col justify-between group overflow-hidden relative border border-[#d4af37]/10 hover:border-primary/40 transition-all duration-700">
             <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-[100px] rounded-full" />
             <div className="space-y-8">
               <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-2xl">
                 <Radio size={32} />
               </div>
               <h3 className="text-3xl font-serif font-black leading-tight text-white">{t("studioPage.forge.novel.title")}</h3>
               <p className="text-lg text-muted-foreground leading-relaxed opacity-70 italic font-sans">{t("studioPage.forge.novel.desc")}</p>
             </div>
             <div className="mt-20 space-y-4 relative">
                <div className="absolute -left-14 -right-14 top-0 bottom-0 bg-gradient-to-t from-[#1a0f05] to-transparent z-10 pointer-events-none" />
                <motion.div whileHover={{ scale: 1.05 }} className="w-full p-6 rounded-[1.5rem] bg-primary text-primary-foreground border border-primary/40 text-[11px] font-black uppercase tracking-[0.2em] text-center cursor-pointer shadow-2xl shadow-primary/20">
                  {t("studioPage.forge.novel.choice1")}
                </motion.div>
                <div className="w-full p-6 rounded-[1.5rem] bg-white/5 text-white/20 border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-center opacity-40 font-sans">
                  {t("studioPage.forge.novel.choice2")}
                </div>
             </div>
          </div>
          
          {/* Author Brand Builder */}
          <div className="lg:col-span-1 bg-[#2d1b0d]/60 p-14 rounded-[4rem] group border border-[#d4af37]/10 hover:border-primary/40 transition-all duration-700">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-10 ring-1 ring-primary/20 shadow-2xl">
               <Users size={32} />
             </div>
             <h3 className="text-3xl font-serif font-black leading-tight mb-6 text-white">{t("studioPage.forge.brand.title")}</h3>
             <p className="text-lg text-muted-foreground mb-12 leading-relaxed opacity-70 italic font-sans">{t("studioPage.forge.brand.desc")}</p>
             <div className="flex items-center gap-8 p-6 rounded-[2rem] bg-black/40 border border-[#d4af37]/10 shadow-inner">
                <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
                   <div className="w-12 h-12 rounded-full bg-white/10" />
                </div>
                <ArrowRight size={32} className="text-primary animate-pulse" />
                <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all duration-1000 group-hover:scale-110">
                   <Star size={36} className="text-primary" />
                </div>
             </div>
             <div className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 text-center font-sans">{t("studioPage.forge.brand.label")}</div>
          </div>

          {/* Audiobook Studio */}
          <div className="lg:col-span-2 bg-[#2d1b0d]/60 p-14 rounded-[4rem] group overflow-hidden relative border border-[#d4af37]/10 hover:border-primary/40 transition-all duration-700">
             <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="w-full md:w-1/3">
                  <div className="relative aspect-square">
                     <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-[100px] opacity-40" />
                     <div className="relative aspect-square rounded-[3rem] bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden ring-1 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
                        <Mic size={96} className="text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/30 to-transparent" />
                     </div>
                  </div>
               </div>
               <div className="flex-1 space-y-10">
                 <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-serif font-black leading-tight text-white">{t("studioPage.forge.audio.title")}</h3>
                   <div className="flex gap-4 items-center">
                      <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,1)]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 font-sans">{t("studioPage.forge.audio.session")}</span>
                   </div>
                 </div>
                 
                 <div className="p-10 rounded-[2.5rem] bg-[#120a05] border border-white/5 space-y-8 shadow-inner">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30 font-sans">
                       <span>{t("studioPage.labsExtras.audioExample")}</span>
                       <span className="text-primary tracking-tighter">2:45 / 14:00</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-20">
                       {[...Array(45)].map((_, i) => (
                         <motion.div 
                           key={i} 
                           className="flex-1 bg-primary/40 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                           animate={{ height: [Math.random() * 30 + 10 + i/2.5, Math.random() * 70 + 20, Math.random() * 30 + 10] }}
                           transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.04 }}
                         />
                       ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary/60 font-sans">
                       <span className="flex items-center gap-2 italic">{t("studioPage.forge.audio.narrator")}</span>
                       <span className="flex items-center gap-2"><Sparkles size={12}/> {t("studioPage.forge.audio.mastered")}</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-6">
                    <Button size="sm" variant="ghost" className="h-12 rounded-xl bg-white/5 gap-3 text-[10px] font-black uppercase tracking-widest px-6 hover:bg-white/10 transition-all font-sans">
                       <Users size={14} /> {t("studioPage.forge.audio.voiceA")}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-12 rounded-xl bg-primary/20 text-primary gap-3 text-[10px] font-black uppercase tracking-widest px-6 ring-1 ring-primary/40 hover:bg-primary/30 transition-all font-sans">
                       <Users size={14} /> {t("studioPage.forge.audio.voiceB")}
                    </Button>
                 </div>
               </div>
             </div>
          </div>

          {/* Film Pitch Studio */}
          <div className="lg:col-span-3 bg-[#2d1b0d]/60 p-20 rounded-[5rem] group relative overflow-hidden border border-[#d4af37]/10 hover:border-primary/40 transition-all duration-700">
             <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="absolute inset-y-0 left-0 w-96 bg-gradient-to-r from-[#120a05] via-transparent to-transparent z-10 pointer-events-none" />
             <div className="absolute inset-y-0 right-0 w-96 bg-gradient-to-l from-[#120a05] via-transparent to-transparent z-10 pointer-events-none" />
             
             <div className="relative z-20">
                <SectionTitle 
                  title={t("studioPage.forge.film.title")}
                  subtitle={t("studioPage.forge.film.subtitle")}
                />
                
                <div className="flex gap-10 overflow-hidden mt-20 py-12 px-10">
                   {[
                     { title: "ELDORIA", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400" },
                     { title: "NEON RIOT", img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400" },
                     { title: "SANDS OF TIME", img: "https://images.unsplash.com/photo-1544081044-1734bc12260b?q=80&w=400" },
                     { title: "GHOST SHIP", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400" },
                     { title: "DARK REACH", img: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=400" }
                   ].map((poster, i) => (
                     <motion.div 
                        key={i}
                        whileHover={{ scale: 1.15, zIndex: 30, rotateY: 10 }}
                        className="min-w-[280px] aspect-[2/3] rounded-[2rem] bg-black border border-white/10 overflow-hidden relative shadow-[0_30px_100px_rgba(0,0,0,0.8)] cursor-pointer transition-all duration-700"
                     >
                        <img src={poster.img} className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" alt={poster.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-8 text-center text-[11px] font-black uppercase tracking-[0.4em] text-white group-hover:text-primary transition-colors font-sans">
                           {poster.title}
                        </div>
                     </motion.div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  const { t } = useTranslation();
  return (
    <section className="py-72 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[800px] bg-primary/10 blur-[250px] rounded-full z-0 opacity-40 animate-pulse" />
      <div className="container-responsive relative z-10 space-y-20">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="space-y-10"
        >
          <h2 className="text-6xl md:text-[10rem] font-serif font-black tracking-tight leading-[0.85] drop-shadow-[0_20px_50px_rgba(0,0,0,1)] text-white">
            {t("studioPage.final.title")}<br/>
            <span className="text-gradient drop-shadow-2xl">{t("studioPage.final.titleHighlight")}</span>
          </h2>
          <p className="text-white/60 text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed italic font-medium font-sans">
            {t("studioPage.final.subtitle")}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="pt-10"
        >
          <Button size="lg" className="h-24 px-20 rounded-[3rem] bg-white text-black hover:bg-white/90 hover:scale-[1.15] transition-all text-2xl font-black group overflow-hidden relative shadow-[0_30px_100px_rgba(212,175,55,0.3)] border-none">
            <span className="relative z-10 font-serif">{t("studioPage.final.cta")}</span>
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-30 transition-opacity duration-700" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const HekayatyStudio = () => {
  const { i18n, t } = useTranslation();
  return (
    <div className={cn(
        "min-h-screen bg-[#120a05] text-white font-sans selection:bg-primary/40 selection:text-white pb-20",
        i18n.language === 'ar' ? 'font-arabic' : 'font-sans'
    )}>
      <Navbar />
      <Hero />
      <JourneyBar />
      <ServicesGrid />
      <MarketplaceAndCompetition />
      <AdvancedLabs />
      <FinalCTA />
      
      {/* Footer / Contact */}
      <footer className="py-32 border-t border-[#d4af37]/20 bg-[#0c0703]">
        <div className="container-responsive flex flex-col md:flex-row justify-between items-center gap-16 text-muted-foreground">
          <div className="font-serif font-black text-4xl text-gradient tracking-tighter">Hekayaty Studio</div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] font-sans">
             <a href="#" className="hover:text-primary transition-colors">Instagram</a>
             <a href="#" className="hover:text-primary transition-colors">TikTok</a>
             <a href="#" className="hover:text-primary transition-colors">Twitter</a>
             <a href="#" className="hover:text-primary transition-colors">{t("common.help")}</a>
          </div>
          <div className="text-[10px] tracking-[0.5em] font-black uppercase opacity-20 font-sans">© 2026 Hekayaty Collective</div>
        </div>
      </footer>
    </div>
  );
};

export default HekayatyStudio;
