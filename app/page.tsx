"use client";
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Bölümü */}
      <div className="text-center py-32 px-4">
        <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-6 uppercase">
          HERKES İÇİN <span className="text-blue-600">AYNI</span>,<br />
          DENEYİMDE <span className="text-purple-600">EŞSİZ</span>.
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 font-medium leading-relaxed mb-10">
          "Aynı sneaker, 3 farklı insan, 3 farklı deneyim." <br /> 
          Gemini AI ile kişiselleştirilmiş, iade riskini minimize eden yeni nesil e-ticaret analizi.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/shop" className="bg-black text-white px-10 py-5 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl">
            Mağazayı İncele
          </Link>
          <Link href="/seller" className="border-2 border-gray-200 px-10 py-5 rounded-2xl font-bold hover:bg-gray-50 transition-all">
            Satıcı Paneli
          </Link>
        </div>
      </div>

      {/* Küçük bir özellikler alanı (Demo için doluluk sağlar) */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-20 px-8">
        <div className="p-8 bg-gray-50 rounded-3xl">
          <div className="text-3xl mb-4">🎯</div>
          <h3 className="font-bold text-xl mb-2">Persona Analizi</h3>
          <p className="text-gray-500 text-sm">Müşterilerinizi segmentlere ayırın, onlara özel içerik sunun.</p>
        </div>
        <div className="p-8 bg-gray-50 rounded-3xl">
          <div className="text-3xl mb-4">📉</div>
          <h3 className="font-bold text-xl mb-2">İade Tahmini</h3>
          <p className="text-gray-500 text-sm">Yapay zeka ile iade risklerini ürün bazında önceden görün.</p>
        </div>
        <div className="p-8 bg-gray-50 rounded-3xl">
          <div className="text-3xl mb-4">🚀</div>
          <h3 className="font-bold text-xl mb-2">Hızlı Entegrasyon</h3>
          <p className="text-gray-500 text-sm">Hasret'in backend gücüyle saniyeler içinde analiz sonuçları.</p>
        </div>
      </div>
    </div>
  );
}