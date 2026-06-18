import { Link } from "wouter";
import { useHallOfFame } from "@/hooks/use-awards";
import { Navbar } from "@/components/Navbar";
import { Helmet } from "react-helmet-async";
import { Star, Crown, CheckCircle2, Loader2, Sparkles, Quote, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HallOfFame() {
  const { data: hofWriters, isLoading } = useHallOfFame();

  return (
    <>
      <Helmet>
        <title>Hall of Fame | قاعة الشهرة</title>
        <meta name="description" content="Discover the elite writers and storytellers inducted into the Hekayaty Hall of Fame." />
      </Helmet>

      <div className="min-h-screen bg-[#050505] flex flex-col font-sans selection:bg-purple-500/30" dir="rtl">
        <Navbar />

        {/* Hero Section */}
        <div className="relative pt-32 pb-20 overflow-hidden">
          {/* Starfield & Nebula Background */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#0a0514]/80 to-[#050505] pointer-events-none" />
          
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 mb-6 bg-purple-500/10 border border-purple-500/30 rounded-full px-5 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(147,51,234,0.15)]">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-black tracking-widest uppercase">النخبة المختارة</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
              قاعة <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">الشهرة</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              تخليداً للكتّاب الذين تركوا بصمة لا تُمحى في عالم حكايتي. أساطير نسجت عوالم الخيال وألهمت أجيالاً من القراء والمبدعين.
            </p>

            <div className="mt-12 flex justify-center gap-4">
              <Link href="/awards">
                <Button variant="outline" className="gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 h-12 px-8 rounded-full">
                  <Trophy className="w-4 h-4" />
                  اكتشف جوائز حكايتي السنوية
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-16">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500/50" />
              <p className="text-purple-500/60 font-bold">جاري تحميل الأساطير...</p>
            </div>
          ) : !hofWriters?.length ? (
            <div className="text-center py-32">
              <Star className="w-20 h-20 text-white/5 mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white/40 mb-2">القاعة قيد التجهيز</h2>
              <p className="text-white/20">سيتم الإعلان عن أول المختارين قريباً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {hofWriters.map((entry, index) => (
                <HOFCard key={entry.id} entry={entry} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function HOFCard({ entry, index }: { entry: any; index: number }) {
  const username = entry.writer?.username;
  const avatarUrl = entry.writer?.avatarUrl || entry.writer?.avatar_url;
  const bannerUrl = entry.writer?.bannerUrl || entry.writer?.banner_url;
  const displayName = entry.writer?.displayName || entry.writer?.display_name;
  
  // Create a slight staggered delay based on index for animation if we add framer-motion later
  const delay = index * 0.1;

  return (
    <Link href={username ? `/writer/${username}` : "#"} className="group block h-full">
      <div className="h-full rounded-3xl bg-[#0a0a0f] border border-white/5 overflow-hidden transition-all duration-500 hover:border-purple-500/30 hover:shadow-[0_20px_40px_rgba(147,51,234,0.1)] hover:-translate-y-2 flex flex-col relative">
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-900/10 transition-colors duration-500 pointer-events-none" />

        {/* Banner */}
        <div className="h-32 relative overflow-hidden bg-zinc-900">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-indigo-900/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
        </div>

        <div className="px-6 pb-8 pt-0 flex-1 flex flex-col relative z-10">
          {/* Avatar & Badge */}
          <div className="flex justify-between items-end mb-4 -mt-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[#0a0a0f] bg-[#0a0a0f] shadow-xl">
                <img 
                  src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "U")}&background=000&color=fff&size=150`} 
                  alt={displayName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              </div>
              {entry.writer?.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-[#0a0a0f] rounded-full p-1">
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                </div>
              )}
            </div>
            
            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 px-3 py-1.5 font-bold mb-2 shadow-[0_0_15px_rgba(147,51,234,0.2)]">
              <Star className="w-3.5 h-3.5 ml-1.5 fill-purple-400 text-purple-400 inline" />
              {entry.badgeLabel}
            </Badge>
          </div>

          {/* Info */}
          <div>
            <h2 className="text-2xl font-black text-white mb-1 group-hover:text-purple-400 transition-colors">{displayName}</h2>
            <p className="text-gray-500 text-sm font-mono mb-4">@{username}</p>
          </div>

          {/* Achievement Note */}
          {entry.achievementNote && (
            <div className="mb-5 inline-flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 border border-white/5">
              <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
              <span className="line-clamp-1">{entry.achievementNote}</span>
            </div>
          )}

          {/* Featured Reason (Quote Style) */}
          {entry.featuredReason && (
            <div className="mt-auto relative">
              <Quote className="absolute -top-2 -right-2 w-8 h-8 text-white/5 transform -scale-x-100" />
              <p className="text-gray-400 text-sm leading-relaxed italic pr-6 relative z-10 line-clamp-3">
                "{entry.featuredReason}"
              </p>
            </div>
          )}

        </div>
      </div>
    </Link>
  );
}
