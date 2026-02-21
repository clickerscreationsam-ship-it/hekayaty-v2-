import { Link } from "wouter";
import { Star, ShoppingCart, LayoutGrid, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product?: Product;
  collection?: any;
  variant?: "default" | "compact";
}

export function ProductCard({ product, collection, variant = "default" }: ProductCardProps) {
  const { t } = useTranslation();
  const isCompact = variant === "compact";
  const item = product || (collection ? {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    coverUrl: collection.cover_image_url,
    price: collection.price,
    isCollection: true,
    discount: collection.discount_percentage,
    storiesCount: collection.items?.length || 0,
    genre: t("home.collections.badge")
  } : null);

  if (!item) return null;

  const isCollection = (item as any).isCollection;
  const href = isCollection ? `/collection/${item.id}` : `/book/${item.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "group relative glass-card rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5",
        isCompact ? 'flex gap-4 p-3' : 'flex flex-col',
        isCollection && !isCompact && "border-secondary/20 bg-secondary/[0.02]"
      )}
    >
      <div className={cn(
        "relative overflow-hidden",
        isCompact ? 'w-24 shrink-0' : 'aspect-[2/3] w-full'
      )}>
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {isCollection && (
            <span className="px-2 py-1 rounded-md bg-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
              <LayoutGrid className="w-3 h-3" />
              {t("home.collections.badge")}
            </span>
          )}
          {(item as any).discount > 0 && (
            <span className="px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-black shadow-lg">
              -{(item as any).discount}%
            </span>
          )}
          {product?.type === 'merchandise' && (
            <span className="px-2 py-1 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t("dashboard.products.types.merchandise")}
            </span>
          )}
        </div>

        <img
          src={item.coverUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {!isCompact && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <Link href={href} className="w-full">
              <button className={cn(
                "w-full py-2 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wider",
                isCollection ? "bg-secondary hover:bg-secondary/90" : "bg-primary hover:bg-primary/90"
              )}>
                {isCollection ? t("home.collections.viewBundle") : "View Details"}
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className={cn(
        "flex flex-col flex-1",
        isCompact ? 'justify-center py-1' : 'p-5'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
            isCollection ? "bg-secondary/20 text-secondary" : "bg-primary/10 text-primary"
          )}>
            {item.genre}
          </span>
          {product?.type === 'merchandise' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-tight">
              {product.merchandiseCategory || t("dashboard.products.types.merchandise")}
            </span>
          )}
          {product?.isSerialized && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
              product.seriesStatus === 'ongoing' ? "bg-amber-500/20 text-amber-500 animate-pulse" : "bg-blue-500/20 text-blue-500"
            )}>
              {product.seriesStatus === 'ongoing' ? t("studio.market.ongoing") : t("studio.market.completed")}
            </span>
          )}
          {isCollection && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground text-[10px] font-bold">
              {(item as any).storiesCount} {t("home.collections.storiesCount")}
            </span>
          )}
          {product?.rating ? (
            <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 text-[10px]">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{(product.rating / 10).toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        <Link href={href} className="block">
          <h3 className={cn(
            "font-serif font-bold text-foreground transition-colors line-clamp-1",
            isCompact ? 'text-lg' : 'text-xl mb-2',
            isCollection ? "group-hover:text-secondary" : "group-hover:text-primary"
          )}>
            {item.title}
          </h3>
        </Link>

        {!isCompact && (
          <p className="text-muted-foreground text-xs line-clamp-2 mb-4 flex-grow opacity-60">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {isCollection ? (
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-secondary">
                  {item.price > 0 ? (
                    `${item.price} ${t("common.egp")}`
                  ) : (
                    <span className="text-secondary uppercase tracking-wider">{t("dashboard.products.free")}</span>
                  )}
                </span>
              </div>
            ) : product?.type === "promotional" ? (
              <span className="font-bold text-sm text-primary uppercase tracking-widest opacity-60">
                {t("dashboard.products.types.promotional")}
              </span>
            ) : (
              <span className="font-black text-xl text-primary">
                {item.price > 0 ? (
                  `${item.price} ${t("common.egp")}`
                ) : (
                  <span className="text-primary uppercase tracking-wider">{t("dashboard.products.free")}</span>
                )}
              </span>
            )}
          </div>
          {isCompact && !isCollection && (
            <button className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div >
  );
}
