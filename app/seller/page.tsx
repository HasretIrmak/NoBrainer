"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScoreCard from "../../components/ScoreCard";
import ScoreChart from "../../components/ScoreChart";
import { fetchOptimization, fetchProductAnalysis, fetchProducts, fetchReturnRisk } from "../../lib/api";
import type { AnalysisResult, OptimizeResult, Product, ReturnRiskResult } from "../../lib/types";

function percent(value: number) {
  return `%${Math.round(value * 100)}`;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [risk, setRisk] = useState<ReturnRiskResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then((items) => {
        setProducts(items);
        if (items[0]) {
          setSelectedProductId(items[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Urunler alinamadi."));
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      return;
    }

    void handleAnalyze(selectedProductId);
  }, [selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  async function handleAnalyze(productId = selectedProductId) {
    if (!productId) {
      return;
    }

    setLoading(true);
    setError("");
    setOptimization(null);

    try {
      const [analysisResponse, riskResponse] = await Promise.all([
        fetchProductAnalysis(productId),
        fetchReturnRisk(productId),
      ]);
      setAnalysis(analysisResponse);
      setRisk(riskResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz alinamadi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOptimize() {
    if (!selectedProductId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setOptimization(await fetchOptimization(selectedProductId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimizasyon alinamadi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 md:p-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 border-b border-gray-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Satici kontrol paneli</h1>
            <p className="mt-2 text-gray-500">FastAPI analiz, iade riski ve optimizasyon endpointleriyle entegre.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="min-h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold shadow-sm outline-none"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleAnalyze()}
              className="min-h-12 rounded-2xl bg-black px-6 font-bold text-white shadow-xl transition-all active:scale-95"
              type="button"
            >
              Analiz et
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
            Backend baglantisi kurulamadi: {error}
          </div>
        )}

        {loading && <LoadingSpinner />}

        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <ScoreCard label="Donusum skoru" value={analysis?.overall_conversion_score || 0} />
          <ScoreCard label="Iade risk puani" value={analysis?.return_risk_score || 0} />
          <ScoreCard label="Satis sagligi" value={analysis?.sales_health_score || 0} />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                  {selectedProduct?.brand || "Urun"}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                  {analysis?.ai_source || "bekleniyor"}
                </span>
              </div>
              <h2 className="mb-3 text-2xl font-black text-gray-900">{selectedProduct?.title || "Urun seciliyor"}</h2>
              <p className="leading-relaxed text-gray-600">
                {analysis?.conversion_diagnosis || "Bir urun secildiginde backend analiz sonucu burada gorunur."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(analysis?.insights || []).slice(0, 4).map((insight) => (
                <div key={`${insight.title}-${insight.severity}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-wide text-blue-600">{insight.severity}</span>
                  <h3 className="mt-2 font-black text-gray-900">{insight.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <ScoreChart analysis={analysis} />
          </div>
        </div>

        <div className="mb-10 rounded-[2rem] border border-red-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Iade riski</h2>
              <p className="mt-2 text-gray-600">{risk?.seller_advice || "Iade riski analizi bekleniyor."}</p>
            </div>
            <div className="rounded-2xl bg-red-50 px-5 py-3 text-lg font-black text-red-700">
              Skor {risk?.risk_score || 0}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Tiklama</h3>
              <p className="mt-2 text-xl font-black">{analysis ? percent(analysis.funnel.click_rate) : "%0"}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Sepete ekleme</h3>
              <p className="mt-2 text-xl font-black">{analysis ? percent(analysis.funnel.cart_rate) : "%0"}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Gercek iade</h3>
              <p className="mt-2 text-xl font-black">{selectedProduct ? percent(selectedProduct.sales_signals.return_rate) : "%0"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">AI optimizasyonu</h2>
              <p className="mt-2 text-gray-600">Baslik, aciklama, FAQ ve guven mesajlari backend tarafindan uretilir.</p>
            </div>
            <button
              onClick={handleOptimize}
              className="min-h-12 rounded-2xl bg-black px-6 font-bold text-white shadow-xl transition-all active:scale-95"
              type="button"
            >
              Optimize et
            </button>
          </div>

          {optimization ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-6">
                <h3 className="mb-3 font-black text-gray-900">{optimization.optimized_title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{optimization.optimized_description}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-6">
                <h3 className="mb-3 font-black text-gray-900">FAQ</h3>
                <div className="space-y-3">
                  {optimization.faq.slice(0, 3).map((item) => (
                    <div key={item.question}>
                      <p className="text-sm font-bold text-gray-900">{item.question}</p>
                      <p className="text-sm text-gray-600">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-6 text-sm font-bold text-gray-500">
              Optimize et butonu calistiginda `/optimize/` endpoint cevabi burada gorunur.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
