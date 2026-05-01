import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { BookOpen, Calendar, User, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Blog() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const BLOG_POSTS = [
    {
      id: 1,
      title: t("blog.posts.post1.title"),
      excerpt: t("blog.posts.post1.excerpt"),
      author: isArabic ? "فريق حكاياتي" : "Hekayaty Team",
      date: isArabic ? "١٥ أبريل، ٢٠٢٦" : "April 15, 2026",
      image: "https://images.unsplash.com/photo-1512820790803-73cad7a25571?auto=format&fit=crop&q=80",
      category: t("blog.posts.post1.category")
    },
    {
      id: 2,
      title: t("blog.posts.post2.title"),
      excerpt: t("blog.posts.post2.excerpt"),
      author: isArabic ? "سارة أحمد" : "Sarah Ahmed",
      date: isArabic ? "٢٠ أبريل، ٢٠٢٦" : "April 20, 2026",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80",
      category: t("blog.posts.post2.category")
    },
    {
      id: 3,
      title: t("blog.posts.post3.title"),
      excerpt: t("blog.posts.post3.excerpt"),
      author: isArabic ? "عمر خالد" : "Omar Khalid",
      date: isArabic ? "٢٥ أبريل، ٢٠٢٦" : "April 25, 2026",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80",
      category: t("blog.posts.post3.category")
    }
  ];

  return (
    <div className={`min-h-screen bg-black text-white ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <SEO 
        title={t("blog.title")} 
        description={t("blog.subtitle")}
      />
      <Navbar />

      <main className="pt-32 pb-20">
        <section className="container-responsive px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif font-black mb-6 text-balance"
          >
            {isArabic ? (
               <>
                 <span className="text-primary italic">أدلة</span> وقصص
               </>
            ) : (
              <>
                Stories & <span className="text-primary italic">Guides</span>
              </>
            )}
          </motion.h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            {t("blog.subtitle")}
          </p>
        </section>

        <section className="container-responsive px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {BLOG_POSTS.map((post, i) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-[32px] overflow-hidden hover:border-primary/50 transition-all"
            >
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-8 flex flex-col flex-1 space-y-4">
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary/80">
                   <span className="px-2 py-1 bg-primary/10 rounded">{post.category}</span>
                   <span>{post.date}</span>
                </div>
                <h2 className="text-2xl font-serif font-black leading-tight group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                      <User size={14} className="text-primary" />
                      <span>{post.author}</span>
                   </div>
                   <Button variant="ghost" className="p-0 h-auto gap-2 text-primary font-black uppercase tracking-tighter hover:bg-transparent hover:text-white">
                      {t("blog.readMore")} {isArabic ? <ChevronLeft size={16} /> : <ArrowRight size={16} />}
                   </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
