"use client";
import { useState } from "react";
import ScoreChart from "../../components/ScoreChart"; // Grafik
import ScoreCard from "../../components/ScoreCard";   // Kutu
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
      setStats({ conversion: 22.4, risk: 15, personas: 5 });
      setLoading(false);
    }, 1500); 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      {/* Üst Başlık */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Satıcı Kontrol Paneli</h1>
          <p className="text-gray-500 italic">"Gemini AI ile optimize edilmiş verileriniz."</p>
        </div>
        <button 
          onClick={handleAnalyze}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95"
        >
          {loading ? "Analiz Ediliyor..." : "Verileri Güncelle"}
        </button>
      </div>

      {/* Özet Kartlar (ScoreCard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ScoreCard label="Tahmini Dönüşüm" value={stats.conversion} prefix="%" />
        <ScoreCard label="İade Risk Puanı" value={stats.risk} prefix="Skor: " />
        <ScoreCard label="Aktif Personalar" value={stats.personas} prefix="Grup: " />
      </div>

      {loading && <LoadingSpinner />}

      {/* Alt Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol: Persona Listesi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-50 focus-within:border-blue-400 transition-colors">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">🏃‍♂️ Persona: Hızlı Karar Verici</h4>
            <p className="text-gray-600 text-sm">Hız ve stok durumuna odaklanan kullanıcı grubu.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-50">
            <h4 className="text-lg font-semibold text-purple-900 mb-2">🧐 Persona: Detay Odaklı</h4>
            <p className="text-gray-600 text-sm">Teknik özellik ve yorumları inceleyen kullanıcı grubu.</p>
          </div>
        </div>

        {/* Sağ: Radar Grafiği (ScoreChart) */}
        <div className="lg:col-span-1">
          <ScoreChart /> 
        </div>
      </div>
    </div>
  );
}