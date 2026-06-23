import { Link } from "wouter";
import { Star, User, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { usePrefetchHover, optimizeImage } from "@/lib/performance-core";
import { useUserById } from "@/hooks/use-users";

interface ProductCardProps {
  product?: Product;
  collection?: any;
  variant?: "default" | "compact";
  locked?: boolean;
}

export function ProductCard({ product, collection, variant = "default", locked = false }: ProductCardProps) {
  const { t } = useTranslation();
  const isCompact = variant === "compact";

  const item = product || (collection ? {
    id: collection.id,
    slug: collection.slug,
    writerId: collection.writer_id,
    title: collection.title,
    description: collection.description,
    coverUrl: collection.cover_image_url,
    price: collection.price,
    isCollection: true,
    label: collection.label || null,
    discount: collection.discount_percentage || collection.discountPercentage,
    originalPrice: collection.original_total_price || collection.originalTotalPrice,
    storiesCount: collection.items?.length || 0,
    genre: t("home.collections.badge"),
  } : null);

  const { data: writer } = useUserById(item?.writerId);

  if (!item) return null;

  const isCollection = !!(item as any).isCollection;
  const href = isCollection
    ? `/collections/${(item as any).slug || item.id}`
    : `/book/${item.id}`;

  const prefetchProps = usePrefetchHover(["product", item.id], async () => {
    if (isCollection) return null;
    const { data, error } = await supabase
      .from("products")
      .select(`*, content_data:product_contents(content)`)
      .eq("id", item.id)
      .single();
    if (error) return null;
    return { ...data, content: data.content || (data as any).content_data?.[0]?.content };
  });

  /* ─── Compact variant ─── */
  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        {...prefetchProps}
        className="group relative flex gap-3 p-2 bg-[#0d0a07] rounded-xl transition-all hover:bg-[#1a1208] border border-white/8 hover:border-primary/30"
      >
        <div className="w-20 h-24 shrink-0 rounded-lg overflow-hidden relative">
          <img
            src={optimizeImage(item.coverUrl, 200)}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== item.coverUrl) img.src = item.coverUrl;
            }}
          />
        </div>
        <div className="flex flex-col flex-1 justify-center py-0.5 text-right" dir="rtl">
          <h3 className="text-sm font-serif font-bold text-white line-clamp-1 mb-0.5 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-[#aaaaaa] mb-1">
            <User size={10} />
            <span className="flex items-center gap-0.5">
              {writer?.displayName || t("common.author")}
              {writer?.isVerified && <BadgeCheck className="w-2.5 h-2.5 text-primary" />}
            </span>
          </div>
          <span className="font-black text-primary text-sm mt-auto">
            {item.price > 0 ? `${item.price} ${t("common.egp")}` : t("dashboard.products.free")}
          </span>
        </div>
      </motion.div>
    );
  }

  /* ─── Default / full card ─── */
  const inner = (
    <>
      {/* ── Cover ── */}
      <div className="relative w-full shrink-0 overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {/* Actual cover image — always an <img>, never background-image */}
        <img
          src={optimizeImage(item.coverUrl, 600)}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== item.coverUrl) img.src = item.coverUrl;
          }}
        />

        {/* Very subtle bottom fade — only enough to blend into info panel */}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#0d0a07] to-transparent z-10 pointer-events-none" />

        {/* Top badges */}
        <div className="absolute top-3 inset-x-3 z-20 flex justify-between items-start pointer-events-none">
          {/* Left badges */}
          <div className="flex flex-col gap-1.5 items-start">
            <span className="px-2 py-1 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 text-[#FFB800] text-[8px] font-black uppercase tracking-widest shadow-md">
              {item.genre || t("common.novel")}
            </span>
            {product?.isSerialized && (
              <span className="px-2 py-1 rounded-full bg-red-600 text-white text-[8px] font-black shadow-md">
                {t("studio.market.ongoing")}
              </span>
            )}
            {isCollection && (item as any).label && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/95 backdrop-blur-xl text-black text-[8px] font-black shadow-lg shadow-amber-500/40">
                {(item as any).label}
              </span>
            )}
            {isCollection && (item as any).discount > 0 && (
              <span className="px-2 py-1 rounded-full bg-red-600 text-white text-[8px] font-black shadow-md">
                خصم {(item as any).discount}%
              </span>
            )}
            {!isCollection && product?.salePrice && product.salePrice < product.price && (
              <span className="px-2 py-1 rounded-full bg-red-600 text-white text-[8px] font-black shadow-md">
                خصم {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
              </span>
            )}
          </div>

          {/* Right: rating */}
          <div className="px-2 py-1 rounded-lg bg-black/65 backdrop-blur-xl text-[#FFB800] text-[10px] font-bold flex items-center gap-1 border border-white/10 shadow-md">
            <Star className="w-2.5 h-2.5 fill-[#FFB800] text-[#FFB800]" />
            <span>{product?.rating ? (product.rating / 10).toFixed(1) : "0.0"}</span>
            <span className="text-white/50 text-[9px]">({product?.reviewCount || 0})</span>
          </div>
        </div>

        {/* Collection story count pill — bottom left of cover */}
        {isCollection && (
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-xl text-black text-[9px] font-black shadow-lg border border-primary/30">
              {(item as any).storiesCount} قصة
            </span>
          </div>
        )}
      </div>

      {/* ── Info panel ── */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-2 bg-[#0d0a07]">
        {/* Author */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
            {writer?.avatarUrl ? (
              <img src={writer.avatarUrl} className="w-full h-full object-cover" alt={writer.displayName} />
            ) : (
              <User size={10} className="text-[#aaaaaa]" />
            )}
          </div>
          <span className="text-[#aaaaaa] text-[10px] font-bold truncate flex items-center gap-1">
            {writer?.displayName || (isCollection ? t("home.collections.bundle") : t("common.author"))}
            {writer?.isVerified && <BadgeCheck className="w-2.5 h-2.5 text-primary shrink-0" />}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-serif font-black text-white leading-snug line-clamp-2 group-hover:text-[#FFB800] transition-colors duration-300">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-[#888] text-[11px] leading-relaxed line-clamp-2 font-medium flex-1">
          {item.description}
        </p>

        {/* Stars row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3 h-3",
                    s <= (product?.rating ? product.rating / 10 : 0)
                      ? "fill-[#FFB800] text-[#FFB800]"
                      : "text-white/10"
                  )}
                />
              ))}
            </div>
            <span className="text-white/40 text-[9px] font-bold">({product?.reviewCount || 0})</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[8px] text-white/40 font-black uppercase tracking-widest">
            {item.genre}
          </div>
        </div>

        {/* Price */}
        <div className="pt-2 border-t border-white/8 flex items-baseline gap-2 justify-center">
          {((!isCollection && product?.salePrice && product.salePrice < product.price) ||
            (isCollection && (item as any).originalPrice > item.price)) ? (
            <>
              <span className="text-[22px] font-black text-[#FFB800] leading-none">
                {isCollection ? item.price : product?.salePrice} {t("common.egp")}
              </span>
              <span className="text-[11px] text-red-400/80 line-through decoration-2 font-bold">
                بدلاً من {isCollection ? (item as any).originalPrice : product?.price} ج.م
              </span>
            </>
          ) : (
            <span className="text-[22px] font-black text-[#FFB800] leading-none">
              {item.price > 0 ? (
                `${item.price} ${t("common.egp")}`
              ) : (
                <span className="uppercase text-sm tracking-[0.1em] text-primary">
                  {t("dashboard.products.free")}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      {...prefetchProps}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500",
        "hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(255,184,0,0.18)]",
        "border border-white/10 hover:border-[#FFB800]/40 gpu will-change-transform text-right cursor-pointer",
        "bg-[#0d0a07] w-full h-full"
      )}
      dir="rtl"
    >
      {locked ? (
        <div className="flex flex-col h-full cursor-default opacity-80 pointer-events-none">
          {inner}
        </div>
      ) : (
        <Link href={href} className="flex flex-col h-full">
          {inner}
        </Link>
      )}
    </motion.div>
  );
}
