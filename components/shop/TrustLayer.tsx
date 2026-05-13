import type { Product, ReturnRiskResult } from "../../lib/types";

export default function TrustLayer({
  product,
  risk,
}: {
  product: Product;
  risk: ReturnRiskResult | null;
}) {
  const returnRate = Math.round(product.sales_signals.return_rate * 100);

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-gray-50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Puan</h4>
        <p className="mt-1 text-lg font-black text-gray-900">
          {product.rating.toFixed(1)} / {product.review_count} yorum
        </p>
      </div>
      <div className="rounded-2xl bg-gray-50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Iade orani</h4>
        <p className="mt-1 text-lg font-black text-gray-900">%{returnRate}</p>
      </div>
      <div className="rounded-2xl bg-gray-50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Fit sinyali</h4>
        <p className="mt-1 text-lg font-black text-gray-900">{risk?.risk_level || product.fit_type}</p>
      </div>
    </div>
  );
}
