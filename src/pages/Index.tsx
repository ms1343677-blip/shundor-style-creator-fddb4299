import Header from "@/components/Header";
import NoticeBar from "@/components/NoticeBar";
import ProductGrid from "@/components/ProductGrid";
import LatestOrders from "@/components/LatestOrders";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => (
  <div className="min-h-screen bg-background pb-16">
    <Header />
    <NoticeBar />
    <div className="max-w-lg mx-auto">
      <img src={heroBanner} alt="Free Fire Diamond TopUp" width={1200} height={600} className="w-full" />
    </div>
    <ProductGrid />
    <LatestOrders />
    <Footer />
    <BottomNav />
  </div>
);

export default Index;
