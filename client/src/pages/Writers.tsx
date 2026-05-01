import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useWriters } from "@/hooks/use-users";
import { FeaturedWriter } from "@/components/FeaturedWriter";
import { Search, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import writersBg from "@/assets/WhatsApp Image 2026-01-07 at 8.17.48 PM.jpeg";

import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { SEO } from "@/components/SEO";

export default function Writers() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const { data: writers, isLoading } = useWriters();

    const filteredWriters = (writers || [])
        .filter(writer =>
            writer.displayName.toLowerCase().includes(search.toLowerCase()) ||
            (writer.bio && writer.bio.toLowerCase().includes(search.toLowerCase())) ||
            writer.username.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));

    if (isLoading) return <PageSkeleton />;

    return (
        <div className="min-h-screen relative overflow-hidden bg-black text-white font-sans">
            <SEO 
                title={t('writers.title')}
                description={t('writers.subtitle')}
                type="website"
            />
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 opacity-40"
                style={{ backgroundImage: `url(${writersBg})` }}
            />
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/60 via-black/90 to-black" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                <main className="flex-grow pt-40 pb-32">
                  <div className="container-responsive max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="mb-20 text-center">
                        <h1 className="text-5xl md:text-7xl font-serif font-black mb-8 text-white tracking-tight leading-tight">
                            {t('writers.title')}
                        </h1>
                        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
                            {t('writers.subtitle')}
                        </p>
                    </div>

                    {/* Control Bar (Search & Counter) */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto w-full mb-16">
                        <div className="relative group w-full">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-30 transition-opacity duration-500" />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t('writers.searchPlaceholder')}
                                className="w-full pl-16 pr-8 py-5 rounded-3xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none backdrop-blur-3xl text-lg font-medium shadow-2xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-xs font-bold whitespace-nowrap">
                                <span className="text-primary font-black">{filteredWriters.length}</span>
                                <span className="uppercase tracking-widest opacity-80">{t("writers.title").split(' ')[0]}</span>
                            </div>
                        </div>
                    </div>

                    {/* Writers Grid */}
                    {filteredWriters.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
                            {filteredWriters.map(writer => (
                                <FeaturedWriter key={writer.id} writer={writer} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white/[0.02] rounded-[40px] backdrop-blur-2xl border border-white/5 max-w-4xl mx-auto">
                            <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-white/5 mb-8 border border-white/10">
                                <Users className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-3xl font-black font-serif mb-4 text-white tracking-tight">{t('writers.notFound')}</h3>
                            <p className="text-white/40 text-lg">{t('writers.notFoundHint')}</p>
                        </div>
                    )}
                  </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}
