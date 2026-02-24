import { Link } from "wouter";
import { User } from "@shared/schema";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useTranslation } from "react-i18next";

interface FeaturedWriterProps {
  writer: Omit<User, 'password' | 'createdAt'>;
}

export function FeaturedWriter({ writer }: FeaturedWriterProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative overflow-hidden rounded-2xl glass-card p-6 border border-primary/10"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full border-2 border-primary/20 p-1 mb-4">
          <img
            src={writer.avatarUrl || `https://ui-avatars.com/api/?name=${writer.displayName}&background=random`}
            alt={writer.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <h3 className="text-xl font-bold font-serif mb-1">{writer.displayName}</h3>
        <p className="text-sm text-primary mb-3">{t("marketplace.allGenres")}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
          {writer.bio || t("writerStore.noWorks")}
        </p>

        <Link href={`/writer/${writer.username}`} className="mt-auto w-full">
          <button className="w-full py-2 px-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-sm font-medium transition-all flex items-center justify-center gap-2 group">
            {t("writerStore.visitWorld")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
