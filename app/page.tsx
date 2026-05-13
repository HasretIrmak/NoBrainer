"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="px-4 py-28 text-center">
        <h1 className="mx-auto mb-6 max-w-5xl text-5xl font-black uppercase tracking-tighter text-gray-900 md:text-7xl">
          Adaptive Commerce AI
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl font-medium leading-relaxed text-gray-500">
          Ayni urunu farkli musteri personasi, iade riski ve satis sinyalleriyle yeniden yorumlayan
          FastAPI + Next.js e-ticaret deneyimi.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/shop" className="rounded-2xl bg-black px-10 py-5 font-bold text-white shadow-xl transition-all hover:scale-105">
            Magazayi incele
          </Link>
          <Link href="/seller" className="rounded-2xl border-2 border-gray-200 px-10 py-5 font-bold transition-all hover:bg-gray-50">
            Satici paneli
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-8 pb-20 md:grid-cols-3">
        <div className="rounded-3xl bg-gray-50 p-8">
          <h3 className="mb-2 text-xl font-bold">Persona icerigi</h3>
          <p className="text-sm text-gray-500">Style, comfort ve budget personasi backend `/persona/` endpointinden beslenir.</p>
        </div>
        <div className="rounded-3xl bg-gray-50 p-8">
          <h3 className="mb-2 text-xl font-bold">Iade tahmini</h3>
          <p className="text-sm text-gray-500">Yorum sinyalleri ve rule engine ile kullaniciya uyari, saticiya aksiyon uretilir.</p>
        </div>
        <div className="rounded-3xl bg-gray-50 p-8">
          <h3 className="mb-2 text-xl font-bold">Satici analizi</h3>
          <p className="text-sm text-gray-500">Skorlar, funnel metrikleri ve AI optimizasyonu tek panelde gorunur.</p>
        </div>
      </section>
    </div>
  );
}
