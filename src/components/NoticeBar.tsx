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
    <div className="bg-primary text-primary-foreground max-w-lg mx-auto">
      <div className="relative px-4 py-3">
        <p className="text-[15px] font-black mb-1.5">Notice:</p>
        <p className="text-[13px] leading-relaxed font-medium pr-8">{text}</p>
        <button onClick={() => setVisible(false)} className="absolute right-3 top-3 active:opacity-60">
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default NoticeBar;
