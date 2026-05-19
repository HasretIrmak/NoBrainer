import json

from models import Product


def build_review_summary_prompt(product: Product, scores: dict) -> str:
    reviews_sample = [
        {
            "rating": review.rating,
            "text": review.text,
            "sentiment": review.sentiment,
            "signals": review.signals,
        }
        for review in product.reviews[:18]
    ]

    context = {
        "id": product.id,
        "title": product.title,
        "brand": product.brand,
        "rating": product.rating,
        "review_count": product.review_count,
        "known_issues": product.known_issues,
        "fit_type": product.fit_type,
        "return_risk_score": scores["return_risk_score"],
        "risk_level": scores["risk_level"],
        "reviews_sample": reviews_sample,
    }

    return f"""
Sen bir e-ticaret yorum analistisin.

Bir ayakkabı ürünü için müşteri yorumlarını özetle.

Dil kuralları:
- Tüm JSON değerlerini Türkçe yaz.
- Marka/model adları dışında İngilizce cümle kullanma.
- Müşteriye gösterilecek kısa, açık ve doğal Türkçe kullan.

Product context:
{json.dumps(context, ensure_ascii=False, indent=2)}

YALNIZCA geçerli JSON döndür.
Markdown kullanma.
Cevabı kod bloğuna alma.

JSON schema:
{{
  "short_summary": "müşteriye dönük 2 cümlelik Türkçe yorum özeti",
  "positive_points": [
    "Türkçe olumlu nokta 1",
    "Türkçe olumlu nokta 2",
    "Türkçe olumlu nokta 3"
  ],
  "negative_points": [
    "Türkçe olumsuz nokta 1",
    "Türkçe olumsuz nokta 2"
  ],
  "return_risk_reasons": [
    "iade riskinin neden var olduğunu veya neden düşük olduğunu açıklayan Türkçe neden"
  ]
}}

Yalnızca yorum örnekleri ve skor bağlamıyla desteklenen sorunları kullan.
"""
