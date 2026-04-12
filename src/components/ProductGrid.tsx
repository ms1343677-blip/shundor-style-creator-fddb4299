import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ffTopup from "@/assets/ff-topup.jpg";
import unipinVoucher from "@/assets/unipin-voucher.jpg";
import weeklyPass from "@/assets/weekly-pass.jpg";
import levelPass from "@/assets/level-pass.jpg";
import evoAccess from "@/assets/evo-access.jpg";

const fallbackProducts = [
  { id: "1", name: "Free Fire TopUp (BD)", image_url: ffTopup },
  { id: "2", name: "Unipin Voucher (BD)", image_url: unipinVoucher },
  { id: "3", name: "Weekly & Monthly", image_url: weeklyPass },
  { id: "4", name: "Weekly Lite (BD Server)", image_url: levelPass },
  { id: "5", name: "E-Badge/Evo Access (BD)", image_url: evoAccess },
  { id: "6", name: "New Level Up Pass", image_url: levelPass },
];

const ProductGrid = () => {
  const navigate = useNavigate();

  const { data: dbProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const products = dbProducts && dbProducts.length > 0 ? dbProducts : fallbackProducts;

  return (
    <section className="px-4 py-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-center text-foreground mb-5">Free Fire</h2>
      <div className="grid grid-cols-3 gap-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              if (dbProducts && dbProducts.length > 0) {
                navigate(`/product/${p.id}`);
              }
            }}
            className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow group"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={p.image_url || ffTopup}
                alt={p.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-xs font-medium text-foreground px-2 py-2 text-center leading-tight">
              {p.name}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
