import { X, AlertTriangle } from "lucide-react";
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
      <div className="flex items-center gap-2 px-3 py-2 relative">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p className="text-[11px] leading-snug font-semibold flex-1 pr-5">{text}</p>
        <button onClick={() => setVisible(false)} className="absolute right-2 top-2 active:opacity-60">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NoticeBar;
