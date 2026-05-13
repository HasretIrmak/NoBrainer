import Link from "next/link";
import type { Product } from "../../lib/types";

function formatPrice(product: Product) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: product.currency || "TRY",
    maximumFractionDigits: 0,
  }).format(product.price);
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/${product.id}`}
      className="group block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-gray-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-gray-400">
            Image missing
          </div>
        )}
      </div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
          {product.brand}
        </span>
        <span className="text-sm font-bold text-amber-600">{product.rating.toFixed(1)}</span>
      </div>
      <h3 className="line-clamp-2 min-h-12 font-bold leading-snug text-gray-900">{product.title}</h3>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-black text-blue-600">{formatPrice(product)}</span>
        <span className="text-xs font-bold text-gray-500">Incele</span>
      </div>
    </Link>
  );
}
