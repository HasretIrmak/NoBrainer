from models import Product


def build_persona_prompt(product: Product, persona_type: str) -> str:
    title = product.title
    brand = product.brand
    description = product.description
    price = product.price
    tags = ", ".join(product.tags)
    known_issues = ", ".join(product.known_issues)

    base_info = f"""
Product Title: {title}
Brand: {brand}
Price: {price} {product.currency}
Tags: {tags}
Known Issues: {known_issues}

Description:
{description}
"""

    if persona_type == "style":
        focus = """
Focus on:
- aesthetics
- streetwear compatibility
- outfit matching
- premium look
- style confidence
"""

    elif persona_type == "comfort":
        focus = """
Focus on:
- comfort
- cushioning
- daily wear
- walking experience
- foot support
"""

    elif persona_type == "budget":
        focus = """
Focus on:
- value for money
- practical benefits
- durability expectations
- affordable quality
- smart purchase decision
"""

    else:
        focus = "Focus on general ecommerce conversion."

    return f"""
You are an ecommerce product copywriter.

Create persona-specific content for this sneaker product.

Persona: {persona_type}

{focus}

{base_info}

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the response in code fences.

JSON schema:
{{
  "hero_title": "short persona-specific headline",
  "hero_description": "2 sentence product description for this persona",
  "features": [
    "feature 1",
    "feature 2",
    "feature 3"
  ],
  "cta": "short CTA text"
}}
"""
