"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PersonaSwitch from "../../../components/shop/PersonaSwitch";
import ReturnWarning from "../../../components/shop/ReturnWarning";
import SmartReviews from "../../../components/shop/SmartReviews";
import TrustLayer from "../../../components/shop/TrustLayer";
import { fetchPersonaContent, fetchProductById, fetchReturnRisk, fetchReviewSummary } from "../../../lib/api";
import { getCoupon, getMatchReason, scoreProductForProfile } from "../../../lib/personalization";
import { useSellerProducts } from "../../../lib/sellerStore";
import type { Persona, PersonaResult, Product, ReturnRiskResult, ReviewSummaryResult } from "../../../lib/types";
import { useCommerceStore } from "../../../lib/userStore";

function formatPrice(product: Product) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: product.currency || "TRY",
    maximumFractionDigits: 0,
  }).format(product.price);
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [persona, setPersona] = useState<Persona>("style");
  const [product, setProduct] = useState<Product | null>(null);
  const [risk, setRisk] = useState<ReturnRiskResult | null>(null);
  const [personaResult, setPersonaResult] = useState<PersonaResult | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [error, setError] = useState("");
  const { profile, favorites, setPersona: savePersona, toggleFavorite, addToCart, createReturn } = useCommerceStore();
  const { products: uploadedProducts } = useSellerProducts();

  useEffect(() => {
    if (!productId) {
      return;
    }

    const localProduct = uploadedProducts.find((item) => item.id === productId);

    if (localProduct) {
      setProduct(localProduct);
      setRisk({
        product_id: localProduct.id,
        risk_score: localProduct.known_issues.length ? 55 : 25,
        risk_level: localProduct.known_issues.length ? "medium" : "low",
        detected_issues: localProduct.known_issues,
        user_warning: localProduct.known_issues.length ? "Bu üründe satıcı yüklemesinden gelen risk sinyalleri var." : "Belirgin iade riski düşük.",
        seller_advice: "Satıcı beden, kargo ve iade bilgisini ürün açıklamasında netleştirmeli.",
        reasons: localProduct.known_issues.length ? localProduct.known_issues : ["Belirgin risk sinyali yok."],
        evidence: [],
      });
      setReviewSummary({
        product_id: localProduct.id,
        source: "fallback",
        short_summary: "Satıcı tarafından yeni yüklenen ürün için yorum verisi henüz sınırlı.",
        positive_points: ["Ürün mağaza tarafından manuel eklendi."],
        negative_points: ["Yeterli yorum oluşana kadar beden ve iade bilgisi dikkatle incelenmeli."],
        return_risk_reasons: localProduct.known_issues.length ? localProduct.known_issues : ["Yorum verisi henüz düşük."],
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([fetchProductById(productId), fetchReturnRisk(productId), fetchReviewSummary(productId)])
      .then(([productResponse, riskResponse, summaryResponse]) => {
        setProduct(productResponse);
        setRisk(riskResponse);
        setReviewSummary(summaryResponse);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ürün detayı alınamadı."))
      .finally(() => setLoading(false));
  }, [productId, uploadedProducts]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    setPersonaLoading(true);
    fetchPersonaContent(productId, persona, profile)
      .then(setPersonaResult)
      .catch(() => setPersonaResult(null))
      .finally(() => setPersonaLoading(false));
  }, [productId, persona, profile.gender, profile.age_group, profile.coupon_sensitive, profile.fit_sensitive]);

  useEffect(() => {
    setPersona(profile.persona);
  }, [profile.persona]);

  const content = useMemo(() => {
    if (personaResult?.content) {
      return personaResult.content;
    }

    return {
      hero_title: product?.title || "Ürün yükleniyor",
      hero_description: product?.description || "Ürün verisi hazırlanıyor.",
      features: product?.tags?.slice(0, 3) || [],
      cta: "Sepete ekle",
    };
  }, [personaResult, product]);

  if (loading) {
    return <div className="min-h-screen bg-white p-8 font-bold text-gray-500 dark:bg-gray-950 dark:text-gray-300">Ürün detayı yükleniyor...</div>;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white p-8 dark:bg-gray-950">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Ürün verisi alınamadı: {error || "Ürün bulunamadı."}
        </div>
      </div>
    );
  }

  const coupon = getCoupon(product, profile);
  const isFavorite = favorites.includes(product.id);
  const matchScore = scoreProductForProfile(product, profile);

  function handlePersonaChange(nextPersona: Persona) {
    setPersona(nextPersona);
    savePersona(nextPersona);
  }

  function handleReturnCode() {
    createReturn({
      product_id: product.id,
      reason: risk?.detected_issues[0] || "Ürün beklentimi karşılamadı",
      note: risk?.user_warning || "Ürün detayından hızlı iade kodu oluşturuldu.",
      risk_level: risk?.risk_level || "unknown",
    });
  }

  return (
    <div className="min-h-screen bg-white p-8 text-gray-950 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="sticky top-8 flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            {product.image ? (
              <img src={product.image} alt={product.title} className="h-full w-full object-contain p-10" />
            ) : (
              <span className="font-bold text-gray-400">Görsel yok</span>
            )}
          </div>

          <div>
            <PersonaSwitch current={persona} setPersona={handlePersonaChange} />
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                {product.brand}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                {personaResult?.source || "fallback"}
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-600">
                Profil uyumu %{matchScore}
              </span>
            </div>

            <h1 className="mb-4 text-5xl font-black tracking-tight text-gray-900 dark:text-white">{content.hero_title}</h1>
            <p className="mb-2 text-2xl font-black text-blue-600">{formatPrice(product)}</p>
            {coupon.eligible && (
              <p className="mb-6 rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
                {profile.persona === "budget" ? "Bütçe personası avantajı:" : "Kupon avantajı:"} {coupon.label} ile tahmini {coupon.finalPrice} TL.
              </p>
            )}

            <ReturnWarning risk={risk} />

            <p className="mb-6 text-lg leading-relaxed text-gray-600">
              {personaLoading ? "Persona içeriği yenileniyor..." : content.hero_description}
            </p>

            {!!content.features.length && (
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {content.features.map((feature) => (
                  <div key={feature} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-700">
                    {feature}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button onClick={() => addToCart(product.id)} className="rounded-3xl bg-black py-5 text-base font-bold text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-95" type="button">
                {content.cta}
              </button>
              <button onClick={() => toggleFavorite(product.id)} className={`rounded-3xl border py-5 text-base font-bold ${isFavorite ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 text-gray-700"}`} type="button">
                {isFavorite ? "Favoride" : "Favorile"}
              </button>
              <button onClick={handleReturnCode} className="rounded-3xl border border-amber-200 bg-amber-50 py-5 text-base font-bold text-amber-700" type="button">
                İade kodu
              </button>
            </div>

            <TrustLayer product={product} risk={risk} />
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-blue-950">Gemini yorum özeti</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                  {reviewSummary?.source || "fallback"}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-blue-900">
                {reviewSummary?.short_summary || getMatchReason(product, profile)}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-green-700">Olumlu</h4>
                  {(reviewSummary?.positive_points || []).slice(0, 3).map((item) => (
                    <p key={item} className="mb-2 rounded-xl bg-white p-3 text-xs font-bold text-gray-700">{item}</p>
                  ))}
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-red-700">Dikkat</h4>
                  {(reviewSummary?.negative_points || risk?.reasons || []).slice(0, 3).map((item) => (
                    <p key={item} className="mb-2 rounded-xl bg-white p-3 text-xs font-bold text-gray-700">{item}</p>
                  ))}
                </div>
              </div>
            </div>
            <SmartReviews persona={persona} reviews={product.reviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
