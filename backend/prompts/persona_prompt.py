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

Return a concise product page section with:
1. hero_title
2. hero_description
3. 3 feature bullets
4. CTA text
"""