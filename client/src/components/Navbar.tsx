import { Link, useLocation } from "wouter";
import { Feather, BookOpen, ShoppingBag, LayoutDashboard, User, Palette, Store, Users, ShieldCheck, Menu, X, PenTool, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OrderNotificationDrawer } from "./OrderNotificationDrawer";
import { useState } from "react";
import { useAdminPrivateMessages } from "@/hooks/use-admin-system";

export function Navbar({ hideNav }: { hideNav?: boolean } = {}) {
  if (hideNav) return null;
  const [location] = useLocation();
  const { data: cartItems } = useCart();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const cartCount = cartItems?.length || 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: adminMessages } = useAdminPrivateMessages();
  const unreadMessagesCount = adminMessages?.filter(m => !m.isRead && m.receiverId === user?.id).length || 0;

  const navItems = [
    { label: t("nav.marketplace"), href: "/marketplace", icon: ShoppingBag },
    { label: t("nav.assets"), href: "/assets", icon: Palette },
    { label: t("nav.worldbuilders"), href: "/worldbuilders", icon: Users },
    { label: t("nav.guide"), href: "/guide", icon: HelpCircle },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: t("nav.admin"), href: "/admin", icon: ShieldCheck });
  }

  if (user?.role === 'writer' || user?.role === 'artist') {
    navItems.push({ label: t("nav.studio"), href: "/studio", icon: PenTool });
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#1a0f0a]/90 backdrop-blur-md border-b border-white/10 shadow-lg safe-area-padding-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group touch-target" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Feather className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              {t("welcome").split(' ').slice(-1)[0]}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 text-sm font-medium transition-colors duration-200 touch-target
                    ${isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                  {(item.href === '/studio' || item.href === '/admin') && unreadMessagesCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold shadow-lg shadow-primary/20 animate-pulse">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />

            {user && <OrderNotificationDrawer />}

            {user && (user.role === 'writer' || user.role === 'artist' || user.role === 'admin') && (
              <Link href={user.role === 'admin' ? "/admin" : "/dashboard?tab=admin_messages"}>
                <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary transition-colors touch-target">
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary transition-colors touch-target">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <>
                {(user.role === "writer" || user.role === "artist") && (
                  <Link href={`/writer/${user.username}`} className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="gap-3 text-primary hover:text-primary/80 touch-target">
                      <Store className="w-4 h-4" />
                      <span className="hidden lg:inline">{t("nav.myStore")}</span>
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="touch-target">
                    {user.role === "writer" || user.role === "artist" ? t("nav.dashboard") : t("nav.profile")}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex touch-target"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {t("nav.logout")}
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="touch-target">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/auth" className="hidden sm:block">
                  <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 touch-target">
                    {t("nav.getStarted")}
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden touch-target no-select"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-in slide-in-from-top">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      mobile-menu-item flex items-center gap-3 rounded-lg
                      ${isActive ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground"}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {(item.href === '/studio' || item.href === '/admin') && unreadMessagesCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Mobile User Actions */}
              {user ? (
                <>
                  {(user.role === "writer" || user.role === "artist") && (
                    <Link
                      href={`/writer/${user.username}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-menu-item flex items-center gap-3 rounded-lg text-primary"
                    >
                      <Store className="w-5 h-5" />
                      {t("nav.myStore")}
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mobile-menu-item flex items-center gap-3 rounded-lg"
                  >
                    <User className="w-5 h-5" />
                    {user.role === "writer" || user.role === "artist" ? t("nav.dashboard") : t("nav.profile")}
                  </Link>
                  <button
                    onClick={() => {
                      logoutMutation.mutate();
                      setMobileMenuOpen(false);
                    }}
                    className="mobile-menu-item flex items-center gap-3 rounded-lg text-left text-red-400"
                  >
                    <X className="w-5 h-5" />
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mobile-menu-item flex items-center gap-3 rounded-lg"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white touch-target">
                      {t("nav.getStarted")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
