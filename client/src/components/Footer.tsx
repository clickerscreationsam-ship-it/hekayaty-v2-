import { Feather, Twitter, Instagram, Linkedin, Facebook } from "lucide-react";

export function Footer() {
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
              Empowering storytellers to build their worlds and share them with the universe.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Marketplace</a></li>
              <li><a href="#" className="hover:text-primary">Writer Studio</a></li>
              <li><a href="#" className="hover:text-primary">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Writers Guild</a></li>
              <li><a href="#" className="hover:text-primary">Events</a></li>
              <li><a href="#" className="hover:text-primary">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Follow Us</h4>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/1JgtgTtMiv/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground flex flex-col gap-2">
          <p>© {new Date().getFullYear()} Hekayaty Platform. All rights reserved.</p>
          <p className="font-medium text-primary/80">A Clickers Company Production</p>
        </div>
      </div>
    </footer>
  );
}
