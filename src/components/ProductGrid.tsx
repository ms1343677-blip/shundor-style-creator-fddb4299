import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ffTopup from "@/assets/ff-topup.jpg";

const ProductGrid = () => {
  const navigate = useNavigate();

  const { data: products } = useQuery({
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

  if (!products || products.length === 0) {
    return (
      <section className="px-3 py-6 max-w-lg mx-auto text-center text-muted-foreground text-sm">
        কোনো প্রোডাক্ট নেই।
      </section>
    );
  }

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="max-w-lg mx-auto">
      {categories.map((cat) => (
        <section key={cat} className="px-3 pt-5 pb-2">
          <h2 className="text-center text-[17px] font-black text-foreground mb-4">{cat}</h2>
          <div className="grid grid-cols-3 gap-3">
            {products
              .filter((p) => p.category === cat)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-card rounded-2xl overflow-hidden border border-border active:scale-[0.97] text-left"
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={p.image_url || ffTopup}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-2 py-2.5">
                    <p className="text-[11px] font-bold text-foreground text-center leading-tight line-clamp-2">
                      {p.name}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductGrid;
