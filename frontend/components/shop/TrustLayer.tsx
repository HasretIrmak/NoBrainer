export default function TrustLayer() {
  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
        <span className="text-xl">✅</span>
        <div>
          <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Orijinal Ürün</h4>
          <p className="text-[11px] text-gray-600">Yetkili satıcı garantisiyle 2 yıl boyunca yanınızdayız.</p>
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
        <span className="text-xl">♻️</span>
        <div>
          <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Kolay İade</h4>
          <p className="text-[11px] text-gray-600">30 gün içinde sorgusuz sualsiz ücretsiz iade hakkı.</p>
        </div>
      </div>
    </div>
  );
}