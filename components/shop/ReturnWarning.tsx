"use client";

import { translateTitle } from "../../lib/personalization";
import type { ReturnRiskResult } from "../../lib/types";

export default function ReturnWarning({ risk }: { risk: ReturnRiskResult | null }) {
  if (!risk || risk.risk_level === "low") {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">⚠️</span>
        <div>
          <h4 className="text-sm font-black text-amber-900 dark:text-amber-300 tracking-tight">
            NoBrainer İade Riski Uyarısı
          </h4>
          {/* 🎯 SİHİRLİ ÇEVİRİ MOTORUNA BAĞLANAN ALAN */}
          <p className="mt-1 text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-400">
            {translateTitle(risk.user_warning)}
          </p>
        </div>
      </div>
    </div>
  );
}
