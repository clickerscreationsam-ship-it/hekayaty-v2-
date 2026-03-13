/**
 * 🚀 BEYOND ROCKET: EVENTS & PARTNERS PAGE
 * Demonstrates full integration of the new performance features.
 */

import { Navbar } from "@/components/Navbar";
import { useActiveEvents, useSuccessPartners } from "@/hooks/use-special-features";
import { EventCard, PartnerCard } from "@/components/SpecialFeatureComponents";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StoreEvent, SuccessPartner } from "@shared/special-features-schema";

export default function EventsAndPartnersPage() {
  const { t } = useTranslation();
  
  // High-performance data fetching (served from IndexedDB/LRU if available)
  const { data: events, isLoading: eventsLoading } = useActiveEvents();
  const { data: partners, isLoading: partnersLoading } = useSuccessPartners();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* 🎪 Events Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground">{t("events.title")}</h1>
            <p className="text-muted-foreground">{t("events.subtitle")}</p>
          </div>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[16/10] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(events as StoreEvent[])?.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {(!events || (events as StoreEvent[]).length === 0) && (
              <div className="col-span-full py-20 text-center glass-card rounded-3xl border border-dashed border-primary/20">
                <p className="text-muted-foreground">{t("events.no_active_events")}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 🤝 Success Partners (Dar Alnashr) Section */}
      <section className="py-20 bg-primary/[0.02] border-y border-primary/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-foreground mb-4 flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-primary" />
              {t("partners.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("partners.description")}</p>
          </div>

          {partnersLoading ? (
            <div className="flex justify-center gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-40 h-40 bg-muted animate-pulse rounded-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {(partners as SuccessPartner[])?.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 🚀 Instant-Load Stats Footer */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-2">
             <div className="text-5xl font-black text-primary">50+</div>
             <div className="text-muted-foreground font-bold">{t("stats.partners")}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-2">
             <div className="text-5xl font-black text-primary">1k+</div>
             <div className="text-muted-foreground font-bold">{t("stats.events")}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-2">
             <div className="text-5xl font-black text-primary">10k+</div>
             <div className="text-muted-foreground font-bold">{t("stats.readers")}</div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
