import { Facebook, Instagram, Youtube, Mail } from "lucide-react";

const Footer = () => (
  <footer className="bg-footer text-footer-foreground pb-20">
    <div className="max-w-lg mx-auto px-4 py-8">
      <h3 className="text-lg font-bold text-card mb-2">STAY CONNECTED</h3>
      <p className="text-xs mb-4 leading-relaxed">
        কোন সমস্যায় পড়লে হোয়াটসঅ্যাপ এ যোগাযোগ করবেন। তাহলে দ্রুত সমাধান পেয়ে যাবেন।
      </p>
      <div className="flex gap-3 mb-6">
        {[Facebook, Instagram, Youtube, Mail].map((Icon, i) => (
          <div key={i} className="w-10 h-10 border border-footer-foreground/30 rounded-lg flex items-center justify-center hover:bg-card/10 transition-colors cursor-pointer">
            <Icon className="w-5 h-5" />
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold text-card mb-3">SUPPORT CENTER</h3>
      <div className="space-y-3 mb-6">
        <div className="border border-footer-foreground/20 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-success-foreground text-lg">💬</div>
          <div>
            <p className="text-xs text-footer-foreground">Help line [9AM-12PM]</p>
            <p className="text-sm font-medium text-card">Whatsapp HelpLine</p>
          </div>
        </div>
        <div className="border border-footer-foreground/20 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-success-foreground text-lg">✈️</div>
          <div>
            <p className="text-xs text-footer-foreground">Help line [9AM-12PM]</p>
            <p className="text-sm font-medium text-card">টেলিগ্রামে সাপোর্ট</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-footer-foreground/60 pt-4 border-t border-footer-foreground/10">
        © RG BAZZER 2026 | All Rights Reserved | Developed by <span className="text-card font-medium">Team Mahal</span>
      </p>
    </div>
  </footer>
);

export default Footer;
