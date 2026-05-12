"use client";
import { useState, useEffect } from "react";

interface ScoreCardProps {
  label: string;
  value: number;
  prefix?: string;
}

export default function ScoreCard({ label, value, prefix = "" }: ScoreCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // 1. GÖREV: Sayı Animasyonu (0'dan hedefe 1s içinde)
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000; // 1 saniye
    const increment = end / (duration / 16); // 60fps hesaplaması

    const animate = () => {
      start += increment;
      if (start < end) {
        setDisplayValue(Number(start.toFixed(1)));
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    animate();
  }, [value]);

  // 2. GÖREV: Risk Skoruna göre renk belirleme (FE Cilalama)
  // İade Risk Puanı için özel renk mantığı:
  const getCardStyle = () => {
    if (label.includes("Risk")) {
      if (value > 60) return "border-red-500 bg-red-50";     // Tehlike
      if (value > 30) return "border-yellow-500 bg-yellow-50"; // Uyarı
      return "border-green-500 bg-green-50";                // Güvenli
    }
    return "border-gray-100 bg-white"; // Diğer kartlar için varsayılan
  };

  return (
    <div className={`p-6 rounded-3xl shadow-sm border-2 transition-all duration-500 ${getCardStyle()}`}>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">
        {label}
      </p>
      <h3 className="text-4xl font-black text-gray-900">
        <span className="text-sm font-medium text-gray-400 mr-1">{prefix}</span>
        {displayValue}
      </h3>
    </div>
  );
}