"use client";
import { useState } from "react";
import ScoreChart from "../../components/ScoreChart"; 
import ScoreCard from "../../components/ScoreCard";   
import LoadingSpinner from "../../components/LoadingSpinner";

export default function SellerDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    conversion: 18.5,
    risk: 30,
    personas: 4
  });

  const handleAnalyze = async () => {
    setLoading(true);
    setTimeout(() => {
      setStats({ conversion: 22.4, risk: 78.5, personas: 5 });
      setLoading(false);
    }, 1500); 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-12 text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Üst Başlık & Aksiyon */}
        <div className="mb-12 flex justify-between items-end border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">
              Satıcı Kontrol Paneli
            </h1>
            <p className="text-gray-500 font-medium mt-2">
              Gemini AI • <span className="text-blue-600">Ürün Performans ve İade Analizi</span>
            </p>
          </div>
          <button 
            onClick={handleAnalyze}
            className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all active:scale-95 flex items-center gap-2"
          >
            {loading ? "Zeka Analiz Ediyor..." : "⚡ Verileri Güncelle"}
          </button>
        </div>

        {/* Üst Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <ScoreCard label="Tahmini Dönüşüm" value={stats.conversion} prefix="%" />
          <ScoreCard label="İade Risk Puanı" value={stats.risk} prefix="Skor: " />
          <ScoreCard label="Aktif Personalar" value={stats.personas} prefix="Grup: " />
        </div>

        {loading && <LoadingSpinner />}

        {/* Ana Panel: Analiz & Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Müşteri Segment Analizi</h2>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 hover:border-blue-200 transition-colors">
              <h4 className="text-xl font-black text-blue-900 mb-3">🏃‍♂️ Persona: Hızlı Karar Verici</h4>
              <p className="text-gray-600 leading-relaxed">
                Stok durumuna ve kargo hızına odaklanan kullanıcı grubu. Satın alma kararı ortalama 45 saniye.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-purple-50 hover:border-purple-200 transition-colors">
              <h4 className="text-xl font-black text-purple-900 mb-3">🧐 Persona: Detay Odaklı</h4>
              <p className="text-gray-600 leading-relaxed">
                Teknik özellik ve kullanıcı yorumlarını derinlemesine inceleyen grup. İade oranları en düşük segment.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">
               Ürün Yetkinlik Matrisi
             </h3>
             <ScoreChart /> 
          </div>
        </div>

        {/* KRİTİK ALARM */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
            ⚠️ Kritik İade Alarmları
          </h2>
          <div className="bg-white border-2 border-red-100 p-10 rounded-[3rem] flex flex-col lg:flex-row justify-between items-center gap-8 shadow-sm">
            <div className="flex items-center gap-8">
              <div className="text-7xl bg-red-50 p-8 rounded-[2rem] shadow-inner">👟</div>
              <div>
                <h3 className="text-3xl font-black text-gray-900">Kids Ivy Running Sports Shoes</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                    İade Riski: %84.2
                  </span>
                </div>
                <p className="text-gray-600 text-lg mt-4 leading-relaxed max-w-xl">
                  <strong className="text-red-600">AI Tespiti:</strong> "Kalıp dar" geri bildirimi bu ay %40 arttı. 
                  Ürün açıklamasında "1 numara büyük alın" uyarısı eksik.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <button className="bg-black text-white px-10 py-5 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl">
                AI İle Açıklamayı Düzelt
              </button>
            </div>
          </div>
        </div>

        {/* ANALİZ GEÇMİŞİ */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-2xl font-black mb-8 text-gray-900 tracking-tight">Ürün Analiz Geçmişi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="pb-6 font-bold">Tarih</th>
                  <th className="pb-6 font-bold">Ürün İsmi</th>
                  <th className="pb-6 font-bold text-center">Tahmini Risk</th>
                  <th className="pb-6 font-bold text-right">Durum Analizi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { date: "12 Mayıs", name: "Nike Air Max Pro", risk: "%12", status: "Güvenli" },
                  { date: "11 Mayıs", name: "Kids Ivy Running", risk: "%84", status: "Kritik" },
                  { date: "10 Mayıs", name: "Lite 3.0 Runner", risk: "%32", status: "Orta" },
                ].map((item, i) => (
                  <tr key={i} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-6 text-gray-500 font-medium">{item.date}</td>
                    <td className="py-6 font-black text-gray-900 text-lg">{item.name}</td>
                    <td className="py-6 text-center font-mono font-bold text-xl text-blue-600">{item.risk}</td>
                    <td className="py-6 text-right">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                        item.status === "Kritik" ? "bg-red-100 text-red-600" : 
                        item.status === "Orta" ? "bg-yellow-100 text-yellow-600" : 
                        "bg-green-100 text-green-600"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}