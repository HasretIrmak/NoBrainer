"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchReturnRisk } from "../../lib/api";
import { useSellerProducts } from "../../lib/sellerStore";
import type { Product, ReturnRiskResult } from "../../lib/types";
import { useCommerceStore } from "../../lib/userStore";

const reasons = [
  "Kalıp küçük / dar",
  "Kalıp büyük",
  "Konfor beklentimi karşılamadı",
  "Malzeme kalitesi",
  "Renk/görsel farklılığı",
  "Diğer",
];

export default function ReturnsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [reason, setReason] = useState(reasons[0]);
  const [note, setNote] = useState("");
  const [risk, setRisk] = useState<ReturnRiskResult | null>(null);
  const { returns, createReturn } = useCommerceStore();
  const { products: uploadedProducts } = useSellerProducts();

  useEffect(() => {
    fetchProducts().then((items) => {
      setProducts(items);
      if (items[0]) setSelectedProductId(items[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProductId) return;
    const localProduct = uploadedProducts.find((product) => product.id === selectedProductId);
    if (localProduct) {
      const issueCount = localProduct.known_issues.length;
      setRisk({
        product_id: localProduct.id,
        risk_score: issueCount ? 50 + issueCount * 10 : 25,
        risk_level: issueCount >= 3 ? "high" : issueCount ? "medium" : "low",
        detected_issues: localProduct.known_issues,
        user_warning: issueCount ? "Satıcı yüklemesi için beden, konfor ve kalite bilgilerini kontrol edin." : "Belirgin iade riski düşük.",
        seller_advice: "Satıcı ürün açıklamasına beden, kargo ve iade bilgilerini net eklemeli.",
        reasons: issueCount ? localProduct.known_issues : ["Belirgin risk sinyali yok."],
        evidence: [],
      });
      return;
    }
    fetchReturnRisk(selectedProductId).then(setRisk).catch(() => setRisk(null));
  }, [selectedProductId, uploadedProducts]);

  const allProducts = [...products, ...uploadedProducts];

  const selectedProduct = useMemo(
    () => allProducts.find((product) => product.id === selectedProductId),
    [allProducts, selectedProductId]
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedProductId) return;
    const record = createReturn({
      product_id: selectedProductId,
      reason,
      note,
      risk_level: risk?.risk_level || "unknown",
    });
    setNote(`İade kodun oluşturuldu: ${record.code}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-4xl font-black uppercase tracking-tight">İade merkezi</h1>
        <p className="mb-10 text-gray-500">İade nedeni gir, sistem risk nedenlerini ve iade kodunu birlikte oluştursun.</p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-sm">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">Ürün</span>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold"
              >
                {allProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.title}</option>
                ))}
              </select>
            </label>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">İade nedeni</span>
              <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold">
                {reasons.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">Not</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-gray-200 p-4 font-medium" />
            </label>

            <button className="mt-6 w-full rounded-2xl bg-black px-6 py-4 font-black text-white" type="submit">
              İade kodu oluştur
            </button>
          </form>

          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black">Risk nedeni</h2>
            <p className="mt-3 text-gray-600">{selectedProduct?.title}</p>
            <div className="mt-6 rounded-2xl bg-red-50 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-red-500">Risk seviyesi</p>
              <p className="mt-2 text-3xl font-black text-red-700">{risk?.risk_level || "bekleniyor"} · {risk?.risk_score || 0}</p>
              <p className="mt-3 text-sm leading-relaxed text-red-700">{risk?.user_warning || "Backend iade riski bekleniyor."}</p>
            </div>
            <div className="mt-6 space-y-3">
              {(risk?.reasons || []).map((item) => (
                <div key={item} className="rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-600">{item}</div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-2xl font-black">Oluşturulan iade kodları</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {returns.map((record) => (
              <div key={record.id} className="rounded-xl border border-gray-100 p-5">
                <p className="text-xl font-black">{record.code}</p>
                <p className="mt-1 text-sm text-gray-500">{record.reason} · {record.risk_level}</p>
                <p className="mt-3 text-sm text-gray-600">{record.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
