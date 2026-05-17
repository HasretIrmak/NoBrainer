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
You are an ecommerce review analyst.

Summarize customer reviews for a shoe product.

Product context:
{json.dumps(context, ensure_ascii=False, indent=2)}

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the response in code fences.

JSON schema:
{{
  "short_summary": "2 sentence customer-facing review summary",
  "positive_points": [
    "positive point 1",
    "positive point 2",
    "positive point 3"
  ],
  "negative_points": [
    "negative point 1",
    "negative point 2"
  ],
  "return_risk_reasons": [
    "clear reason why return risk exists or why it is low"
  ]
}}

Only use issues supported by the review sample and score context.
"""
