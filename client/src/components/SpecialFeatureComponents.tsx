/**
 * 🎪 EVENT COMPONENTS
 * High-performance, prefetch-enabled UI elements for Store Events.
 */

import { motion } from "framer-motion";
import { Calendar, BookOpen, Clock } from "lucide-react";
import { StoreEvent, SuccessPartner } from "@shared/special-features-schema";
import { usePrefetchHover, optimizeImage, prefetchImage } from "@/lib/performance-core";
import { fetchEventBooks } from "@/hooks/use-special-features";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface EventCardProps {
  event: StoreEvent;
}

export function EventCard({ event }: EventCardProps) {
  const { t } = useTranslation();
  
  // 1. Calculate days remaining
  const daysLeft = Math.ceil(
    (new Date(event.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // 2. Beyond Rocket: Prefetch book details on hover
  const prefetchProps = usePrefetchHover(
    ["event-books", event.id],
    () => fetchEventBooks(event.bookIds)
  );

  // Supplemental: Prefetch event cover image immediately if visible
  const optimizedCover = optimizeImage(event.coverUrl, 800);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      {...prefetchProps}
      className="group relative overflow-hidden rounded-2xl glass-card border border-primary/10 transition-all hover:shadow-2xl hover:shadow-primary/5"
    >
      <Link href={`/events/${event.id}`}>
        <div className="cursor-pointer">
          {/* Cover Image */}
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={optimizedCover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80'}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <Badge className="absolute top-4 right-4 bg-primary/90 text-white border-none backdrop-blur-md">
              <Clock className="w-3 h-3 mr-1" />
              {daysLeft} {t("events.days_left")}
            </Badge>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {event.bookIds.length} {t("events.books")}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(event.startDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-primary">
                {event.price} <small className="text-sm font-normal text-muted-foreground">SAR</small>
              </span>
              <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold group-hover:bg-primary group-hover:text-white transition-all">
                {t("events.view_collection")}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * 🤝 PARTNER COMPONENTS
 */
interface PartnerCardProps {
  partner: SuccessPartner;
}

export function PartnerCard({ partner }: PartnerCardProps) {
  // Beyond Rocket: Prefetching logo handle
  const prefetchProps = usePrefetchHover(
    ["partner", partner.id], 
    async () => partner // Simple pre-warm
  );

  return (
    <motion.div
      {...prefetchProps}
      className="flex flex-col items-center p-6 rounded-2xl glass-card border border-primary/5 hover:border-primary/20 transition-all text-center"
    >
      <div className="w-20 h-20 mb-4 overflow-hidden rounded-full bg-white/5 border border-primary/10 flex items-center justify-center p-2">
        <img
          src={optimizeImage(partner.logoUrl, 200)}
          alt={partner.name}
          className="max-w-full max-h-full object-contain filter grayscale transition-all group-hover:grayscale-0"
        />
      </div>
      <h4 className="font-bold text-foreground mb-1">{partner.name}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{partner.description}</p>
    </motion.div>
  );
}
