"use client";
import { useState, useEffect } from 'react';
import PersonaSwitch from "../../../components/shop/PersonaSwitch";
import ReturnWarning from "../../../components/shop/ReturnWarning";
import SmartReviews from "../../../components/shop/SmartReviews";
import TrustLayer from "../../../components/shop/TrustLayer";

// Not: Yarın backend bağlandığında 'fetchProductById' fonksiyonunu buradan çağıracağız.

export default function ProductDetailPage() {
  const [persona, setPersona] = useState('style');
  
  // Hasret'in JSON formatına %100 uyumlu hale getirilmiş başlangıç verisi
  const [product, setProduct] = useState({
    title: "Kids Ivy Running Sports Shoes", 
    price: 1299.0,
    currency: "TRY",
    description: "Kids Ivy Running Sports Shoes",
    return_risk_signals: { 
      runs_small_mentions: 4 // Hasret'ten gelen 'dar kalıp' uyarısı sayısı
    },
    tags: ["comfort", "daily", "sporty", "style"]
  });

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Sol: Ürün Görseli */}
          <div className="aspect-square bg-gray-50 rounded-[3rem] flex items-center justify-center text-9xl sticky top-8 border border-gray-100">
            👟
          </div>

          {/* Sağ: İçerik */}
          <div>
            <PersonaSwitch current={persona} setPersona={setPersona} />
            
            {/* Ürün Başlığı */}
            <h1 className="text-5xl font-black mb-4 text-gray-900">{product.title}</h1>
            
            {/* Fiyat Bilgisi */}
            <p className="text-2xl text-blue-600 font-bold mb-8">
              {product.price} {product.currency}
            </p>

            {/* İADE RİSKİ MANTIĞI: 
                Hasret'in JSON'ındaki runs_small_mentions 2'den büyükse uyarıyı tetikler */}
            <ReturnWarning 
              riskLevel={product.return_risk_signals.runs_small_mentions > 2 ? 'HIGH' : 'LOW'} 
            />

            {/* Persona Bazlı Dinamik Açıklama */}
            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              {persona === 'style' && "Sokak modasının zirvesi. Her kombinle mükemmel uyum sağlayan ikonik tasarım."}
              {persona === 'comfort' && "Özel taban teknolojisi ile bulutların üzerinde yürüyormuşsunuz gibi hissettirir."}
              {persona === 'budget' && "Yüksek kalite, erişilebilir fiyat. En dayanıklı modelimizle uzun yıllar beraberiz."}
            </p>

            <button className="w-full bg-black text-white py-6 rounded-3xl font-bold text-xl hover:scale-[1.01] transition-transform shadow-xl active:scale-95">
              Sepete Ekle
            </button>

            {/* Güven ve Yorum Bileşenleri */}
            <TrustLayer />
            <SmartReviews persona={persona} />
          </div>

        </div>
      </div>
    </div>
  );
}