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
You are an e-commerce return risk analyst.

Analyze this sneaker product and explain return risk clearly.

Focus on:
- size mismatch
- narrow fit / wide feet issues
- comfort complaints
- material quality
- durability
- whether the buyer needs sizing guidance

Product context:
{json.dumps(product_context, ensure_ascii=False, indent=2)}

Return ONLY valid JSON.
Do not use markdown.
Do not wrap response in code fences.

JSON schema:
{{
  "reasons": [
    "reason 1",
    "reason 2",
    "reason 3"
  ],
  "user_warning": "short warning shown on product page",
  "seller_advice": "specific advice for seller to reduce returns"
}}
"""