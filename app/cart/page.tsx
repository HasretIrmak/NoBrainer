"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../../lib/api";
import { getCoupon } from "../../lib/personalization";
import { useSellerProducts } from "../../lib/sellerStore";
import type { Product } from "../../lib/types";
import { useCommerceStore } from "../../lib/userStore";

export default function CartPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderMessage, setOrderMessage] = useState("");
  const { cart, profile, updateCartQuantity, removeFromCart, clearCart } = useCommerceStore();
  const { products: uploadedProducts } = useSellerProducts();

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  const allProducts = [...products, ...uploadedProducts];
  const rows = useMemo(
    () =>
      cart
        .map((item) => {
          const product = allProducts.find((candidate) => candidate.id === item.product_id);
          return product ? { item, product, coupon: getCoupon(product, profile) } : null;
        })
        .filter(Boolean) as Array<{ item: { product_id: string; quantity: number }; product: Product; coupon: ReturnType<typeof getCoupon> }>,
    [cart, allProducts, profile]
  );

  const total = rows.reduce((sum, row) => sum + row.coupon.finalPrice * row.item.quantity, 0);

  function completeOrder() {
    setOrderMessage("Siparişiniz alındı. Demo alışveriş akışı başarıyla tamamlandı.");
    clearCart();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-950 dark:bg-gray-950 dark:text-white md:p-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-3 text-4xl font-black uppercase tracking-tight">Sepetim</h1>
        <p className="mb-10 text-gray-500 dark:text-gray-400">Kupon, persona ve adet bilgisine göre güncel sepet toplamı hesaplanır.</p>

        {orderMessage && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-5 font-black text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
            {orderMessage}
          </div>
        )}

        {!rows.length && !orderMessage && (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-gray-500 dark:bg-gray-900 dark:text-gray-300">
            Sepet boş. <Link href="/shop" className="text-blue-600 dark:text-blue-300">Mağazaya dön</Link>
          </div>
        )}

        <div className="space-y-4">
          {rows.map(({ item, product, coupon }) => (
            <div key={product.id} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900 md:grid-cols-[96px_1fr_auto] md:items-center">
              <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-950">
                {product.image ? <img src={product.image} alt={product.title} className="h-full w-full object-contain p-3" /> : null}
              </div>
              <div>
                <Link href={`/shop/${product.id}`} className="font-black text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{product.title}</Link>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.brand} · {coupon.label}</p>
                <p className="mt-2 text-sm font-black text-blue-600 dark:text-blue-300">{coupon.finalPrice} TL</p>
              </div>
              <div className="flex items-center gap-3 justify-end">
                {/* Adet Kontrol Kısmı */}
                <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-2 dark:bg-blue-950/50">
                  <button className="h-10 w-10 rounded-xl bg-white font-black text-blue-700 shadow-sm transition hover:bg-gray-100 dark:bg-gray-900 dark:text-blue-200 dark:hover:bg-gray-800" onClick={() => updateCartQuantity(product.id, item.quantity - 1)} type="button">-</button>
                  <span className="min-w-8 text-center font-black text-blue-900 dark:text-blue-100">{item.quantity}</span>
                  <button className="h-10 w-10 rounded-xl bg-blue-600 font-black text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" onClick={() => updateCartQuantity(product.id, item.quantity + 1)} type="button">+</button>
                </div>
                
                {/* İstediğin Yeni Çöp Kutusu Butonu */}
                <button 
                  className="h-14 w-14 rounded-2xl border border-gray-200 text-gray-400 flex items-center justify-center shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-800 dark:hover:border-red-900/50 dark:hover:bg-red-950/50 dark:hover:text-red-400" 
                  onClick={() => removeFromCart(product.id)} 
                  title="Ürünü sepetten çıkar"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {!!rows.length && (
          <div className="mt-8 rounded-2xl bg-gray-950 p-8 text-white dark:bg-white dark:text-gray-950 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white/70 dark:text-gray-500">Toplam</span>
              <span className="text-3xl font-black">{total} TL</span>
            </div>
            <button onClick={completeOrder} className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg" type="button">
              Demo siparişi tamamla
            </button>
          </div>
        )}
      </div>
    </main>
  );
}