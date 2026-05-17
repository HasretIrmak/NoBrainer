"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "../../components/shop/ProductCard";
import { fetchProducts } from "../../lib/api";
import { useSellerProducts } from "../../lib/sellerStore";
import type { Product } from "../../lib/types";
import { useCommerceStore } from "../../lib/userStore";

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, profile, toggleFavorite, addToCart } = useCommerceStore();
  const { products: uploadedProducts } = useSellerProducts();

  useEffect(() => {
    fetchProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const favoriteProducts = useMemo(() => {
    const allProducts = [...products, ...uploadedProducts];
    return allProducts.filter((product) => favorites.includes(product.id));
  }, [favorites, products, uploadedProducts]);

  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-3 text-4xl font-black uppercase tracking-tight text-gray-900">Favorilerim</h1>
        <p className="mb-10 text-gray-500">Beğendiğin ürünleri persona ve kupon sinyalleriyle tekrar karşılaştır.</p>

        {loading && <div className="rounded-2xl bg-white p-8 font-bold text-gray-500">Favoriler yükleniyor...</div>}

        {!loading && !favoriteProducts.length && (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-gray-500">
            Henüz favori ürün yok. Mağazadan ürünleri favoriye ekleyebilirsin.
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              profile={profile}
              isFavorite
              onToggleFavorite={toggleFavorite}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
