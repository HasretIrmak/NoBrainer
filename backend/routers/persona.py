from fastapi import APIRouter

from models import PersonaContent, PersonaOut, PersonaRequest, Product
from prompts.persona_prompt import build_persona_prompt
from services.gemini_service import generate_json_result
from services.product_service import get_product_by_id


router = APIRouter(
    prefix="/persona",
    tags=["Persona"],
)


PERSONA_CONTENT_CACHE: dict[tuple[str, str], dict] = {}


def get_display_title(product: Product) -> str:
    title = product.title.strip()
    brand = product.brand.strip()

    if not brand or title.lower().startswith(brand.lower()):
        return title

    return f"{brand} {title}"


def fallback_persona_content(product: Product, persona: str) -> dict:
    brand_title = get_display_title(product)

    if persona == "style":
        return {
            "hero_title": f"{brand_title} with a sharper everyday look",
            "hero_description": (
                f"A {product.base_colour.lower() or 'versatile'} {product.shoe_type.replace('_', ' ')} "
                "built for outfits where the shoe needs to carry the look. Best for shoppers who care "
                "about styling, silhouette, and first impression."
            ),
            "features": [
                f"{product.base_colour or 'Versatile'} color styling",
                f"{product.usage} outfit match",
                "Style-first product presentation",
            ],
            "cta": "Style this pair",
        }

    if persona == "comfort":
        fit_note = "regular fit"

        if product.fit_type in ["small", "narrow"]:
            fit_note = "tighter fit, check sizing before buying"
        elif product.fit_type == "large":
            fit_note = "roomier fit, compare with your usual size"

        return {
            "hero_title": f"{brand_title} for daily comfort",
            "hero_description": (
                "A comfort-focused view of this product with sizing and wearability details up front. "
                f"Current fit signal: {fit_note}."
            ),
            "features": [
                "Fit guidance before purchase",
                "Comfort and walking signals highlighted",
                "Review-based sizing context",
            ],
            "cta": "Check the fit",
        }

    value_note = "priced below the category average"

    if product.market_signals.avg_category_price and product.price > product.market_signals.avg_category_price:
        value_note = "priced above the category average, so value should be justified"

    return {
        "hero_title": f"{brand_title} as a smart value pick",
        "hero_description": (
            "A budget-aware view focused on price, rating, and practical daily use. "
            f"This product is {value_note}."
        ),
        "features": [
            f"{product.rating:.1f} rating context",
            "Price-to-value comparison",
            "Practical purchase guidance",
        ],
        "cta": "Compare value",
    }


def normalize_persona_content(raw_content: dict, fallback: dict) -> dict:
    try:
        return PersonaContent.model_validate(raw_content).model_dump()
    except Exception:
        return fallback


@router.post("/", response_model=PersonaOut)
def generate_persona_page(request: PersonaRequest):
    product = get_product_by_id(request.product_id)
    cache_key = (product.id, request.persona)

    if cache_key in PERSONA_CONTENT_CACHE:
        return {
            "product_id": product.id,
            "persona": request.persona,
            "source": "cache",
            "content": PERSONA_CONTENT_CACHE[cache_key],
        }

    fallback = fallback_persona_content(product, request.persona)
    prompt = build_persona_prompt(
        product=product,
        persona_type=request.persona,
        gender=request.gender,
        age_group=request.age_group,
        coupon_sensitive=request.coupon_sensitive,
        fit_sensitive=request.fit_sensitive,
    )

    ai_result, source = generate_json_result(
        prompt=prompt,
        fallback=fallback,
    )

    content = normalize_persona_content(ai_result, fallback)

    if content == fallback and source == "gemini":
        source = "fallback"

    PERSONA_CONTENT_CACHE[cache_key] = content

    return {
        "product_id": product.id,
        "persona": request.persona,
        "source": source,
        "content": content,
    }
