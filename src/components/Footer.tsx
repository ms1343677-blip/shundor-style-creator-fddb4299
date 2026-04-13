import { useSiteSettings } from "@/hooks/use-site-settings";

const Footer = () => {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "RG BAZZER";
  const hours = settings.support_hours || "9AM - 12PM";
  const waNum = settings.whatsapp_number || "";
  const tgLink = settings.telegram_link || "#";
  const fbLink = settings.facebook_link || "#";

  return (
    <footer className="bg-footer text-footer-foreground pb-16">
      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex gap-3 mb-4">
          <a href={waNum ? `https://wa.me/${waNum.replace(/\D/g, "")}` : "#"} className="flex-1 bg-nav-foreground/8 rounded-lg py-2.5 text-center text-[12px] font-semibold text-nav-foreground active:opacity-70">
            💬 WhatsApp
          </a>
          <a href={tgLink || "#"} className="flex-1 bg-nav-foreground/8 rounded-lg py-2.5 text-center text-[12px] font-semibold text-nav-foreground active:opacity-70">
            ✈️ Telegram
          </a>
          <a href={fbLink || "#"} className="flex-1 bg-nav-foreground/8 rounded-lg py-2.5 text-center text-[12px] font-semibold text-nav-foreground active:opacity-70">
            📘 Facebook
          </a>
        </div>
        <p className="text-[11px] text-center text-footer-foreground/50 mb-1">{hours}</p>
        <p className="text-center text-[10px] text-footer-foreground/40 border-t border-footer-foreground/10 pt-3">
          © 2026 {siteName} · All Rights Reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
