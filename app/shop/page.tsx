"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/shop/ProductCard";
import { fetchProducts } from "../../lib/api";
import type { Product } from "../../lib/types";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Urunler alinamadi."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 md:p-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900">Sneaker Store</h1>
            <p className="mt-3 max-w-2xl text-gray-500">
              FastAPI backendinden gelen urun verileriyle calisan adaptif alisveris vitrini.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-gray-600 shadow-sm">
            {products.length} urun
          </div>
        </div>

        {loading && <div className="rounded-2xl bg-white p-8 font-bold text-gray-500">Urunler yukleniyor...</div>}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
            Backend baglantisi kurulamadi: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
