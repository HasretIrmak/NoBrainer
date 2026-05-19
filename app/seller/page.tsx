"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScoreCard from "../../components/ScoreCard";
import ScoreChart from "../../components/ScoreChart";
import { fetchOptimization, fetchProductAnalysis, fetchProducts, fetchReturnRisk } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import {
  createUploadedProduct,
  getProductStoreId,
  useSellerProducts,
} from "../../lib/sellerStore";
import type {
  AnalysisResult,
  OptimizeResult,
  Product,
  ReturnRiskResult,
  SellerAccount,
  SellerStore,
} from "../../lib/types";

function percent(value: number) {
  return `%${Math.round(value * 100)}`;
}

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function estimatedReturnCount(product: Product) {
  return Math.round(product.sales_signals.sales * product.sales_signals.return_rate);
}

function productRiskScore(product: Product) {
  const signalTotal = Object.values(product.return_risk_signals).reduce((sum, value) => sum + value, 0);
  return Math.min(100, Math.round(20 + signalTotal * 5 + product.known_issues.length * 7 + product.sales_signals.return_rate * 120));
}

function buildLocalAnalysis(product: Product): AnalysisResult {
  const riskScore = productRiskScore(product);
  const clickRate = product.sales_signals.clicks / Math.max(product.sales_signals.views, 1);
  const cartRate = product.sales_signals.cart_adds / Math.max(product.sales_signals.clicks, 1);
  const checkoutRate = product.sales_signals.sales / Math.max(product.sales_signals.cart_adds, 1);

  return {
    product_id: product.id,
    title_score: Math.min(100, 45 + product.title.length),
    description_score: Math.min(100, 40 + product.description.length / 3),
    visual_score: product.image ? 75 : 35,
    trust_score: Math.min(100, 45 + product.rating * 10),
    review_score: Math.min(100, 45 + product.review_count * 2),
    sales_health_score: Math.max(20, Math.min(100, 80 - product.sales_signals.return_rate * 140)),
    price_competitiveness_score: product.price <= product.market_signals.avg_category_price ? 82 : 62,
    return_risk_score: riskScore,
    risk_level: riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low",
    overall_conversion_score: Math.max(0, 78 - riskScore * 0.25),
    funnel: {
      views: product.sales_signals.views,
      clicks: product.sales_signals.clicks,
      cart_adds: product.sales_signals.cart_adds,
      sales: product.sales_signals.sales,
      click_rate: clickRate,
      cart_rate: cartRate,
      checkout_rate: checkoutRate,
      purchase_rate: product.sales_signals.sales / Math.max(product.sales_signals.views, 1),
      return_rate: product.sales_signals.return_rate,
      main_dropoff: product.sales_signals.return_rate >= 0.22 ? "retention" : "healthy",
    },
    conversion_diagnosis:
      product.sales_signals.return_rate >= 0.22
        ? "İade oranı yüksek. Beden, konfor ve ürün beklentisi daha net anlatılmalı."
        : "Ürün sinyalleri dengeli. Görseller, yorumlar ve güven mesajları güçlendirilerek satış artırılabilir.",
    ai_source: "fallback",
    insights: [
      {
        type: "suggestion",
        title: "Satıcı ürün düzenleme önerisi",
        message: product.known_issues.length
          ? `Bu üründe ${product.known_issues.join(", ")} sinyalleri var. Açıklamada beden ve kalite beklentisini netleştir.`
          : "Bu ürün için ana öneri daha fazla ürün görseli, net beden tablosu ve güven mesajı eklemek.",
        severity: product.known_issues.length ? "medium" : "low",
      },
    ],
    recommendations: [],
    recommended_actions: [
      "Ürün açıklamasını beden, kullanım ve malzeme bilgisiyle genişlet.",
      "Kargo ve iade koşullarını ürün sayfasında görünür yap.",
    ],
  };
}

function buildLocalRisk(product: Product): ReturnRiskResult {
  const score = productRiskScore(product);
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return {
    product_id: product.id,
    risk_score: score,
    risk_level: level,
    detected_issues: product.known_issues,
    user_warning:
      level === "high"
        ? "Bu üründe iade riski yüksek. Beden, konfor ve kalite yorumlarını dikkatli kontrol edin."
        : "Bu ürün için iade riski kontrol edildi.",
    seller_advice: product.known_issues.length
      ? `Satıcı profili için öneri: ${product.known_issues.join(", ")} sinyallerini ürün açıklamasında açıkça ele al.`
      : "Satıcı profili için öneri: güven mesajlarını, kargo bilgisini ve ürün görsellerini güçlendir.",
    reasons: product.known_issues.length ? product.known_issues : ["Belirgin iade sinyali düşük."],
    evidence: [],
  };
}

function financeForProducts(products: Product[], store?: SellerStore | null) {
  const revenue = products.reduce((sum, product) => sum + product.price * product.sales_signals.sales, 0);
  const returnCost = products.reduce(
    (sum, product) => sum + product.price * estimatedReturnCount(product) * 0.65,
    0
  );
  const shipping = products.reduce(
    (sum, product) => sum + product.sales_signals.sales * (store?.shipping_fee || 45),
    0
  );
  const marketplace = revenue * (store?.marketplace_fee_rate || 0.12);
  const fixed = store?.fixed_expense || 2500;
  const expense = returnCost + shipping + marketplace + fixed;
  const profit = revenue - expense;

  return {
    revenue,
    returnCost,
    shipping,
    marketplace,
    fixed,
    expense,
    profit,
    margin: revenue > 0 ? profit / revenue : 0,
  };
}

export default function SellerDashboard() {
  const { activeAccount, isSeller, addSellerStore } = useAuthStore();
  const { products: uploadedProducts, addProduct } = useSellerProducts();
  const [baseProducts, setBaseProducts] = useState<Product[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [modelQuery, setModelQuery] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [risk, setRisk] = useState<ReturnRiskResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [upload, setUpload] = useState({
    title: "",
    brand: "",
    description: "",
    price: 1500,
    gender: "Unisex",
    shoe_type: "sneaker",
    image: "",
  });

  const seller = activeAccount?.role === "seller" ? (activeAccount as SellerAccount) : null;
  const stores = seller?.stores || [];

  useEffect(() => {
    fetchProducts()
      .then(setBaseProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Ürünler alınamadı."));
  }, []);

  useEffect(() => {
    if (stores[0] && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const allProducts = [...baseProducts, ...uploadedProducts];
  const selectedStore = stores.find((store) => store.id === selectedStoreId) || stores[0] || null;

  const storeProducts = useMemo(
    () =>
      selectedStore
        ? allProducts.filter((product) => getProductStoreId(product, stores) === selectedStore.id)
        : allProducts,
    [allProducts, selectedStore, stores]
  );

  const brands = Array.from(new Set(storeProducts.map((product) => product.brand))).sort();
  const filteredProducts = storeProducts.filter((product) => {
    const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
    const matchesModel =
      !modelQuery ||
      `${product.title} ${product.brand} ${product.description}`.toLowerCase().includes(modelQuery.toLowerCase());
    return matchesBrand && matchesModel;
  });

  useEffect(() => {
    const first = filteredProducts[0];
    if (first && !filteredProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(first.id);
    }
  }, [filteredProducts, selectedProductId]);

  const selectedProduct = filteredProducts.find((product) => product.id === selectedProductId) || filteredProducts[0] || null;
  const selectedFinance = financeForProducts(filteredProducts, selectedStore);
  const allStoreFinance = stores.map((store) => {
    const products = allProducts.filter((product) => getProductStoreId(product, stores) === store.id);
    return { store, products, finance: financeForProducts(products, store) };
  });

  useEffect(() => {
    if (selectedProduct) {
      void analyzeSelectedProduct(selectedProduct);
    }
  }, [selectedProduct?.id]);

  async function analyzeSelectedProduct(product: Product) {
    setLoading(true);
    setError("");
    setOptimization(null);

    if (product.id.startsWith("seller_product")) {
      setAnalysis(buildLocalAnalysis(product));
      setRisk(buildLocalRisk(product));
      setLoading(false);
      return;
    }

    try {
      const [analysisResponse, riskResponse] = await Promise.all([
        fetchProductAnalysis(product.id),
        fetchReturnRisk(product.id),
      ]);
      setAnalysis(analysisResponse);
      setRisk(riskResponse);
    } catch (err) {
      setAnalysis(buildLocalAnalysis(product));
      setRisk(buildLocalRisk(product));
      setError(err instanceof Error ? err.message : "Backend analizi alınamadı, yerel analiz gösteriliyor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOptimize() {
    if (!selectedProduct) return;
    if (selectedProduct.id.startsWith("seller_product")) {
      setOptimization({
        product_id: selectedProduct.id,
        optimized_title: `${selectedProduct.brand} ${selectedProduct.title} - Net Beden Bilgili Model`,
        optimized_description: `${selectedProduct.description} Beden, kullanım alanı, kargo ve iade koşulları daha açık anlatılarak güven artırılabilir.`,
        faq: [
          { question: "Beden nasıl seçilmeli?", answer: "Beden tablosu ve kullanıcı yorumları birlikte kontrol edilmeli." },
        ],
        trust_messages: ["Beden bilgisi netleştirildi.", "Kargo ve iade mesajı güçlendirildi.", "Ürün görsel önerileri eklendi."],
      });
      return;
    }

    setLoading(true);
    try {
      setOptimization(await fetchOptimization(selectedProduct.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimizasyon alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUpload((current) => ({ ...current, image: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!selectedStore) return;
    addProduct(createUploadedProduct({ ...upload, store_id: selectedStore.id }));
    setUpload({
      title: "",
      brand: "",
      description: "",
      price: 1500,
      gender: "Unisex",
      shoe_type: "sneaker",
      image: "",
    });
  }

  function handleAddStore() {
    if (!newStoreName.trim()) return;
    const createdStore = addSellerStore(newStoreName.trim());
    if (createdStore) {
      setSelectedStoreId(createdStore.id);
    }
    setNewStoreName("");
  }

  if (!isSeller) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 dark:bg-gray-950 md:p-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-900">
          <h1 className="text-3xl font-black dark:text-white">Satıcı paneli için satıcı girişi gerekli</h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Demo satıcı hesabı: satici / 123456</p>
          <Link href="/login" className="mt-6 inline-block rounded-2xl bg-black px-8 py-4 font-black text-white dark:bg-white dark:text-black">
            Satıcı girişi yap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 dark:bg-gray-950 dark:text-gray-50 md:p-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 border-b border-gray-200 pb-8 dark:border-gray-800 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Satıcı kontrol paneli</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {seller?.display_name} için mağaza bazlı ürün, iade, ciro, gider, kargo ve kâr marjı takibi.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
              className="min-h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold shadow-sm outline-none dark:border-gray-700 dark:bg-gray-900"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <button onClick={handleOptimize} className="min-h-12 rounded-2xl bg-black px-6 font-bold text-white shadow-xl dark:bg-white dark:text-black" type="button">
              NoBrainer önerisi üret
            </button>
          </div>
        </div>

        {error && <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm font-bold text-amber-700">{error}</div>}
        {loading && <LoadingSpinner />}

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {allStoreFinance.map(({ store, products, finance }) => (
            <button
              key={store.id}
              type="button"
              onClick={() => setSelectedStoreId(store.id)}
              className={`rounded-2xl border p-5 text-left shadow-sm ${selectedStoreId === store.id ? "border-blue-300 bg-blue-50 dark:bg-blue-950" : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"}`}
            >
              <h2 className="font-black">{store.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{products.length} ürün · {money(finance.revenue)} ciro</p>
              <p className="mt-3 text-sm font-black text-green-600">Kâr: {money(finance.profit)}</p>
            </button>
          ))}
        </section>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <ScoreCard label="Ciro" value={Math.round(selectedFinance.revenue)} prefix="₺" />
          <ScoreCard label="Gider" value={Math.round(selectedFinance.expense)} prefix="₺" />
          <ScoreCard label="Kâr" value={Math.round(selectedFinance.profit)} prefix="₺" />
          <ScoreCard label="İade Risk Puanı" value={analysis?.return_risk_score || 0} />
        </div>

        <section className="mb-10 grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900 md:grid-cols-4">
          <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950">
            <option value="all">Tüm markalar</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <input value={modelQuery} onChange={(event) => setModelQuery(event.target.value)} placeholder="Model / ürün ara" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 md:col-span-2" />
          <select value={selectedProduct?.id || ""} onChange={(event) => setSelectedProductId(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950">
            {filteredProducts.map((product) => (
              <option key={product.id} value={product.id}>{product.title}</option>
            ))}
          </select>
        </section>

        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-2xl font-black">{selectedProduct?.title || "Ürün seçiliyor"}</h2>
              <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">{analysis?.conversion_diagnosis || "Ürün seçildiğinde analiz burada görünür."}</p>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
                <Metric label="Yorum" value={selectedProduct?.review_count || 0} />
                <Metric label="Satış" value={selectedProduct?.sales_signals.sales || 0} />
                <Metric label="İade sayısı" value={selectedProduct ? estimatedReturnCount(selectedProduct) : 0} />
                <Metric label="İade oranı" value={selectedProduct ? percent(selectedProduct.sales_signals.return_rate) : "%0"} />
                <Metric label="Kargo" value={money(selectedStore?.shipping_fee || 0)} />
                <Metric label="Kâr marjı" value={percent(selectedFinance.margin)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(analysis?.insights || []).slice(0, 4).map((insight) => (
                <div key={`${insight.title}-${insight.severity}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-xs font-black uppercase tracking-wide text-blue-600">{insight.severity}</span>
                  <h3 className="mt-2 font-black">{insight.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{insight.message}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <ScoreChart analysis={analysis} />
          </section>
        </div>

        <section className="mb-10 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 text-2xl font-black">Finans özeti</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <Metric label="Toplam ciro" value={money(selectedFinance.revenue)} />
            <Metric label="Pazaryeri kesintisi" value={money(selectedFinance.marketplace)} />
            <Metric label="Kargo gideri" value={money(selectedFinance.shipping)} />
            <Metric label="İade maliyeti" value={money(selectedFinance.returnCost)} />
            <Metric label="Sabit gider" value={money(selectedFinance.fixed)} />
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Ürün listesi</h2>
              <p className="mt-2 text-gray-500">Seçili mağaza için ürün, yorum, satış, iade ve risk sinyalleri.</p>
            </div>
            <div className="flex gap-2">
              <input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder="Yeni mağaza adı" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950" />
              <button onClick={handleAddStore} className="rounded-xl bg-black px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-black" type="button">Mağaza ekle</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-black uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  <th className="pb-4">Marka / model</th>
                  <th className="pb-4">Yorum</th>
                  <th className="pb-4">Satış</th>
                  <th className="pb-4">Verilen iade</th>
                  <th className="pb-4">İade riski</th>
                  <th className="pb-4">Tahmini kâr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredProducts.map((product) => {
                  const productRevenue = product.price * product.sales_signals.sales;
                  const productShipping = product.sales_signals.sales * (selectedStore?.shipping_fee || 45);
                  const productReturn = product.price * estimatedReturnCount(product) * 0.65;
                  const profit = productRevenue - productShipping - productReturn - productRevenue * (selectedStore?.marketplace_fee_rate || 0.12);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 font-black">{product.brand} · {product.title}</td>
                      <td className="py-4">{product.review_count}</td>
                      <td className="py-4">{product.sales_signals.sales}</td>
                      <td className="py-4">{estimatedReturnCount(product)}</td>
                      <td className="py-4">{productRiskScore(product)}</td>
                      <td className="py-4 font-black text-green-600">{money(profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <form onSubmit={handleUpload} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-2xl font-black">Satıcı ürün yükleme</h2>
            <p className="mt-2 text-sm text-gray-500">Ürün seçili mağazaya eklenir ve mağazada listelenir.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={upload.title} onChange={(event) => setUpload((current) => ({ ...current, title: event.target.value }))} required placeholder="Ürün adı" className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700 dark:bg-gray-950" />
              <input value={upload.brand} onChange={(event) => setUpload((current) => ({ ...current, brand: event.target.value }))} required placeholder="Marka" className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700 dark:bg-gray-950" />
              <input type="number" value={upload.price} onChange={(event) => setUpload((current) => ({ ...current, price: Number(event.target.value) }))} required placeholder="Fiyat" className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700 dark:bg-gray-950" />
              <select value={upload.gender} onChange={(event) => setUpload((current) => ({ ...current, gender: event.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700 dark:bg-gray-950">
                <option value="Women">Kadın</option>
                <option value="Men">Erkek</option>
                <option value="Kids">Çocuk</option>
                <option value="Unisex">Unisex</option>
              </select>
              <select value={upload.shoe_type} onChange={(event) => setUpload((current) => ({ ...current, shoe_type: event.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700 dark:bg-gray-950">
                <option value="sneaker">Spor ayakkabı</option>
                <option value="formal_shoe">Klasik ayakkabı</option>
                <option value="boot">Bot</option>
                <option value="sandal">Sandalet</option>
                <option value="slipper">Terlik</option>
              </select>
              <input type="file" accept="image/*" onChange={handleImage} className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700" />
            </div>
            <textarea value={upload.description} onChange={(event) => setUpload((current) => ({ ...current, description: event.target.value }))} required placeholder="Ürün açıklaması" className="mt-4 min-h-28 w-full rounded-xl border border-gray-200 p-4 font-bold dark:border-gray-700 dark:bg-gray-950" />
            <button className="mt-5 w-full rounded-2xl bg-black px-6 py-4 font-black text-white dark:bg-white dark:text-black" type="submit">Ürünü yükle</button>
          </form>

          <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-2xl font-black">Satıcı profil düzenleme önerileri</h2>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">{risk?.seller_advice || "Ürün seçildiğinde mağaza ve ürün bazlı öneriler burada görünür."}</p>
            {optimization && (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-950">
                  <h3 className="font-black">{optimization.optimized_title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{optimization.optimized_description}</p>
                </div>
                {optimization.trust_messages.map((message) => (
                  <p key={message} className="rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">{message}</p>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-950">
      <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}
