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
    <div className="bg-notice text-notice-foreground max-w-lg mx-auto">
      <div className="flex items-start gap-2 px-3 py-2.5 relative">
        <span className="text-[13px] font-bold shrink-0">Notice:</span>
        <p className="text-[11px] leading-relaxed font-medium flex-1 pr-5">{text}</p>
        <button onClick={() => setVisible(false)} className="absolute right-2.5 top-2.5 active:opacity-60">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NoticeBar;
