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
  Timer
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Components ---

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
           key={i}
           className="absolute w-1 h-1 bg-primary/40 rounded-full"
           initial={{ 
             x: Math.random() * 100 + "%", 
             y: Math.random() * 100 + "%",
             opacity: 0 
           }}
           animate={{ 
             y: [null, "-20%"],
             opacity: [0, 0.8, 0],
             scale: [1, 1.5, 1]
           }}
           transition={{ 
             duration: Math.random() * 5 + 5, 
             repeat: Infinity, 
             ease: "linear",
             delay: Math.random() * 10
           }}
        />
      ))}
    </div>
  );
};

const SectionTitle = ({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) => (
  <div className={cn("mb-12 space-y-4", centered && "text-center")}>
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-4xl md:text-5xl font-serif font-bold text-gradient"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground text-lg max-w-2xl mx-auto"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const ServiceCard = ({ icon: Icon, title, description, badge, items }: { icon: any; title: string; description: string; badge?: string; items?: string[] }) => {
  return (
    <motion.div 
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className="glass-card p-8 rounded-3xl group relative overflow-hidden h-full flex flex-col"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
        <Icon size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 ring-1 ring-primary/20 group-hover:ring-primary/50 transition-all">
          <Icon size={28} />
        </div>
        
        {badge && (
          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-4 ring-1 ring-primary/30">
            {badge}
          </span>
        )}
        
        <h3 className="text-2xl font-serif font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {description}
        </p>
        
        {items && (
          <ul className="space-y-3 mt-auto">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
};

// --- Page Sections ---

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1519074063223-997672cc02d0?q=80&w=2000" 
          alt="Cinematic Universe" 
          className="w-full h-full object-cover scale-110"
        />
        <FloatingParticles />
      </div>
      
      <div className="container-responsive relative z-20 text-center space-y-8">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1 }}
        >
          <span className="px-6 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-sm">
            The Hub of Imagination
          </span>
        </motion.div>
        
        <motion.h1 
          className="text-6xl md:text-8xl font-serif font-black"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <span className="block text-white mb-2">Turn Your Story</span>
          <span className="block text-gradient">Into a Universe</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl mx-auto font-sans"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          From writing to branding, from imagination to reality. Transform your narrative into an immersive brand experience.
        </motion.p>
        
        <motion.div
          className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Button size="lg" className="h-16 px-12 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform text-lg font-bold group shadow-2xl shadow-primary/20">
            Start Your Journey
            <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button variant="outline" size="lg" className="h-16 px-10 rounded-full border-white/10 hover:bg-white/5 text-lg font-medium backdrop-blur-md">
            Explore Services
          </Button>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-muted-foreground/50"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent" />
      </motion.div>
    </section>
  );
};

const JourneyBar = () => {
  const steps = [
    { label: "Idea", icon: Sparkles, desc: "The Genesis" },
    { label: "Writing", icon: BookOpen, desc: "The Scripture" },
    { label: "Design", icon: Layout, desc: "The Visuals" },
    { label: "Marketing", icon: Megaphone, desc: "The Echo" },
    { label: "Universe", icon: Globe, desc: "The Legacy" }
  ];

  return (
    <div className="container-responsive py-32">
      <div className="relative p-12 rounded-[3rem] bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border border-white/5">
        <div className="absolute top-1/2 left-20 right-20 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />
        
        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-12 md:gap-0">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center group flex-1"
            >
              <div className="w-20 h-20 rounded-3xl bg-[#0f0f10] border border-white/10 flex items-center justify-center mb-6 group-hover:border-primary group-hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-500 relative">
                 <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 rounded-3xl transition-colors" />
                 <step.icon size={28} className="text-muted-foreground group-hover:text-primary transition-colors duration-500 relative z-10" />
                 {idx < steps.length - 1 && (
                   <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block group-hover:translate-x-2 transition-transform">
                      <ChevronRight size={16} className="text-primary/20" />
                   </div>
                 )}
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-primary transition-colors mb-1">{step.label}</span>
              <span className="text-[10px] font-serif italic text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{step.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketplaceAndCompetition = () => {
  return (
    <div className="container-responsive py-32 pb-48">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Marketplace */}
          <div className="space-y-12">
             <div className="space-y-4">
                <h3 className="text-3xl font-serif font-bold text-gradient">The Creator Council</h3>
                <p className="text-muted-foreground text-lg">Direct access to the architects, weavers, and painters of the digital age.</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { name: "Samer A.", role: "Lead Illustrator", rating: 5, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samer" },
                  { name: "Laila H.", role: "Sound Architect", rating: 4.9, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laila" }
                ].map((freelancer, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4 group">
                     <div className="w-16 h-16 rounded-2xl bg-white/10 overflow-hidden shrink-0">
                        <img src={freelancer.img} alt={freelancer.name} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate group-hover:text-primary transition-colors">{freelancer.name}</h4>
                        <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">{freelancer.role}</p>
                        <div className="flex items-center gap-1 mt-2 text-primary">
                           <Star size={10} fill="currentColor" />
                           <span className="text-xs font-bold">{freelancer.rating}</span>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
             <Button variant="ghost" className="text-primary hover:bg-primary/10 gap-2 font-bold uppercase tracking-widest text-xs">
                Browse Marketplace <ArrowRight size={14} />
             </Button>
          </div>

          {/* Competitions */}
          <div className="space-y-12">
             <div className="space-y-4">
                <h3 className="text-3xl font-serif font-bold text-gradient">The Arena</h3>
                <p className="text-muted-foreground text-lg">Battle for glory. Winners receive exclusive marketing drops and funding.</p>
             </div>
             
             <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                   <Star size={80} className="text-primary" />
                </div>
                <div className="space-y-6 relative z-10">
                   <div className="flex items-center gap-4">
                      <div className="px-3 py-1 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest">Active Challenge</div>
                      <span className="text-xs font-bold text-white/60"> ends in 4 Days</span>
                   </div>
                   <h4 className="text-2xl font-serif font-black">"Genesis of the Fallen"</h4>
                   <p className="text-sm text-muted-foreground leading-relaxed">Design a character sound identity for a fallen celestial being. Top 3 entries get showcased in the Studio.</p>
                   <div className="flex items-center -space-x-2">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-white/10 overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="user" />
                         </div>
                       ))}
                       <span className="pl-4 text-xs font-bold text-white/40">+124 participants</span>
                   </div>
                   <Button className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest">Join the Arena</Button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const ServicesGrid = () => {
  const sections = [
    {
      title: "Product & Merch Design",
      icon: Shirt,
      description: "Tangible pieces of your world, crafted for your fans.",
      items: ["Story T-shirts", "Box Collections", "Posters & Art", "Special Edition Covers"]
    },
    {
      title: "Marketing & Media",
      icon: Film,
      description: "Visual storytelling that captivates and attracts audiences.",
      items: ["Cinematic Trailers", "Reels & TikTok UI", "Social Media Mockups", "Campaign Visuals"]
    },
    {
      title: "Music & Sound",
      icon: Music,
      description: "The sonic soul of your universe, composed with passion.",
      items: ["Theme Songs", "Background Score", "Character Sound Identity", "Atmospheric SFX"]
    },
    {
      title: "Advertising & Branding",
      icon: Megaphone,
      description: "Building an author brand that stands the test of time.",
      items: ["Campaign Dashboards", "Branding Kits", "Author Identity Cards", "Strategy Roadmap"]
    }
  ];

  return (
    <section className="container-responsive py-24 pb-48">
      <SectionTitle 
        centered
        title="Creative Arsenal"
        subtitle="Every tool you need to transform a single spark into a global phenomenon."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {sections.map((section, idx) => (
          <ServiceCard key={idx} {...section} />
        ))}
      </div>
    </section>
  );
};

const AdvancedLabs = () => {
  return (
    <section className="bg-black/20 py-32 rounded-[4rem] mx-4 md:mx-12 overflow-hidden border border-white/5 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] -mr-48 -mt-48 rounded-full" />
      <div className="container-responsive relative z-10">
        <SectionTitle 
          title="The Forge: Advanced Labs"
          subtitle="Push the boundaries of storytelling with our experimental high-end service pods."
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* World Building Lab */}
          <div className="lg:col-span-2 glass-card p-12 rounded-[3rem] overflow-hidden group">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="flex-1 space-y-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center ring-1 ring-secondary/20">
                  <Map size={32} />
                </div>
                <h3 className="text-3xl font-serif font-bold">World Building Lab</h3>
                <p className="text-muted-foreground italic text-lg leading-relaxed">
                  "Map your thoughts into reality. Define the topography, culture, and architecture of your imagination."
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm font-bold text-primary">
                    <ChevronRight size={16} /> Interactive Map Preview
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-white/40">
                    <ChevronRight size={16} /> Character Evolution Tree
                  </div>
                </div>
                <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/10 px-8 mt-4">Enter the Lab</Button>
              </div>
              <div className="flex-1 relative aspect-[4/3] md:aspect-auto min-h-[300px]">
                 <div className="absolute inset-0 bg-[#0f0f10] rounded-[2rem] overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/30 transition-all shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548345680-f5475ee511d7?q=80&w=1000')] bg-cover opacity-20 mix-blend-luminosity" />
                    <motion.div 
                      className="absolute top-1/2 left-1/3 w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(255,215,0,0.8)]"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="w-[80%] h-[80%] border border-primary/10 rounded-full animate-[spin_60s_linear_infinite]" />
                       <div className="w-[60%] h-[60%] border border-primary/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
          
          {/* Interactive Experience */}
          <div className="glass-card p-10 rounded-[3rem] flex flex-col justify-between group overflow-hidden relative">
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl rounded-full" />
             <div className="space-y-6">
               <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                 <Radio size={24} />
               </div>
               <h3 className="text-2xl font-serif font-bold">Visual Novel Experiences</h3>
               <p className="text-sm text-muted-foreground leading-loose">Transform your narrative into an interactive choice-based epic.</p>
             </div>
             <div className="mt-12 space-y-3 relative">
                <div className="absolute -left-10 -right-10 top-0 bottom-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
                <motion.div whileHover={{ scale: 1.02 }} className="w-full p-5 rounded-2xl bg-primary/20 text-primary border border-primary/40 text-xs font-black uppercase tracking-wider text-center cursor-pointer shadow-lg shadow-primary/5">
                  Reclaim the Throne
                </motion.div>
                <div className="w-full p-5 rounded-2xl bg-white/5 text-white/30 border border-white/5 text-xs font-black uppercase tracking-wider text-center opacity-50">
                  Exile into the Wasteland
                </div>
             </div>
          </div>
          
          {/* Author Brand Builder */}
          <div className="lg:col-span-1 glass-card p-10 rounded-[3rem] group">
             <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-8">
               <Users size={24} />
             </div>
             <h3 className="text-2xl font-serif font-bold mb-4">Author Brand Builder</h3>
             <p className="text-sm text-muted-foreground mb-10 leading-relaxed">From "Writer" to "Icon". We sculpt your professional identity for the global stage.</p>
             <div className="flex items-center gap-6 p-4 rounded-3xl bg-black/40 border border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                   <div className="w-8 h-8 rounded-full bg-white/10" />
                </div>
                <ArrowRight size={24} className="text-primary animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all duration-700 group-hover:scale-110">
                   <Star size={24} className="text-primary" />
                </div>
             </div>
             <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/30 text-center">Transforming Identity</div>
          </div>

          {/* Audiobook Studio */}
          <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] group overflow-hidden relative">
             <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="w-full md:w-1/3">
                  <div className="relative aspect-square">
                     <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse blur-3xl" />
                     <div className="relative aspect-square rounded-[2rem] bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden ring-1 shadow-2xl">
                        <Mic size={64} className="text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/20 to-transparent" />
                     </div>
                  </div>
               </div>
               <div className="flex-1 space-y-6">
                 <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-serif font-bold">Audiobook Studio</h3>
                   <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Studio Session</span>
                   </div>
                 </div>
                 
                 <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-4">
                       <span>The Lost Prophet - Chapter 12</span>
                       <span>2:45 / 14:00</span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                       {[...Array(40)].map((_, i) => (
                         <motion.div 
                           key={i} 
                           className="flex-1 bg-primary/40 rounded-full"
                           animate={{ height: [Math.random() * 20 + 5 + i/2, Math.random() * 40 + 10, Math.random() * 20 + 5] }}
                           transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                         />
                       ))}
                    </div>
                 </div>
                 
                 <div className="flex gap-4">
                    <Button size="sm" variant="ghost" className="rounded-full bg-white/5 gap-2 text-[10px] font-bold uppercase tracking-widest">
                       <Users size={12} /> Voice A
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full bg-primary/10 text-primary gap-2 text-[10px] font-bold uppercase tracking-widest ring-1 ring-primary/20">
                       <Users size={12} /> Voice B
                    </Button>
                 </div>
               </div>
             </div>
          </div>

          {/* Film Pitch Studio */}
          <div className="lg:col-span-3 glass-card p-12 rounded-[3.5rem] group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
             <div className="relative z-20">
                <SectionTitle 
                  title="Film Pitch Studio"
                  subtitle="Prepare your story for the silver screen with industry-standard pitch decks and visual narratives."
                />
                
                <div className="flex gap-6 overflow-hidden mt-12 py-8">
                   {[
                     { title: "ELDORIA", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400" },
                     { title: "NEON RIOT", img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400" },
                     { title: "SANDS OF TIME", img: "https://images.unsplash.com/photo-1544081044-1734bc12260b?q=80&w=400" },
                     { title: "GHOST SHIP", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400" },
                     { title: "DARK REACH", img: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=400" }
                   ].map((poster, i) => (
                     <motion.div 
                        key={i}
                        whileHover={{ scale: 1.1, zIndex: 30, rotateY: 5 }}
                        className="min-w-[220px] aspect-[2/3] rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative shadow-2xl cursor-pointer"
                     >
                        <img src={poster.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={poster.title} />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent text-[10px] font-black uppercase tracking-widest text-white">
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
  return (
    <section className="py-48 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-primary/10 blur-[200px] rounded-full z-0" />
      <div className="container-responsive relative z-10 space-y-12">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="space-y-6"
        >
          <h2 className="text-5xl md:text-8xl font-serif font-black tracking-tight">
            This is not just a story.<br/>
            <span className="text-gradient">This is your universe.</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Ready to give your narrative the cinematic treatment it deserves? Join the elite creators at Hekayaty Studio.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button size="lg" className="h-20 px-16 rounded-[2rem] bg-white text-black hover:bg-white/90 hover:scale-105 transition-all text-xl font-black group overflow-hidden relative">
            <span className="relative z-10">Enter Hekayaty Studio</span>
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const HekayatyStudio = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-primary/30">
      <Navbar />
      <Hero />
      <JourneyBar />
      <ServicesGrid />
      <MarketplaceAndCompetition />
      <AdvancedLabs />
      <FinalCTA />
      
      {/* Footer / Contact */}
      <footer className="py-20 border-t border-white/5">
        <div className="container-responsive flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground">
          <div className="font-serif font-bold text-2xl text-gradient">Hekayaty Studio</div>
          <div className="flex gap-12 text-sm font-medium">
             <a href="#" className="hover:text-primary transition-colors">Instagram</a>
             <a href="#" className="hover:text-primary transition-colors">TikTok</a>
             <a href="#" className="hover:text-primary transition-colors">Twitter</a>
             <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
          <div className="text-xs tracking-widest uppercase opacity-20">© 2026 Hekayaty Collective</div>
        </div>
      </footer>
    </div>
  );
};

export default HekayatyStudio;
