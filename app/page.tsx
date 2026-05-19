"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl flex-col justify-center px-6 py-16">
        <div className="max-w-4xl">
          <span className="mb-5 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            Kişiselleştirilmiş alışveriş ve satıcı zekası
          </span>
          <h1 className="text-5xl font-black leading-none tracking-tight md:text-7xl">
            NoBrainer
          </h1>
          <p className="mt-7 max-w-3xl text-xl font-medium leading-relaxed text-gray-600 dark:text-gray-300">
            Kullanıcı profiline göre ürünleri sıralayan, yorumlardan iade riskini açıklayan ve satıcılara mağaza bazlı satış, kâr ve ürün düzenleme önerileri sunan akıllı ticaret platformu.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Feature title="Kullanıcı deneyimi" text="Profil, persona, favori, sepet, kupon ve iade kodu tek akışta çalışır." />
          <Feature title="Satıcı paneli" text="Mağaza seçimi, ürün yükleme, ciro, gider, kargo ve kâr marjı görünür." />
          <Feature title="NoBrainer içgörüleri" text="Yorum özeti, olumlu/olumsuz noktalar ve iade riski nedenleri açıklanır." />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-2xl bg-black px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-black">
            Giriş yap veya kayıt ol
          </Link>
          <Link href="/shop" className="rounded-2xl border border-gray-200 px-8 py-4 font-black text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900">
            Mağazayı keşfet
          </Link>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  );
}
