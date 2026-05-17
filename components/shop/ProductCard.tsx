import Link from "next/link";
import { getCoupon, getMatchReason, scoreProductForProfile } from "../../lib/personalization";
import type { Product, UserProfile } from "../../lib/types";

function formatPrice(product: Product) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: product.currency || "TRY",
    maximumFractionDigits: 0,
  }).format(product.price);
}

export default function ProductCard({
  product,
  profile,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  showActions = true,
}: {
  product: Product;
  profile?: UserProfile | null;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  showActions?: boolean;
}) {
  const coupon = getCoupon(product, profile);
  const matchScore = scoreProductForProfile(product, profile || null);

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <Link href={`/shop/${product.id}`} className="block">
        <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-950">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold text-gray-400">
              Görsel yok
            </div>
          )}
        </div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            {product.brand}
          </span>
          <span className="text-sm font-bold text-amber-600">{product.rating.toFixed(1)}</span>
        </div>
        <h3 className="line-clamp-2 min-h-12 font-bold leading-snug text-gray-900 dark:text-white">{product.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
          {getMatchReason(product, profile || null)}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="font-black text-blue-600">{formatPrice(product)}</span>
            {coupon.eligible && (
              <p className="text-xs font-black text-green-600">{coupon.label} ile {coupon.finalPrice} TL</p>
            )}
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            %{matchScore}
          </span>
        </div>
      </Link>
      {showActions && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite?.(product.id)}
            className={`rounded-xl border px-3 py-2 text-xs font-black ${
              isFavorite ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            {isFavorite ? "Favoride" : "Favori"}
          </button>
          <button
            type="button"
            onClick={() => onAddToCart?.(product.id)}
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            Sepete ekle
          </button>
        </div>
      )}
    </div>
  );
}
