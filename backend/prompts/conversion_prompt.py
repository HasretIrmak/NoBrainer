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
You are an expert e-commerce conversion analyst.

Analyze this sneaker product page for seller-side conversion weaknesses.

Focus on:
- title clarity
- product description quality
- sales funnel drop-off
- price competitiveness
- visual presentation issues
- trust problems
- sizing / fit risk
- comfort complaints
- material or durability concerns
- missing information that may reduce purchase confidence

Product context:
{json.dumps(product_context, ensure_ascii=False, indent=2)}

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the response in code fences.

JSON schema:
{{
  "conversion_diagnosis": "one concise seller-facing explanation of why this product is not selling or where it loses users",
  "insights": [
    {{
      "type": "warning | positive | suggestion",
      "title": "short insight title",
      "message": "clear seller-facing explanation",
      "severity": "low | medium | high"
    }}
  ],
  "recommended_actions": [
    "action 1",
    "action 2",
    "action 3",
    "action 4"
  ]
}}

Keep recommendations aligned with the rule-based diagnosis and do not invent issues that are not supported by the product context.
"""
