"use client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Dönüşüm', A: 120, fullMark: 150 },
  { subject: 'Güven', A: 98, fullMark: 150 },
  { subject: 'Görsellik', A: 86, fullMark: 150 },
  { subject: 'İade Riski', A: 30, fullMark: 150 }, // Düşük olması iyi
  { subject: 'Fiyat Dengesi', A: 110, fullMark: 150 },
];

export default function ScoreChart() {
  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase">Ürün Performans Analizi</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
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