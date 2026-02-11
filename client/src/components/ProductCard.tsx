import { Link } from "wouter";
import { Star, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
}

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const { t } = useTranslation();
  const isCompact = variant === "compact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative glass-card rounded-2xl overflow-hidden ${isCompact ? 'flex gap-4 p-3' : 'flex flex-col'}`}
    >
      <div className={`relative ${isCompact ? 'w-24 shrink-0' : 'aspect-[2/3] w-full'} overflow-hidden`}>
        {!isCompact && product.salePrice && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <span className="px-2 py-1 rounded-md bg-red-500 text-white text-xs font-bold shadow-lg">
              SALE
            </span>
          </div>
        )}
        <img
          src={product.coverUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {!isCompact && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <Link href={`/book/${product.id}`} className="w-full">
              <button className="w-full py-2 bg-primary text-white rounded-lg font-medium shadow-lg hover:bg-primary/90 active:scale-95 transition-all">
                View Details
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className={`flex flex-col ${isCompact ? 'justify-center py-1 flex-1' : 'p-5'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground text-xs font-semibold">
            {product.genre}
          </span>
          {product.isSerialized && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
              product.seriesStatus === 'ongoing' ? "bg-amber-500/20 text-amber-500 animate-pulse" : "bg-blue-500/20 text-blue-500"
            )}>
              {product.seriesStatus === 'ongoing' ? t("studio.market.ongoing", "Ongoing") : t("studio.market.completed", "Completed")}
            </span>
          )}
          {(product.rating || 0) > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium text-yellow-500">
              <Star className="w-3 h-3 fill-current" />
              {(product.rating || 0) / 10}
            </div>
          )}
        </div>

        <Link href={`/book/${product.id}`} className="block">
          <h3 className={`font-serif font-bold text-foreground group-hover:text-primary transition-colors ${isCompact ? 'text-lg' : 'text-xl mb-2'}`}>
            {product.title}
          </h3>
        </Link>

        {!isCompact && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {product.type === "promotional" ? (
              <span className="font-bold text-lg text-primary uppercase tracking-wider opacity-60">
                {t("dashboard.products.types.promotional")}
              </span>
            ) : product.salePrice ? (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  {product.price} EGP
                </span>
                <span className="font-bold text-lg text-red-500">
                  {product.salePrice} EGP
                </span>
              </>
            ) : (
              <span className="font-bold text-lg text-primary">
                {product.price} EGP
              </span>
            )}
          </div>
          {isCompact && product.type !== "promotional" && (
            <button className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
