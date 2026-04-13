import { useSiteSettings } from "@/hooks/use-site-settings";
import { Facebook, Instagram, Youtube, Mail, Phone, Send } from "lucide-react";

const Footer = () => {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "RG BAZZER";
  const hours = settings.support_hours || "9AM - 12PM";
  const waNum = settings.whatsapp_number || "";
  const tgLink = settings.telegram_link || "#";
  const fbLink = settings.facebook_link || "#";

  return (
    <footer className="bg-footer text-footer-foreground pb-16">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* STAY CONNECTED */}
        <h3 className="text-[20px] font-black text-footer-foreground mb-2">STAY CONNECTED</h3>
        <p className="text-[12px] text-footer-foreground/60 mb-4 leading-relaxed">
          কোনো সমস্যায় পড়লে হোয়াটসঅ্যাপ এ যোগাযোগ করবেন। তাহলে দ্রুত সমাধান পেয়ে যাবেন।
        </p>

        {/* Social Icons */}
        <div className="flex gap-3 mb-8">
          <a href={fbLink} className="w-12 h-12 rounded-xl bg-footer-foreground/10 flex items-center justify-center active:opacity-70">
            <Facebook className="w-5 h-5 text-footer-foreground" />
          </a>
          <a href="#" className="w-12 h-12 rounded-xl bg-footer-foreground/10 flex items-center justify-center active:opacity-70">
            <Instagram className="w-5 h-5 text-footer-foreground" />
          </a>
          <a href="#" className="w-12 h-12 rounded-xl bg-footer-foreground/10 flex items-center justify-center active:opacity-70">
            <Youtube className="w-5 h-5 text-footer-foreground" />
          </a>
          <a href="#" className="w-12 h-12 rounded-xl bg-footer-foreground/10 flex items-center justify-center active:opacity-70">
            <Mail className="w-5 h-5 text-footer-foreground" />
          </a>
        </div>

        {/* SUPPORT CENTER */}
        <h3 className="text-[20px] font-black text-footer-foreground mb-4">SUPPORT CENTER</h3>

        <div className="space-y-3 mb-6">
          {/* WhatsApp */}
          <a
            href={waNum ? `https://wa.me/${waNum.replace(/\D/g, "")}` : "#"}
            className="flex items-center gap-4 bg-footer-foreground/8 rounded-xl p-4 active:opacity-70"
          >
            <div className="w-10 h-10 rounded-full bg-[hsl(145,70%,40%)] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="border-l border-footer-foreground/20 pl-4">
              <p className="text-[12px] font-bold text-footer-foreground">Help line [{hours}]</p>
              <p className="text-[13px] text-footer-foreground/70">Whatsapp HelpLine</p>
            </div>
          </a>

          {/* Telegram */}
          <a
            href={tgLink}
            className="flex items-center gap-4 bg-footer-foreground/8 rounded-xl p-4 active:opacity-70"
          >
            <div className="w-10 h-10 rounded-full bg-[hsl(200,80%,50%)] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="border-l border-footer-foreground/20 pl-4">
              <p className="text-[12px] font-bold text-footer-foreground">Help line [{hours}]</p>
              <p className="text-[13px] text-footer-foreground/70">টেলিগ্রামে সাপোর্ট</p>
            </div>
          </a>
        </div>

        {/* Copyright */}
        <div className="border-t border-footer-foreground/10 pt-4 text-center">
          <p className="text-[12px] text-footer-foreground/50">
            © {siteName} 2026 | All Rights Reserved | Developed by
          </p>
          <p className="text-[14px] font-bold text-footer-foreground mt-0.5">Team Mahal</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
