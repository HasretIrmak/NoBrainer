import json

from models import Product


def build_optimize_prompt(product: Product, scores: dict) -> str:
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
        "price": product.price,
        "currency": product.currency,
        "rating": product.rating,
        "review_count": product.review_count,
        "description": product.description,
        "tags": product.tags,
        "known_issues": product.known_issues,
        "fit_type": product.fit_type,
        "scores": scores,
        "reviews_sample": reviews_sample,
    }

    return f"""
Sen uzman bir e-ticaret ürün sayfası optimizasyon danışmanısın.

Bu sneaker ürün sayfasını daha iyi dönüşüm için yeniden yaz ve iyileştir.

Dil kuralları:
- Tüm JSON değerlerini Türkçe yaz.
- Marka ve model adlarını koru, ama açıklama, soru, cevap ve güven mesajlarını Türkçe üret.
- İngilizce başlık veya İngilizce pazarlama cümlesi yazma.

Ürün verilerini, yorumları, bilinen sorunları ve skorları kullan.

Önemli:
- Gerçek riskleri saklama.
- Beden veya konfor sorunu varsa açıkça belirt.
- Alıcı güvenini artır.
- Başlığı daha net ve Türkçe hale getir.
- Açıklamayı daha faydalı yap.
- Satın alma tereddüdünü azaltacak SSS maddeleri ekle.
- Satıcı sayfası için güven mesajları ekle.

Product context:
{json.dumps(product_context, ensure_ascii=False, indent=2)}

YALNIZCA geçerli JSON döndür.
Markdown kullanma.
Cevabı kod bloğuna alma.

JSON schema:
{{
  "optimized_title": "Türkçe optimize ürün başlığı",
  "optimized_description": "Türkçe optimize ürün açıklaması",
  "faq": [
    {{
      "question": "Türkçe soru",
      "answer": "Türkçe cevap"
    }}
  ],
  "trust_messages": [
    "Türkçe güven mesajı 1",
    "Türkçe güven mesajı 2",
    "Türkçe güven mesajı 3"
  ]
}}
"""
