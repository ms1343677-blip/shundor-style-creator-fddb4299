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
          <h2 className="text-center text-[20px] font-black text-primary mb-4">{cat}</h2>
          <div className="grid grid-cols-3 gap-x-3 gap-y-4">
            {products
              .filter((p) => p.category === cat)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="flex flex-col items-center active:scale-[0.97] text-center"
                >
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.25)] bg-card">
                    <img
                      src={p.image_url || ffTopup}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[12px] font-bold text-foreground mt-2 leading-tight line-clamp-2 px-1">
                    {p.name}
                  </p>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductGrid;
