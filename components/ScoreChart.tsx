"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { AnalysisResult } from "../lib/types";

const fallbackData = [
  { subject: "Donusum", value: 0, fullMark: 100 },
  { subject: "Guven", value: 0, fullMark: 100 },
  { subject: "Gorsel", value: 0, fullMark: 100 },
  { subject: "Satis", value: 0, fullMark: 100 },
  { subject: "Fiyat", value: 0, fullMark: 100 },
];

export default function ScoreChart({ analysis }: { analysis: AnalysisResult | null }) {
  const data = analysis
    ? [
        { subject: "Donusum", value: analysis.overall_conversion_score, fullMark: 100 },
        { subject: "Guven", value: analysis.trust_score, fullMark: 100 },
        { subject: "Gorsel", value: analysis.visual_score, fullMark: 100 },
        { subject: "Satis", value: analysis.sales_health_score, fullMark: 100 },
        { subject: "Fiyat", value: analysis.price_competitiveness_score, fullMark: 100 },
      ]
    : fallbackData;

  return (
    <div className="h-[350px] w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
      <h4 className="mb-6 text-sm font-bold uppercase tracking-tight text-gray-700">Urun performans analizi</h4>
      <ResponsiveContainer width="100%" height="88%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 11 }} />
          <Radar name="Urun" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.45} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
