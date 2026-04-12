import { X } from "lucide-react";
import { useState } from "react";

const NoticeBar = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-notice text-notice-foreground px-4 py-3 text-sm relative">
      <button onClick={() => setVisible(false)} className="absolute top-2 right-2">
        <X className="w-5 h-5" />
      </button>
      <p className="font-bold mb-1">Notice:</p>
      <p className="text-xs leading-relaxed">
        বাবা-মা বিকাশ থেকে টাকা চুরি করে কেউ অর্ডার করবেন না অর্ডার করলে কোন প্রকার ডাইমন্ড পাবেন না ,,
        ১৮ বছরের নিচে কেউ অর্ডার করবেন না। যে কোন সমস্যায় WhatsApp 01858039475
      </p>
    </div>
  );
};

export default NoticeBar;
