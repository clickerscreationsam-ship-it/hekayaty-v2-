import { Feather, Facebook, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export function Footer() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <footer className="bg-card/50 border-t border-border mt-20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Feather className="w-6 h-6 text-primary" />
              <span className="font-serif text-xl font-bold">Hekayaty</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.aboutText", "Empowering storytellers to build their worlds and share them with the universe.")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t("footer.quickLinks", "Platform")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/marketplace" className="hover:text-primary">{t("nav.marketplace", "Marketplace")}</Link></li>
              <li><Link href="/studio" className="hover:text-primary">{t("nav.studio", "Writer Studio")}</Link></li>
              <li><Link href="/worldbuilders" className="hover:text-primary">{t("nav.worldbuilders", "Worldbuilders")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t("footer.legal", "Legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal" className="hover:text-primary">{t("footer.terms", "Terms of Service")}</Link></li>
              <li><Link href="/legal" className="hover:text-primary">{t("footer.privacy", "Privacy Policy")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t("footer.followUs", "Follow Us")}</h4>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/share/1JgtgTtMiv/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/hekayaty_ma?igsh=MWRmZ2R2bHQyM256cA=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@hekayaty0?_r=1&_t=ZS-93mDnETkKUK"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground flex flex-col gap-2">
          <p>© {new Date().getFullYear()} Hekayaty Platform. {t("footer.copyright", "All rights reserved.")}</p>
          <p className="font-medium text-primary/80">{t("auth.welcome.production", "A Clickers Company Production")}</p>
        </div>
      </div>
    </footer>
  );
}
