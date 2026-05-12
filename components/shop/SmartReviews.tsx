"use client";

export default function SmartReviews({ persona }: { persona: string }) {
  const allReviews = [
    { id: 1, user: "Mert", rating: 5, text: "Görünüşü efsane, tam bir ikon!", tag: "style" },
    { id: 2, user: "Selin", rating: 4, text: "Bütün gün ayağımdaydı, hiç yormadı.", tag: "comfort" },
    { id: 3, user: "Can", rating: 5, text: "Fiyat/performans olarak daha iyisi yok.", tag: "budget" },
    { id: 4, user: "Ece", rating: 5, text: "Rengi fotoğraftakinden daha canlı.", tag: "style" },
  ];

  // Seçilen personaya uygun yorumları en başa çekiyoruz
  const sortedReviews = [...allReviews].sort((a, b) => (a.tag === persona ? -1 : 1));

  return (
    <div className="mt-10 border-t pt-8">
      <h3 className="text-xl font-bold mb-6">Kullanıcı Yorumları</h3>
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <div key={review.id} className={`p-4 rounded-xl border transition-all ${review.tag === persona ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
            <div className="flex justify-between mb-2">
              <span className="font-bold text-sm">{review.user}</span>
              <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
            {review.tag === persona && (
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full mt-2 inline-block">
                Sizin için önerilen yorum
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}