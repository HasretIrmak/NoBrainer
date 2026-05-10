"use client";
import { useState } from "react";
import ScoreChart from "../../components/ScoreChart";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function SellerDashboard() {
  const [loading, setLoading] = useState(false);

  // Analiz butonuna basınca spinner'ı test etmek için fonksiyon
  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000); // 2 saniye sonra kapatır
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      {/* Üst Başlık Alanı */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Satıcı Kontrol Paneli</h1>
          <p className="text-gray-500 italic">"Gemini AI ile optimize edilmiş verileriniz."</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
            Bugün: 10 Mayıs 2026
          </div>
          {/* Ürün Seçimi ve Analiz Butonu */}
          <div className="flex gap-2">
            <select className="border rounded-lg px-3 py-2 text-sm bg-white">
              <option>Nike Air Max Pro</option>
              <option>Adidas Ultraboost</option>
            </select>
            <button 
              onClick={handleAnalyze}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              Analiz Et
            </button>
          </div>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Tahmini Dönüşüm Oranı</h3>
          <p className="text-2xl font-bold">%18.5</p>
          <span className="text-green-500 text-xs">↑ Geçen haftadan %2 fazla</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">Yapay Zeka İade Risk Skoru</h3>
          <p className="text-2xl font-bold">Düşük</p>
          <span className="text-gray-400 text-xs">12 ürün için analiz yapıldı</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Aktif Persona Sayısı</h3>
          <p className="text-2xl font-bold">4 Farklı Grup</p>
          <span className="text-purple-400 text-xs">Dinamik içerik aktif</span>
        </div>
      </div>

      {/* Spinner Alanı - Loading durumunda görünür */}
      {loading && (
        <div className="mb-8 bg-white rounded-2xl shadow-inner border border-dashed border-blue-200">
          <LoadingSpinner />
        </div>
      )}

      {/* Grafik ve AI Analiz Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol Taraf: AI Personaları (2 kolon kaplar) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">🏃‍♂️</div>
              <h4 className="text-lg font-semibold">Persona: Hızlı Karar Verici</h4>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              "Gemini Analizi: Bu kullanıcı grubu hızlı teslimat ve garanti seçeneklerine odaklanıyor."
            </p>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-xs font-bold uppercase">Yapay Zeka Tavsiyesi:</p>
              <p className="text-blue-700 text-sm">Hemen Teslim vurgusunu artır.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">🧐</div>
              <h4 className="text-lg font-semibold">Persona: Detay Odaklı Araştırmacı</h4>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              "Gemini Analizi: Kullanıcı tüm ürün yorumlarını okuyor ve teknik detay istiyor."
            </p>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-purple-800 text-xs font-bold uppercase">Yapay Zeka Tavsiyesi:</p>
              <p className="text-purple-700 text-sm">Teknik özellik tablosu ekle.</p>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Performans Grafiği (1 kolon kaplar) */}
        <div className="lg:col-span-1">
          <ScoreChart />
        </div>

      </div>
    </div>
  );
}