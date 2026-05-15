"use client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Dönüşüm', A: 120, fullMark: 150 },
  { subject: 'Güven', A: 98, fullMark: 150 },
  { subject: 'Görsellik', A: 86, fullMark: 150 },
  { subject: 'İade Riski', A: 30, fullMark: 150 },
  { subject: 'Fiyat', A: 110, fullMark: 150 },
];

export default function ScoreChart() {
  return (
    <div className="h-[350px] w-full bg-white p-6 rounded-2xl shadow-md border border-gray-100">
      <h4 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-tight">Ürün Performans Analizi</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Radar
            name="Ürün"
            dataKey="A"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}