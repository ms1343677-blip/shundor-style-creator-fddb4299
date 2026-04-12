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
      <section className="px-4 py-6 max-w-lg mx-auto text-center text-muted-foreground text-sm">
        কোনো প্রোডাক্ট নেই। অ্যাডমিন প্যানেল থেকে প্রোডাক্ট যোগ করুন।
      </section>
    );
  }

  // Group by category
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div>
      {categories.map((cat) => (
        <section key={cat} className="px-4 py-6 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center text-foreground mb-5">{cat}</h2>
          <div className="grid grid-cols-3 gap-3">
            {products
              .filter((p) => p.category === cat)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
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
      ))}
    </div>
  );
};

export default ProductGrid;
