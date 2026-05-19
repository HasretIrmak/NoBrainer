import json

from models import Product


def build_conversion_prompt(product: Product, scores: dict) -> str:
    reviews_sample = [
        {
            "rating": review.rating,
            "text": review.text,
            "sentiment": review.sentiment,
            "signals": review.signals,
        }
        for review in product.reviews[:8]
    ]

    product_context = {
        "id": product.id,
        "title": product.title,
        "brand": product.brand,
        "price": product.price,
        "rating": product.rating,
        "review_count": product.review_count,
        "description": product.description,
        "tags": product.tags,
        "known_issues": product.known_issues,
        "fit_type": product.fit_type,
        "sales_signals": product.sales_signals.model_dump(),
        "visual_signals": product.visual_signals.model_dump(),
        "market_signals": product.market_signals.model_dump(),
        "scores": scores,
        "funnel": scores.get("funnel", {}),
        "conversion_diagnosis": scores.get("conversion_diagnosis", ""),
        "reviews_sample": reviews_sample,
    }

    return f"""
Sen uzman bir e-ticaret dönüşüm analistisin.

Bu sneaker ürün sayfasını satıcı tarafındaki dönüşüm zayıflıkları açısından analiz et.

Dil kuralları:
- Tüm JSON değerlerini Türkçe yaz.
- Marka, model, teknik etiket ve ürün adı dışında İngilizce cümle kullanma.
- Kullanıcıya görünen metinler doğal, akıcı ve kısa Türkçe olmalı.

Odaklan:
- başlık netliği
- ürün açıklaması kalitesi
- satış hunisi kırılımı
- fiyat rekabetçiliği
- görsel sunum sorunları
- güven problemleri
- beden / kalıp riski
- konfor şikayetleri
- malzeme veya dayanıklılık endişeleri
- satın alma güvenini azaltan eksik bilgiler

Product context:
{json.dumps(product_context, ensure_ascii=False, indent=2)}

YALNIZCA geçerli JSON döndür.
Markdown kullanma.
Cevabı kod bloğuna alma.

JSON schema:
{{
  "conversion_diagnosis": "ürünün nerede kullanıcı kaybettiğini açıklayan kısa Türkçe satıcı yorumu",
  "insights": [
    {{
      "type": "warning | positive | suggestion",
      "title": "kısa Türkçe içgörü başlığı",
      "message": "satıcıya dönük net Türkçe açıklama",
      "severity": "low | medium | high"
    }}
  ],
  "recommended_actions": [
    "Türkçe aksiyon 1",
    "Türkçe aksiyon 2",
    "Türkçe aksiyon 3",
    "Türkçe aksiyon 4"
  ]
}}

Önerileri kural tabanlı teşhisle uyumlu tut ve ürün bağlamında desteklenmeyen sorun uydurma.
"""
