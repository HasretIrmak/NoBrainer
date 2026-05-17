"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/shop/ProductCard";
import { fetchProducts } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { sortProductsForProfile } from "../../lib/personalization";
import { getProductStoreId, useSellerProducts } from "../../lib/sellerStore";
import type { Product } from "../../lib/types";
import { useCommerceStore } from "../../lib/userStore";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("all");
  const [sellerStore, setSellerStore] = useState("all");
  const [brand, setBrand] = useState("all");
  const [style, setStyle] = useState("all");
  const [maxPrice, setMaxPrice] = useState(0);
  const { profile, favorites, toggleFavorite, addToCart } = useCommerceStore();
  const { accounts, isSeller } = useAuthStore();
  const { products: uploadedProducts } = useSellerProducts();

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Ürünler alınamadı."))
      .finally(() => setLoading(false));
  }, []);

  const sellers = accounts.filter((account) => account.role === "seller");
  const stores = sellers.flatMap((seller) => seller.stores);
  const allProducts = [...products, ...uploadedProducts];
  const brands = Array.from(new Set(allProducts.map((product) => product.brand))).sort();
  const styles = Array.from(new Set(allProducts.flatMap((product) => product.tags))).sort();
  const maxAvailablePrice = Math.max(1000, ...allProducts.map((product) => Math.ceil(product.price / 250) * 250));
  const effectiveMaxPrice = maxPrice || maxAvailablePrice;

  const filteredProducts = allProducts.filter((product) => {
    const productStore = getProductStoreId(product, stores);
    const storeName = stores.find((store) => store.id === productStore)?.name || "";
    const searchable = `${product.title} ${product.brand} ${product.description} ${product.tags.join(" ")} ${product.gender} ${storeName}`.toLowerCase();
    const matchesQuery = !query || searchable.includes(query.toLowerCase());
    const matchesGender = gender === "all" || product.gender === gender || product.gender === "Unisex";
    const matchesStore = sellerStore === "all" || productStore === sellerStore;
    const matchesBrand = brand === "all" || product.brand === brand;
    const matchesStyle = style === "all" || product.tags.includes(style);
    const matchesPrice = product.price <= effectiveMaxPrice;
    return matchesQuery && matchesGender && matchesStore && matchesBrand && matchesStyle && matchesPrice;
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8 dark:bg-gray-950 md:p-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Akıllı Mağaza</h1>
            <p className="mt-3 max-w-2xl text-gray-500 dark:text-gray-400">
              {profile.name} için {profile.persona} personasına, cinsiyet seçimine, kupon hassasiyetine ve filtrelerine göre sıralanmış vitrin.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
            {filteredProducts.length} ürün
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900 md:grid-cols-3 lg:grid-cols-6">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün, marka veya yorum sinyali ara"
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold outline-none dark:border-gray-700 dark:bg-gray-950 md:col-span-3 lg:col-span-2"
          />
          <select value={gender} onChange={(event) => setGender(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950">
            <option value="all">Kadın / erkek / çocuk</option>
            <option value="Women">Kadın</option>
            <option value="Men">Erkek</option>
            <option value="Kids">Çocuk</option>
            <option value="Unisex">Unisex</option>
          </select>
          <select value={sellerStore} onChange={(event) => setSellerStore(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950">
            <option value="all">Tüm satıcı mağazaları</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
          <select value={brand} onChange={(event) => setBrand(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950">
            <option value="all">Tüm markalar</option>
            {brands.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={style} onChange={(event) => setStyle(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950">
            <option value="all">Tüm tarzlar</option>
            {styles.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <label className="rounded-xl border border-gray-200 px-4 py-3 text-xs font-black text-gray-500 dark:border-gray-700 dark:text-gray-300">
            Maks. fiyat: {effectiveMaxPrice} TL
            <input type="range" min="500" max={maxAvailablePrice} step="250" value={effectiveMaxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="mt-2 w-full" />
          </label>
        </div>

        {loading && <div className="rounded-2xl bg-white p-8 font-bold text-gray-500 dark:bg-gray-900">Ürünler yükleniyor...</div>}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
            Backend bağlantısı kurulamadı: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {sortProductsForProfile(filteredProducts, profile).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                profile={profile}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
                showActions={!isSeller}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
