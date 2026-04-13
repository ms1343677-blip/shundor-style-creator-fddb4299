import { X, AlertTriangle } from "lucide-react";
import { useState } from "react";

const NoticeBar = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-notice text-notice-foreground px-4 py-2.5 text-sm relative max-w-lg mx-auto">
      <button onClick={() => setVisible(false)} className="absolute top-2.5 right-3 active:scale-95">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-2 pr-6">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed font-medium">
          বাবা-মা বিকাশ থেকে টাকা চুরি করে কেউ অর্ডার করবেন না। ১৮ বছরের নিচে কেউ অর্ডার করবেন না। সমস্যায় WhatsApp 01858039475
        </p>
      </div>
    </div>
  );
};

export default NoticeBar;
