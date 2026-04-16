import Header from "@/components/Header";
import NoticeBar from "@/components/NoticeBar";
import ProductGrid from "@/components/ProductGrid";
import LatestOrders from "@/components/LatestOrders";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import heroBanner from "@/assets/hero-banner.jpg";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useState, useEffect, useRef } from "react";

const Index = () => {
  useSiteSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: () => api.getBanners(),
  });

  const bannerList = Array.isArray(banners) ? banners : [];
  const slides = bannerList.length > 0 ? bannerList : null;

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [slides]);

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <NoticeBar />
      <div className="max-w-lg mx-auto mt-2 px-3">
        <div className="relative overflow-hidden">
          {slides ? (
            <>
              <div
                className="flex"
                style={{ transform: `translateX(-${currentSlide * 100}%)`, transition: "transform 0.3s ease-in-out" }}
              >
                {slides.map((b: any) => (
                  <a key={b.id} href={b.link_url || "#"} className="w-full shrink-0 block">
                    <img src={b.image_url} alt={b.title} className="w-full block" />
                  </a>
                ))}
              </div>
              {slides.length > 1 && (
                <div className="flex justify-center gap-1.5 py-2.5">
                  {slides.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`rounded-full ${i === currentSlide ? "w-5 h-1.5 bg-foreground" : "w-1.5 h-1.5 bg-muted-foreground/40"}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <img src={heroBanner} alt="Free Fire Diamond TopUp" width={1200} height={600} className="w-full block" />
          )}
        </div>
      </div>
      <ProductGrid />
      <LatestOrders />
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
