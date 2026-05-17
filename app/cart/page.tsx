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
  const { cart, profile, updateCartQuantity, clearCart } = useCommerceStore();
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
                <Link href={`/shop/${product.id}`} className="font-black text-gray-900 dark:text-white">{product.title}</Link>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.brand} · {coupon.label}</p>
                <p className="mt-2 text-sm font-black text-blue-600 dark:text-blue-300">{coupon.finalPrice} TL</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-2 dark:bg-blue-950">
                <button className="h-10 w-10 rounded-xl bg-white font-black text-blue-700 shadow-sm dark:bg-gray-900 dark:text-blue-200" onClick={() => updateCartQuantity(product.id, item.quantity - 1)} type="button">-</button>
                <span className="min-w-8 text-center font-black text-blue-900 dark:text-blue-100">{item.quantity}</span>
                <button className="h-10 w-10 rounded-xl bg-blue-600 font-black text-white shadow-sm hover:bg-blue-700" onClick={() => updateCartQuantity(product.id, item.quantity + 1)} type="button">+</button>
              </div>
            </div>
          ))}
        </div>

        {!!rows.length && (
          <div className="mt-8 rounded-2xl bg-gray-950 p-8 text-white dark:bg-white dark:text-gray-950">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white/70 dark:text-gray-500">Toplam</span>
              <span className="text-3xl font-black">{total} TL</span>
            </div>
            <button onClick={completeOrder} className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-700" type="button">
              Demo siparişi tamamla
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
