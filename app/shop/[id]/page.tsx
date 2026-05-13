"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PersonaSwitch from "../../../components/shop/PersonaSwitch";
import ReturnWarning from "../../../components/shop/ReturnWarning";
import SmartReviews from "../../../components/shop/SmartReviews";
import TrustLayer from "../../../components/shop/TrustLayer";
import { fetchPersonaContent, fetchProductById, fetchReturnRisk } from "../../../lib/api";
import type { Persona, PersonaResult, Product, ReturnRiskResult } from "../../../lib/types";

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
  const [loading, setLoading] = useState(true);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      return;
    }

    setLoading(true);
    Promise.all([fetchProductById(productId), fetchReturnRisk(productId)])
      .then(([productResponse, riskResponse]) => {
        setProduct(productResponse);
        setRisk(riskResponse);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Urun detayi alinamadi."))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    setPersonaLoading(true);
    fetchPersonaContent(productId, persona)
      .then(setPersonaResult)
      .catch(() => setPersonaResult(null))
      .finally(() => setPersonaLoading(false));
  }, [productId, persona]);

  const content = useMemo(() => {
    if (personaResult?.content) {
      return personaResult.content;
    }

    return {
      hero_title: product?.title || "Urun yukleniyor",
      hero_description: product?.description || "Backend verisi bekleniyor.",
      features: product?.tags?.slice(0, 3) || [],
      cta: "Sepete ekle",
    };
  }, [personaResult, product]);

  if (loading) {
    return <div className="min-h-screen bg-white p-8 font-bold text-gray-500">Urun detayi yukleniyor...</div>;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
          Backend baglantisi kurulamadi: {error || "Urun bulunamadi."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="sticky top-8 flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50">
            {product.image ? (
              <img src={product.image} alt={product.title} className="h-full w-full object-contain p-10" />
            ) : (
              <span className="font-bold text-gray-400">Image missing</span>
            )}
          </div>

          <div>
            <PersonaSwitch current={persona} setPersona={setPersona} />
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                {product.brand}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                {personaResult?.source || "fallback"}
              </span>
            </div>

            <h1 className="mb-4 text-5xl font-black tracking-tight text-gray-900">{content.hero_title}</h1>
            <p className="mb-6 text-2xl font-black text-blue-600">{formatPrice(product)}</p>

            <ReturnWarning risk={risk} />

            <p className="mb-6 text-lg leading-relaxed text-gray-600">
              {personaLoading ? "Persona icerigi yenileniyor..." : content.hero_description}
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

            <button className="w-full rounded-3xl bg-black py-6 text-xl font-bold text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-95">
              {content.cta}
            </button>

            <TrustLayer product={product} risk={risk} />
            <SmartReviews persona={persona} reviews={product.reviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
