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
You are an expert ecommerce product page optimizer.

Rewrite and improve this sneaker product page for better conversion.

Use the product data, reviews, known issues and scores.

Important:
- Do not hide real risks.
- If there is a sizing or comfort issue, address it clearly.
- Improve buyer trust.
- Make the title more specific.
- Make the description more useful.
- Add FAQ items that reduce purchase hesitation.
- Add trust messages for the seller page.

Product context:
{json.dumps(product_context, ensure_ascii=False, indent=2)}

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the response in code fences.

JSON schema:
{{
  "optimized_title": "optimized product title",
  "optimized_description": "optimized product description",
  "faq": [
    {{
      "question": "question",
      "answer": "answer"
    }}
  ],
  "trust_messages": [
    "trust message 1",
    "trust message 2",
    "trust message 3"
  ]
}}
"""