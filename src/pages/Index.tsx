import Header from "@/components/Header";
import NoticeBar from "@/components/NoticeBar";
import ProductGrid from "@/components/ProductGrid";
import LatestOrders from "@/components/LatestOrders";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import heroBanner from "@/assets/hero-banner.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";

const Index = () => {
  // Load settings to apply theme
  useSiteSettings();

  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <NoticeBar />
      <div className="max-w-lg mx-auto">
        {banners && banners.length > 0 ? (
          <div className="overflow-x-auto flex snap-x snap-mandatory scrollbar-hide">
            {banners.map((b: any) => (
              <a key={b.id} href={b.link_url || "#"} className="w-full shrink-0 snap-center">
                <img src={b.image_url} alt={b.title} className="w-full" />
              </a>
            ))}
          </div>
        ) : (
          <img src={heroBanner} alt="Free Fire Diamond TopUp" width={1200} height={600} className="w-full" />
        )}
      </div>
      <ProductGrid />
      <LatestOrders />
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
