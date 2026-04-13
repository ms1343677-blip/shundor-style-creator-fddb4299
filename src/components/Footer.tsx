const Footer = () => (
  <footer className="bg-footer text-footer-foreground pb-16">
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex gap-3 mb-4">
        <a href="#" className="flex-1 bg-nav-foreground/8 rounded-lg py-2.5 text-center text-[12px] font-semibold text-nav-foreground active:opacity-70">
          💬 WhatsApp
        </a>
        <a href="#" className="flex-1 bg-nav-foreground/8 rounded-lg py-2.5 text-center text-[12px] font-semibold text-nav-foreground active:opacity-70">
          ✈️ Telegram
        </a>
        <a href="#" className="flex-1 bg-nav-foreground/8 rounded-lg py-2.5 text-center text-[12px] font-semibold text-nav-foreground active:opacity-70">
          📘 Facebook
        </a>
      </div>
      <p className="text-center text-[10px] text-footer-foreground/40 border-t border-footer-foreground/10 pt-3">
        © 2026 RG BAZZER · All Rights Reserved
      </p>
    </div>
  </footer>
);

export default Footer;
