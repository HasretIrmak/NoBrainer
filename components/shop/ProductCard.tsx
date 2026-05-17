"use client";

import Link from "next/link";
import { useState } from "react";
// 🎯 Sihirli translateTitle motorunu buraya import ediyoruz
import { getCoupon, getMatchReason, scoreProductForProfile, translateTitle } from "../../lib/personalization";
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
  
  // Çift tıklamayı engellemek için yerel kilit state'i
  const [isAdding, setIsAdding] = useState(false);

  // Güvenli sepet ekleme fonksiyonu
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Eğer zaten ekleme işlemi yapılıyorsa ikinci isteği engelle
    if (isAdding) return;

    // Kilidi devreye sok
    setIsAdding(true);
    
    // Asıl ekleme fonksiyonunu tetikle
    onAddToCart?.(product.id);

    // 400 milisaniye sonra kilidi kaldır (arka arkaya çift tetiklenmeyi tamamen keser)
    setTimeout(() => {
      setIsAdding(false);
    }, 400);
  };

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
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            {product.brand}
          </span>
          <span className="text-sm font-bold text-amber-600">⭐ {product.rating.toFixed(1)}</span>
        </div>

        {/* 🎯 BAŞLIĞI KELİME BAZLI TÜRKÇEYE ÇEVİREN SİHİRLİ DOKUNUŞ */}
        <h3 className="line-clamp-2 min-h-12 font-black leading-snug text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
          {translateTitle(product.title)}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-10 text-xs font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
          {getMatchReason(product, profile || null)}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="font-black text-blue-600 dark:text-blue-400">{formatPrice(product)}</span>
            {coupon.eligible && (
              <p className="text-xs font-black text-green-600 dark:text-green-400">🎯 {coupon.label} ile {coupon.finalPrice} TL</p>
            )}
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            %{matchScore} Uyum
          </span>
        </div>
      </Link>
      
      {showActions && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(product.id);
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-black transition-colors ${
              isFavorite 
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/50" 
                : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {isFavorite ? "❤ Kaldır" : "🖤 Favori"}
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`rounded-xl px-3 py-2 text-xs font-black text-white shadow-sm transition ${
              isAdding 
                ? "bg-blue-400 cursor-not-allowed dark:bg-blue-700" 
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
          >
            {isAdding ? "Ekleniyor..." : "Sepete ekle"}
          </button>
        </div>
      )}
    </div>
  );
}