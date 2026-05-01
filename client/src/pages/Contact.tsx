import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Mail, MessageSquare, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div className={`min-h-screen bg-black text-white ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <SEO 
        title={t("contact.title")} 
        description={t("contact.subtitle")}
      />
      <Navbar />

      <main className="pt-32 pb-20">
        <section className="container-responsive px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-serif font-black mb-6"
            >
              {isArabic ? (
                 <>
                   تواصل <span className="text-primary italic">معنا</span>
                 </>
              ) : (
                <>
                  Get in <span className="text-primary italic">Touch</span>
                </>
              )}
            </motion.h1>
            <p className="text-xl text-white/60">
              {t("contact.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 mb-20">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <Mail className="text-primary" />
              </div>
              <h3 className="font-bold">{t("contact.email")}</h3>
              <p className="text-white/50 text-sm">hello@hekayaty.com</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <MessageSquare className="text-primary" />
              </div>
              <h3 className="font-bold">{t("contact.chat")}</h3>
              <p className="text-white/50 text-sm">{t("contact.chatDesc")}</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <MapPin className="text-primary" />
              </div>
              <h3 className="font-bold">{t("contact.location")}</h3>
              <p className="text-white/50 text-sm">{t("contact.locationDesc")}</p>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 md:p-16">
             <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className={`text-xs font-black uppercase tracking-widest text-white/40 ${isArabic ? 'mr-2' : 'ml-2'}`}>{t("contact.formName")}</label>
                      <Input className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-primary/50" placeholder="John Doe" />
                   </div>
                   <div className="space-y-2">
                      <label className={`text-xs font-black uppercase tracking-widest text-white/40 ${isArabic ? 'mr-2' : 'ml-2'}`}>{t("contact.formEmail")}</label>
                      <Input className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-primary/50" placeholder="john@example.com" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={`text-xs font-black uppercase tracking-widest text-white/40 ${isArabic ? 'mr-2' : 'ml-2'}`}>{t("contact.formMessage")}</label>
                   <Textarea className="min-h-[200px] bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 p-6" placeholder={t("contact.formPlaceholder")} />
                </div>
                <Button className="w-full h-16 bg-primary text-black font-black uppercase tracking-widest rounded-2xl text-lg hover:scale-[1.02] transition-transform flex gap-3">
                   <Send size={20} />
                   {t("contact.send")}
                </Button>
             </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
