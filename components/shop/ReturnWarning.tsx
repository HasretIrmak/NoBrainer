export default function ReturnWarning({ riskLevel }: { riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  if (riskLevel === 'LOW') return null; // Düşük riskte göstermiyoruz

  return (
    <div className={`p-4 rounded-xl mb-6 border-l-4 ${riskLevel === 'HIGH' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-amber-50 border-amber-500 text-amber-700'}`}>
      <div className="flex items-center gap-2 font-bold mb-1">
        <span>⚠️ {riskLevel === 'HIGH' ? 'Kritik Uyarı' : 'Bilgilendirme'}</span>
      </div>
      <p className="text-sm">
        {riskLevel === 'HIGH' 
          ? "Bu ürünün kalıp yapısı dardır. %85 kullanıcı 1 numara büyük tercih ediyor." 
          : "Numara konusunda kararsızsanız ürün yorumlarını incelemenizi öneririz."}
      </p>
    </div>
  );
}