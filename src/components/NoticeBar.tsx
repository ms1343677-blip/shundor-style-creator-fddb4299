import { X } from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";

const NoticeBar = () => {
  const [visible, setVisible] = useState(true);
  const { settings } = useSiteSettings();

  if (!visible) return null;
  if (settings.notice_enabled === "false") return null;

  const text = settings.notice_text || "১৮ বছরের নিচে অর্ডার করবেন না।";

  return (
    <div className="max-w-lg mx-auto px-3">
      <div className="bg-primary text-primary-foreground relative px-4 py-3">
        <p className="text-[15px] font-black mb-1.5">Notice:</p>
        <p className="text-[13px] leading-relaxed font-medium pr-8">{text}</p>
        <button onClick={() => setVisible(false)} className="absolute right-3 top-3 w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center active:opacity-60">
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default NoticeBar;
