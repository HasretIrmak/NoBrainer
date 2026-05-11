"use client";
import { useState } from 'react';

// Üç kez geriye (../../../) giderek ana dizine, oradan components'e giriyoruz
import PersonaSwitch from "../../../components/shop/PersonaSwitch";
import ReturnWarning from "../../../components/shop/ReturnWarning";
import SmartReviews from "../../../components/shop/SmartReviews";
import TrustLayer from "../../../components/shop/TrustLayer";

export default function ProductDetailPage() {
  const [persona, setPersona] = useState('style');

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Sol: Ürün Görseli */}
          <div className="aspect-square bg-gray-100 rounded-[3rem] flex items-center justify-center text-9xl sticky top-8">
            👟
          </div>

          {/* Sağ: İçerik */}
          <div>
            <PersonaSwitch current={persona} setPersona={setPersona} />
            
            <h1 className="text-5xl font-black mb-4">Nike Air Max Pro</h1>
            <p className="text-2xl text-blue-600 font-bold mb-8">4.299 TL</p>

            {/* Persona'ya göre değişen uyarı */}
            <ReturnWarning riskLevel={persona === 'budget' ? 'MEDIUM' : 'LOW'} />

            <p className="text-gray-600 leading-relaxed mb-8">
              {persona === 'style' && "Sokak modasının zirvesi. Her kombinle mükemmel uyum sağlayan ikonik tasarım."}
              {persona === 'comfort' && "Özel taban teknolojisi ile bulutların üzerinde yürüyormuşsunuz gibi hissettirir."}
              {persona === 'budget' && "Yüksek kalite, erişilebilir fiyat. En dayanıklı modelimizle uzun yıllar beraberiz."}
            </p>

            <button className="w-full bg-black text-white py-6 rounded-3xl font-bold text-xl hover:scale-[1.01] transition-transform shadow-2xl">
              Sepete Ekle
            </button>

            <TrustLayer />
            <SmartReviews persona={persona} />
          </div>

        </div>
      </div>
    </div>
  );
}