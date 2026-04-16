import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import ffTopup from "@/assets/ff-topup.jpg";
import { useState } from "react";

const ProductGrid = () => {
  const navigate = useNavigate();
  const [pressedId, setPressedId] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
  });

  if (!products || products.length === 0) {
    return (
      <section className="px-3 py-6 max-w-lg mx-auto text-center text-muted-foreground text-sm">
        কোনো প্রোডাক্ট নেই।
      </section>
    );
  }

  const getCategoryName = (product: any) => {
    if (product.category_id && categories) {
      const cat = categories.find((c: any) => c.id === product.category_id);
      if (cat) return cat.name;
    }
    return product.category || "Other";
  };

  const categoryNames: string[] = [...new Set(products.map((p: any) => getCategoryName(p)))] as string[];

  const handleClick = (id: string) => {
    setPressedId(id);
    setTimeout(() => { navigate(`/product/${id}`); }, 200);
  };

  return (
    <div className="max-w-lg mx-auto">
      {categoryNames.map((cat) => (
        <section key={cat} className="px-3 pt-5 pb-2">
          <h2 className="text-center text-[18px] font-black text-primary mb-3">{cat}</h2>
          <div className="grid grid-cols-3 gap-x-2 gap-y-3">
            {products
              .filter((p: any) => getCategoryName(p) === cat)
              .map((p: any) => (
                <button key={p.id} onClick={() => handleClick(p.id)} className="flex flex-col items-center text-center">
                  <div className={`w-[90%] aspect-square rounded-xl overflow-hidden bg-card transition-transform duration-200 ${pressedId === p.id ? "scale-90" : "scale-100"}`}>
                    <img src={p.image_url || ffTopup} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[11px] font-bold text-foreground mt-1.5 leading-tight line-clamp-2 px-0.5">{p.name}</p>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductGrid;
