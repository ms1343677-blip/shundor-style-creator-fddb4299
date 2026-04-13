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
      <section className="px-4 py-8 max-w-lg mx-auto text-center text-muted-foreground text-sm">
        কোনো প্রোডাক্ট নেই। অ্যাডমিন প্যানেল থেকে প্রোডাক্ট যোগ করুন।
      </section>
    );
  }

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div>
      {categories.map((cat) => (
        <section key={cat} className="px-4 py-5 max-w-lg mx-auto">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            {cat}
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {products
              .filter((p) => p.category === cat)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-card rounded-xl overflow-hidden border border-border active:scale-[0.97] active:bg-muted"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={p.image_url || ffTopup}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-foreground px-2 py-2 text-center leading-tight line-clamp-2">
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
