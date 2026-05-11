"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Animasyon kütüphanesi

export default function ProductDetailPage() {
  const [persona, setPersona] = useState<'default' | 'fast' | 'detail'>('default');

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Persona Switcher */}
        <div className="mb-12 flex justify-center gap-4 bg-gray-50 p-2 rounded-2xl w-fit mx-auto shadow-inner">
          <button 
            onClick={() => setPersona('fast')} 
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${persona === 'fast' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            🏃‍♂️ Hızlı Alıcı
          </button>
          <button 
            onClick={() => setPersona('detail')} 
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${persona === 'detail' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            🧐 Detaycı Alıcı
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-square bg-gray-100 rounded-[3rem] flex items-center justify-center text-9xl shadow-inner">👟</div>
          
          <div>
            <h1 className="text-4xl font-black mb-6 tracking-tight text-gray-900">Nike Air Max Pro</h1>
            
            {/* Animasyonlu İçerik Alanı */}
            <div className="min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={persona} // Persona değiştikçe animasyonu tetikler
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {persona === 'fast' ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                        <p className="text-green-800 font-bold">Stokta Son 3 Adet! 🔥</p>
                        <p className="text-green-700 text-sm">Bugün alırsan yarın kapında.</p>
                      </div>
                      <p className="text-gray-600">En hızlı teslimat garantili ürünümüz.</p>
                    </div>
                  ) : persona === 'detail' ? (
                    <div className="space-y-4 text-gray-600">
                      <p className="font-bold text-gray-900 text-lg">Teknik Özellikler</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-gray-50 p-3 rounded-lg font-mono">TABAN: Air-Cushion</div>
                        <div className="bg-gray-50 p-3 rounded-lg font-mono">AĞIRLIK: 240gr</div>
                        <div className="bg-gray-50 p-3 rounded-lg font-mono">MATERYAL: Geri Dönüşüm</div>
                        <div className="bg-gray-50 p-3 rounded-lg font-mono">GARANTİ: 2 Yıl</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 leading-relaxed italic text-lg text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl">
                      Kullanıcı tipini seçerek yapay zeka analizini gör...
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <button className="w-full mt-8 bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
              Sepete Ekle - 4.299 TL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}