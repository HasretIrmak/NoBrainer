"use client";

import type { Persona, Review } from "../../lib/types";

const personaSignals: Record<Persona, string[]> = {
  style: ["color_mismatch"],
  comfort: ["runs_small", "runs_large", "narrow_fit", "wide_feet_issue", "comfort_negative"],
  budget: ["cheap_material", "low_durability"],
};

function scoreReview(review: Review, persona: Persona) {
  const matchingSignals = personaSignals[persona];
  const signalScore = review.signals.some((signal) => matchingSignals.includes(signal)) ? 2 : 0;
  const sentimentScore = review.sentiment === "positive" ? 1 : 0;
  return signalScore + sentimentScore + review.rating / 5;
}

export default function SmartReviews({
  persona,
  reviews,
}: {
  persona: Persona;
  reviews: Review[];
}) {
  const visibleReviews = [...reviews]
    .sort((a, b) => scoreReview(b, persona) - scoreReview(a, persona))
    .slice(0, 4);

  if (!visibleReviews.length) {
    return null;
  }

  return (
    <div className="mt-10 border-t border-gray-100 pt-8">
      <h3 className="mb-6 text-xl font-bold text-gray-900">Akilli yorum siralamasi</h3>
      <div className="space-y-4">
        {visibleReviews.map((review, index) => {
          const isRelevant = scoreReview(review, persona) >= 2;

          return (
            <div
              key={`${review.text.slice(0, 24)}-${index}`}
              className={`rounded-xl border p-4 transition-all ${
                isRelevant ? "border-blue-200 bg-blue-50/40" : "border-gray-100 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">
                  {review.sentiment === "negative" ? "Risk sinyali" : "Musteri yorumu"}
                </span>
                <span className="text-sm font-black text-amber-600">{review.rating.toFixed(1)}</span>
              </div>
              <p className="line-clamp-4 text-sm leading-relaxed text-gray-600">{review.text}</p>
              {isRelevant && (
                <span className="mt-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                  Secilen personaya uygun
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
