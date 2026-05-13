import type { ReturnRiskResult, RiskLevel } from "../../lib/types";

const levelStyles: Record<RiskLevel, string> = {
  high: "border-red-500 bg-red-50 text-red-800",
  medium: "border-amber-500 bg-amber-50 text-amber-800",
  low: "border-green-500 bg-green-50 text-green-800",
};

export default function ReturnWarning({ risk }: { risk: ReturnRiskResult | null }) {
  if (!risk || risk.risk_level === "low") {
    return null;
  }

  return (
    <div className={`mb-6 rounded-xl border-l-4 p-4 ${levelStyles[risk.risk_level]}`}>
      <div className="mb-1 flex items-center justify-between gap-4">
        <span className="font-black uppercase tracking-wide">
          {risk.risk_level === "high" ? "Kritik iade uyarisi" : "Iade riski bildirimi"}
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">Skor {risk.risk_score}</span>
      </div>
      <p className="text-sm leading-relaxed">{risk.user_warning}</p>
    </div>
  );
}
