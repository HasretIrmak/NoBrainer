import json

from models import Product


def build_return_prompt(product: Product, scores: dict) -> str:
    reviews_sample = [
        {
            "rating": review.rating,
            "text": review.text,
            "sentiment": review.sentiment,
            "signals": review.signals,
        }
        for review in product.reviews[:10]
    ]

    product_context = {
        "id": product.id,
        "title": product.title,
        "brand": product.brand,
        "rating": product.rating,
        "review_count": product.review_count,
        "known_issues": product.known_issues,
        "fit_type": product.fit_type,
        "return_risk_signals": product.return_risk_signals.model_dump(),
        "scores": scores,
        "reviews_sample": reviews_sample,
    }

    return f"""
Sen bir e-ticaret iade riski analistisin.

Bu sneaker ürününü analiz et ve iade riskini net şekilde açıkla.

Dil kuralları:
- Tüm JSON değerlerini Türkçe yaz.
- Marka/model adları dışında İngilizce cümle kullanma.
- Kullanıcı uyarısı kısa, anlaşılır ve doğal Türkçe olsun.

Odaklan:
- beden uyumsuzluğu
- dar kalıp / taraklı ayak sorunları
- konfor şikayetleri
- malzeme kalitesi
- dayanıklılık
- alıcının beden yönlendirmesine ihtiyaç duyup duymadığı

Product context:
{json.dumps(product_context, ensure_ascii=False, indent=2)}

YALNIZCA geçerli JSON döndür.
Markdown kullanma.
Cevabı kod bloğuna alma.

JSON schema:
{{
  "reasons": [
    "Türkçe neden 1",
    "Türkçe neden 2",
    "Türkçe neden 3"
  ],
  "user_warning": "ürün sayfasında gösterilecek kısa Türkçe uyarı",
  "seller_advice": "satıcının iadeyi azaltması için özel Türkçe öneri"
}}
"""
