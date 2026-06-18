import { useState } from "react";
import { Link } from "wouter";
import { usePublishedAwards } from "@/hooks/use-awards";
import { Navbar } from "@/components/Navbar";
import { Helmet } from "react-helmet-async";
import { Trophy, Crown, BookOpen, Users, Medal, Award, CheckCircle2, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HekayatyAwards() {
  const { data: awards, isLoading: awardsLoading } = usePublishedAwards();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Set default year when loaded
  if (!selectedYear && awards && awards.length > 0) {
    setSelectedYear(awards[0].year);
  }

  const selectedAward = awards?.find(a => a.year === selectedYear);

  // Fetch winners for selected award
  const { data: winners, isLoading: winnersLoading } = useQuery({
    queryKey: ["award-winners", selectedAward?.id],
    queryFn: async () => {
      if (!selectedAward?.id) return [];
      const { data, error } = await supabase
        .from("hekayaty_award_winners")
        .select("*")
        .eq("award_id", selectedAward.id)
        .order("rank", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const userIds = data.filter((w: any) => w.winner_user_id).map((w: any) => w.winner_user_id);
      const productIds = data.filter((w: any) => w.winner_product_id).map((w: any) => w.winner_product_id);

      const [usersRes, productsRes] = await Promise.all([
        userIds.length > 0 ? supabase.from("users").select("id, username, display_name, avatar_url, is_verified, role").in("id", userIds) : { data: [] },
        productIds.length > 0 ? supabase.from("products").select("id, title, cover_url, writer_id, genre").in("id", productIds) : { data: [] },
      ]);

      const writerIds = (productsRes.data || []).map((p: any) => p.writer_id).filter(Boolean);
      const writersRes = writerIds.length > 0 ? await supabase.from("users").select("id, display_name, username").in("id", writerIds) : { data: [] };

      const userMap: Record<string, any> = {};
      (usersRes.data || []).forEach((u: any) => { userMap[u.id] = u; });
      const writerMap: Record<string, any> = {};
      (writersRes.data || []).forEach((u: any) => { writerMap[u.id] = u; });
      const productMap: Record<number, any> = {};
      (productsRes.data || []).forEach((p: any) => { productMap[p.id] = { ...p, writer: writerMap[p.writer_id] }; });

      return data.map((w: any) => ({
        ...w,
        user: w.winner_user_id ? userMap[w.winner_user_id] : null,
        product: w.winner_product_id ? productMap[w.winner_product_id] : null,
      }));
    },
    enabled: !!selectedAward?.id,
  });

  const bestWriters = winners?.filter(w => w.category === "best_writer") || [];
  const bestPublishers = winners?.filter(w => w.category === "best_publisher") || [];
  const bestNovels = winners?.filter(w => w.category === "best_novel") || [];

  return (
    <>
      <Helmet>
        <title>Hekayaty Awards | جوائز حكايتي</title>
        <meta name="description" content="Discover the winners of the annual Hekayaty Awards for best novels, writers, and publishing houses." />
      </Helmet>

      <div className="min-h-screen bg-[#080808] flex flex-col font-sans selection:bg-yellow-500/30" dir="rtl">
        <Navbar />

        {/* Hero Section */}
        <div className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[#1a1005] via-[#0f0904] to-[#080808] border-b border-yellow-500/10">
          {/* Cinematic lighting effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-yellow-500/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-5 py-2 backdrop-blur-sm shadow-[0_0_15px_rgba(234,179,8,0.15)]">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-black tracking-widest uppercase">الحدث السنوي الأكبر</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
              جوائز <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600">حكايتي</span>
            </h1>
            
            <p className="text-lg md:text-xl text-yellow-100/60 max-w-2xl mx-auto leading-relaxed font-medium">
              {selectedAward?.description || "الاحتفاء السنوي بأفضل الإبداعات والأقلام ودور النشر التي شكلت خيالنا وأثرت مكتبة حكايتي."}
            </p>

            {/* Year Selector */}
            {awards && awards.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-12 overflow-x-auto pb-4 custom-scrollbar">
                {awards.map((award) => (
                  <button
                    key={award.year}
                    onClick={() => setSelectedYear(award.year)}
                    className={cn(
                      "px-8 py-3 rounded-full text-lg font-black transition-all duration-300 border backdrop-blur-md",
                      selectedYear === award.year
                        ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] scale-105"
                        : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-yellow-100"
                    )}
                  >
                    {award.year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-16">
          {awardsLoading || winnersLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-2 border-yellow-500 animate-spin" />
                <Trophy className="absolute inset-0 m-auto w-8 h-8 text-yellow-500/50" />
              </div>
              <p className="text-yellow-500/60 font-bold animate-pulse">جاري تحضير السجادة الحمراء...</p>
            </div>
          ) : !awards?.length ? (
            <div className="text-center py-32">
              <Trophy className="w-20 h-20 text-white/5 mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white/40 mb-2">لم تبدأ الجوائز بعد</h2>
              <p className="text-white/20">ترقبوا الإعلان عن جوائز حكايتي قريباً.</p>
            </div>
          ) : (
            <div className="space-y-32">
              
              {/* Best Publishers Category */}
              {bestPublishers.length > 0 && (
                <section>
                  <SectionHeading icon={<Users className="w-6 h-6" />} title="أفضل دور النشر" subtitle="المؤسسات التي قدمت أعمالاً استثنائية" />
                  <Podium category="publisher" winners={bestPublishers} />
                </section>
              )}

              {/* Best Writers Category */}
              {bestWriters.length > 0 && (
                <section>
                  <SectionHeading icon={<Crown className="w-6 h-6" />} title="أفضل الكتّاب" subtitle="أقلام سحرت الملايين بإبداعها" />
                  <Podium category="writer" winners={bestWriters} />
                </section>
              )}

              {/* Best Novels Category */}
              {bestNovels.length > 0 && (
                <section>
                  <SectionHeading icon={<BookOpen className="w-6 h-6" />} title="أفضل الروايات" subtitle="القصص التي لا تُنسى" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
                    {bestNovels.map((winner) => (
                      <NovelCard key={winner.id} winner={winner} />
                    ))}
                  </div>
                </section>
              )}

              {winners?.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                  <p className="text-white/40 font-bold text-lg">لم يتم إعلان الفائزين لعام {selectedYear} حتى الآن.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-16 relative">
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent -z-10" />
      <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#080808] border border-yellow-500/20 text-yellow-400 mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
        {icon}
      </div>
      <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{title}</h2>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  );
}

function Podium({ winners, category }: { winners: any[]; category: "writer" | "publisher" }) {
  const first = winners.find(w => w.rank === 1);
  const second = winners.find(w => w.rank === 2);
  const third = winners.find(w => w.rank === 3);

  return (
    <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-4 mt-12 px-4 h-full min-h-[400px]">
      {/* Rank 2 - Silver */}
      {second && (
        <div className="w-full md:w-1/3 flex flex-col items-center order-2 md:order-1 transform translate-y-8">
          <WinnerAvatar winner={second} type="silver" />
          <div className="w-full bg-gradient-to-b from-gray-300/10 to-transparent border-t-4 border-gray-300 rounded-t-xl p-6 text-center h-48 flex flex-col items-center">
            <Medal className="w-8 h-8 text-gray-300 mb-2 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)]" />
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{second.user?.display_name || second.user?.displayName}</h3>
            {second.badge_label && <Badge className="bg-gray-300/20 text-gray-300 border-gray-300/30">{second.badge_label}</Badge>}
          </div>
        </div>
      )}

      {/* Rank 1 - Gold */}
      {first && (
        <div className="w-full md:w-1/3 flex flex-col items-center order-1 md:order-2 z-10">
          <WinnerAvatar winner={first} type="gold" />
          <div className="w-full bg-gradient-to-b from-yellow-500/20 to-transparent border-t-4 border-yellow-400 rounded-t-xl p-6 text-center h-56 flex flex-col items-center shadow-[0_-10px_30px_rgba(234,179,8,0.15)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />
            <Crown className="w-10 h-10 text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
            <h3 className="text-2xl font-black text-white mb-2 line-clamp-1">{first.user?.display_name || first.user?.displayName}</h3>
            {first.badge_label && <Badge className="bg-yellow-500 text-black border-yellow-400 font-bold px-3 py-1 text-sm shadow-[0_0_15px_rgba(234,179,8,0.4)]">{first.badge_label}</Badge>}
            {first.special_note && <p className="text-xs text-yellow-200/60 mt-3 max-w-[200px] mx-auto line-clamp-2">{first.special_note}</p>}
          </div>
        </div>
      )}

      {/* Rank 3 - Bronze */}
      {third && (
        <div className="w-full md:w-1/3 flex flex-col items-center order-3 md:order-3 transform translate-y-16">
          <WinnerAvatar winner={third} type="bronze" />
          <div className="w-full bg-gradient-to-b from-amber-700/20 to-transparent border-t-4 border-amber-600 rounded-t-xl p-6 text-center h-40 flex flex-col items-center">
            <Award className="w-8 h-8 text-amber-500 mb-2 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]" />
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{third.user?.display_name || third.user?.displayName}</h3>
            {third.badge_label && <Badge className="bg-amber-700/30 text-amber-500 border-amber-600/30">{third.badge_label}</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}

function WinnerAvatar({ winner, type }: { winner: any; type: "gold" | "silver" | "bronze" }) {
  const username = winner.user?.username;
  const avatarUrl = winner.user?.avatar_url || winner.user?.avatarUrl;
  const displayName = winner.user?.display_name || winner.user?.displayName;
  
  const colors = {
    gold: "border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)]",
    silver: "border-gray-300 shadow-[0_0_20px_rgba(209,213,219,0.2)]",
    bronze: "border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.2)]"
  };

  const sizes = {
    gold: "w-32 h-32 md:w-40 md:h-40 border-4",
    silver: "w-24 h-24 md:w-32 md:h-32 border-4",
    bronze: "w-20 h-20 md:w-28 md:h-28 border-2"
  };

  return (
    <Link href={username ? `/writer/${username}` : "#"} className="group relative mb-6 block">
      <div className={cn("rounded-full overflow-hidden relative z-10 transition-transform duration-500 group-hover:scale-105", sizes[type], colors[type])}>
        <img 
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "U")}&background=000&color=fff&size=200`} 
          alt={displayName} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <span className="text-white text-xs font-bold px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm border border-white/20">زيارة الملف</span>
        </div>
      </div>
      {winner.user?.is_verified && type === "gold" && (
        <div className="absolute -bottom-2 -right-2 z-20 bg-black rounded-full p-1 border-2 border-yellow-400">
          <CheckCircle2 className="w-6 h-6 text-yellow-400" />
        </div>
      )}
    </Link>
  );
}

function NovelCard({ winner }: { winner: any }) {
  const isTop3 = winner.rank <= 3;
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-amber-600 text-black";
    if (rank === 2) return "from-gray-300 to-gray-500 text-black";
    if (rank === 3) return "from-amber-600 to-amber-800 text-white";
    return "from-white/10 to-white/5 text-white border border-white/10";
  };

  return (
    <Link href={`/product/${winner.product?.id}`} className="group relative block">
      <div className={cn(
        "rounded-2xl bg-white/[0.02] border transition-all duration-500 overflow-hidden h-full flex flex-col",
        isTop3 ? "border-yellow-500/20 hover:border-yellow-500/50 hover:shadow-[0_10px_40px_rgba(234,179,8,0.15)]" : "border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
      )}>
        {/* Rank Badge */}
        <div className={cn(
          "absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg bg-gradient-to-br",
          getRankColor(winner.rank)
        )}>
          {winner.rank}
        </div>

        <div className="relative aspect-[2/3] overflow-hidden bg-black/50">
          {winner.product?.cover_url || winner.product?.coverUrl ? (
            <img 
              src={winner.product.cover_url || winner.product.coverUrl} 
              alt={winner.product.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <BookOpen className="w-12 h-12 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
          
          <div className="absolute bottom-0 inset-x-0 p-4">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-yellow-400 transition-colors">{winner.product?.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-1">{winner.product?.writer?.display_name || winner.product?.writer?.displayName}</p>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1 bg-gradient-to-b from-[#111] to-[#080808]">
          {winner.badge_label && (
            <div className="flex items-start">
              <Badge className={cn(
                "bg-transparent border",
                isTop3 ? "text-yellow-400 border-yellow-500/30" : "text-gray-400 border-white/10"
              )}>
                {winner.badge_label}
              </Badge>
            </div>
          )}
          {winner.special_note && (
            <p className="text-xs text-gray-500 mt-auto">{winner.special_note}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
