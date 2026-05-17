"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PersonaSwitch from "../../../components/shop/PersonaSwitch";
import ReturnWarning from "../../../components/shop/ReturnWarning";
import SmartReviews from "../../../components/shop/SmartReviews";
import TrustLayer from "../../../components/shop/TrustLayer";
import { fetchPersonaContent, fetchProductById, fetchReturnRisk, fetchReviewSummary } from "../../../lib/api";
import { getCoupon, getMatchReason, scoreProductForProfile, translateTag, translateTitle } from "../../../lib/personalization";
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

  // GÜVENLİ İADE RİSKİ ÇEVİRİSİ
  const riskReasonsMapped = useMemo(() => {
    const rawReasons = risk?.reasons || [];
    return rawReasons.map(r => translateTag(r));
  }, [risk]);

  useEffect(() => {
    if (!productId) return;

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
        source: "Müşteri Paneli",
        short_summary: "Satıcı tarafından yeni yüklenen ürün için yorum verisi henüz analiz aşamasında.",
        positive_points: ["Ürün mağaza tarafından yeni eklendi."],
        negative_points: ["Yeterli yorum oluşana kadar beden tablosu incelenmeli."],
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
    if (!productId) return;

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
      return {
        ...personaResult.content,
        hero_title: translateTitle(personaResult.content.hero_title),
      };
    }
    return {
      hero_title: product?.title ? translateTitle(product.title) : "Ürün yükleniyor",
      hero_description: product?.description || "Ürün verisi hazırlanıyor.",
      features: product?.tags?.slice(0, 3) || [],
      cta: "Sepete ekle",
    };
  }, [personaResult, product]);

  // 🎯 SEÇİLEN SEKMEYE GÖRE DİNAMİK PROFİL OLUŞTURMA (Simülasyon için)
  const currentMockProfile = useMemo(() => {
    return {
      ...profile,
      persona: persona // Butona basıldığında geçici profili o personaya eşitliyoruz
    };
  }, [profile, persona]);

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

  // Kuponu ve Uyum Skorunu da seçilen sekmeye göre dinamik olarak hesaplatıyoruz
  const coupon = getCoupon(product, currentMockProfile);
  const isFavorite = favorites.includes(product.id);
  const matchScore = scoreProductForProfile(product, currentMockProfile);

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
    <div className="min-h-screen bg-white p-8 text-gray-950 dark:bg-gray-950 dark:text-white transition-colors">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Ürün Görsel Alanı */}
          <div className="sticky top-8 flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            {product.image ? (
              <img src={product.image} alt={product.title} className="h-full w-full object-contain p-10" />
            ) : (
              <span className="font-bold text-gray-400">Görsel yok</span>
            )}
          </div>

          {/* Ürün Detay Bilgileri */}
          <div>
            <PersonaSwitch current={persona} setPersona={handlePersonaChange} />
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                {product.brand}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                {personaResult?.source === "live" ? "✨ Canlı Yapay Zeka" : "🤖 Kişiselleştirilmiş Motor"}
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-600 dark:bg-green-950/40 dark:text-green-400">
                Profil uyumu %{matchScore}
              </span>
            </div>

            <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
              {content.hero_title}
            </h1>
            <p className="mb-2 text-2xl font-black text-blue-600 dark:text-blue-400">{formatPrice(product)}</p>
            
            {coupon.eligible && (
              <p className="mb-6 rounded-2xl bg-green-50/60 border border-green-100 p-4 text-sm font-bold text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300">
                🚀 {persona === "budget" ? "Bütçe Personası Avantajı:" : persona === "comfort" ? "Konfor Personası Avantajı:" : "Stil Personası Avantajı:"} <span className="font-black text-green-600 dark:text-green-400">{coupon.label}</span> ile sepetinizde sadece <span className="text-base font-black text-blue-600 dark:text-blue-400">{coupon.finalPrice} TL</span>.
              </p>
            )}

            <ReturnWarning risk={risk} />

            {/* SEKMEYE GÖRE DEĞİŞEN DİNAMİK AÇIKLAMA ALANI */}
            <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-300 min-h-[4rem]">
              {personaLoading ? (
                <span className="text-gray-400 animate-pulse font-medium">Persona içeriği uyarlanıyor...</span>
              ) : (
                translateTitle(content.hero_description)
              )}
            </p>

            {/* KÜÇÜK ÖZELLİK KUTULARI */}
            {!!content.features.length && (
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {content.features.map((feature) => (
                  <div key={feature} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-xs font-black text-gray-700 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300 text-center shadow-xs">
                    🎯 {translateTag(feature)}
                  </div>
                ))}
              </div>
            )}

            {/* Aksiyon Butonları */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-8">
              <button onClick={() => addToCart(product.id)} className="rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-700 active:scale-95" type="button">
                {content.cta}
              </button>
              <button onClick={() => toggleFavorite(product.id)} className={`rounded-2xl border py-4 text-sm font-black transition active:scale-95 ${isFavorite ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400" : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"}`} type="button">
                {isFavorite ? "❤ Favorilerden Kaldır" : "🖤 Favorilere Ekle"}
              </button>
              <button onClick={handleReturnCode} className="rounded-2xl border border-amber-200 bg-amber-50 py-4 text-sm font-black text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400 transition active:scale-95 hover:bg-amber-100/50 dark:hover:bg-amber-950/40" type="button">
                ⚡ Hızlı İade Kodu
              </button>
            </div>

            <TrustLayer product={product} risk={risk} />

            {/* 🔥 SEKMEYE GÖRE %100 DEĞİŞEN DINAMIK YAPAY ZEKA ANALİZ KUTUSU */}
            <div className="mt-8 rounded-2xl border border-blue-100/70 bg-gradient-to-br from-blue-50/70 to-indigo-50/30 p-6 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-slate-900/40 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="text-lg font-black text-blue-950 dark:text-blue-100 tracking-tight">Gemini Yapay Zeka Analizi</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-blue-700 border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900/50 shadow-sm uppercase">
                  {reviewSummary?.source === "live" ? "⚡ Canlı Analiz" : "📝 Özet Motoru"}
                </span>
              </div>
              
              {/* 🎯 SEÇİLEN SEKMEYE ÖZEL ANLIK ÖZET METNİ TETİKLENİYOR */}
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                {getMatchReason(product, currentMockProfile)}
              </p>
              
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Olumlu Maddeler */}
                <div className="rounded-xl bg-green-50/40 border border-green-100/50 p-4 dark:bg-green-950/10 dark:border-green-900/20">
                  <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    🟢 Öne Çıkan Olumlu Yönler
                  </h4>
                  {persona === "budget" && (
                    <div className="mb-2 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Kupon entegrasyonu ile maksimum fiyat/değer dengesi sağlanıyor.</span>
                    </div>
                  )}
                  {persona === "comfort" && (
                    <div className="mb-2 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Kullanıcı yorumlarında taban rahatlığı ve yastıklama tam not almış.</span>
                    </div>
                  )}
                  {persona === "style" && (
                    <div className="mb-2 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Silüet tasarımı ve estetik duruşu trend kıyafet kombinlerine tam uyumlu.</span>
                    </div>
                  )}
                  {(reviewSummary?.positive_points || []).slice(0, 2).map((item) => (
                    <div key={item} className="mb-2 last:mb-0 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 dark:border-gray-800/40 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{translateTag(item)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Dikkat Edilmesi Gerekenler */}
                <div className="rounded-xl bg-red-50/40 border border-red-100/50 p-4 dark:bg-red-950/10 dark:border-red-900/20">
                  <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    🔴 Dikkat Edilmesi Gerekenler
                  </h4>
                  {persona === "comfort" && (
                    <div className="mb-2 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">⚠️</span>
                      <span>Dar kalıp uyarısı olduğundan konfor için 1 numara büyük düşünülmeli.</span>
                    </div>
                  )}
                  {persona === "budget" && (
                    <div className="mb-2 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">⚠️</span>
                      <span>Kupon bitiş süreleri ve sepet limitleri takip edilmelidir.</span>
                    </div>
                  )}
                  {persona === "style" && (
                    <div className="mb-2 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">⚠️</span>
                      <span>Tasarım ön planda olduğundan yoğun yürüyüşler için ideal olmayabilir.</span>
                    </div>
                  )}
                  {(reviewSummary?.negative_points || riskReasonsMapped).slice(0, 2).map((item) => (
                    <div key={item} className="mb-2 last:mb-0 rounded-xl bg-white/90 dark:bg-gray-900 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-100/50 dark:border-gray-800/40 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">⚠️</span>
                      <span>{translateTag(item)}</span>
                    </div>
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