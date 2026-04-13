import { Facebook, Instagram, Youtube, Mail } from "lucide-react";

const Footer = () => (
  <footer className="bg-footer text-footer-foreground pb-20">
    <div className="max-w-lg mx-auto px-4 py-6">
      <p className="text-xs font-bold text-nav-foreground uppercase tracking-wider mb-3">Stay Connected</p>
      <div className="flex gap-2 mb-5">
        {[Facebook, Instagram, Youtube, Mail].map((Icon, i) => (
          <div key={i} className="w-9 h-9 bg-nav-foreground/10 rounded-lg flex items-center justify-center active:scale-95">
            <Icon className="w-4 h-4" />
          </div>
        ))}
      </div>

      <p className="text-xs font-bold text-nav-foreground uppercase tracking-wider mb-3">Support</p>
      <div className="space-y-2 mb-5">
        <div className="bg-nav-foreground/5 rounded-lg p-3 flex items-center gap-3 active:bg-nav-foreground/10">
          <div className="w-9 h-9 bg-success rounded-lg flex items-center justify-center text-success-foreground text-sm">💬</div>
          <div>
            <p className="text-[10px] text-footer-foreground/60">9AM - 12PM</p>
            <p className="text-sm font-medium text-nav-foreground">WhatsApp HelpLine</p>
          </div>
        </div>
        <div className="bg-nav-foreground/5 rounded-lg p-3 flex items-center gap-3 active:bg-nav-foreground/10">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-accent-foreground text-sm">✈️</div>
          <div>
            <p className="text-[10px] text-footer-foreground/60">9AM - 12PM</p>
            <p className="text-sm font-medium text-nav-foreground">Telegram Support</p>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-footer-foreground/40 pt-4 border-t border-footer-foreground/10">
        © RG BAZZER 2026 · All Rights Reserved
      </p>
    </div>
  </footer>
);

export default Footer;
