import ffTopup from "@/assets/ff-topup.jpg";
import unipinVoucher from "@/assets/unipin-voucher.jpg";
import weeklyPass from "@/assets/weekly-pass.jpg";
import levelPass from "@/assets/level-pass.jpg";
import evoAccess from "@/assets/evo-access.jpg";

const products = [
  { name: "Free Fire TopUp (BD)", image: ffTopup },
  { name: "Unipin Voucher (BD)", image: unipinVoucher },
  { name: "Weekly & Monthly", image: weeklyPass },
  { name: "Weekly Lite (BD Server)", image: levelPass },
  { name: "E-Badge/Evo Access (BD)", image: evoAccess },
  { name: "New Level Up Pass", image: levelPass },
];

const ProductGrid = () => (
  <section className="px-4 py-6 max-w-lg mx-auto">
    <h2 className="text-xl font-bold text-center text-foreground mb-5">Free Fire</h2>
    <div className="grid grid-cols-3 gap-3">
      {products.map((p) => (
        <button
          key={p.name}
          className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow group"
        >
          <div className="aspect-square overflow-hidden">
            <img
              src={p.image}
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

export default ProductGrid;
