from fastapi import APIRouter

from models import ProductRequest
from prompts.persona_prompt import build_persona_prompt
from services.gemini_service import ask_gemini
from services.product_service import get_product_by_id


router = APIRouter(
    prefix="/persona",
    tags=["Persona"]
)


def fallback_persona_content(product, persona: str) -> dict:
    if persona == "style":
        return {
            "success": True,
            "content": {
                "hero_title": f"Style-ready {product.brand} sneakers",
                "hero_description": "A sneaker designed to complete casual outfits with a clean, everyday look.",
                "features": ["Easy to style", "Casual outfit match", "Streetwear-friendly design"],
                "cta": "Shop the look"
            }
        }

    if persona == "comfort":
        return {
            "success": True,
            "content": {
                "hero_title": "Built for everyday comfort",
                "hero_description": "A daily sneaker focused on walking, comfort and practical wear.",
                "features": ["Daily wear comfort", "Walking-friendly feel", "Supportive fit guidance"],
                "cta": "Choose comfort"
            }
        }

    return {
        "success": True,
        "content": {
            "hero_title": "Smart value for daily wear",
            "hero_description": "A practical sneaker option for buyers looking for everyday use and value.",
            "features": ["Value-focused choice", "Practical daily use", "Budget-conscious pick"],
            "cta": "Get the best value"
        }
    }


@router.post("/")
def generate_persona_page(data: ProductRequest):
    product = get_product_by_id(data.product_id)

    personas = ["style", "comfort", "budget"]
    results = {}

    for persona in personas:
        prompt = build_persona_prompt(product, persona)
        ai_response = ask_gemini(prompt)

        if ai_response.startswith("Gemini hata verdi"):
            results[persona] = fallback_persona_content(product, persona)
        else:
            results[persona] = {
                "success": True,
                "content": ai_response
            }

    return {
        "product_id": data.product_id,
        "personas": results
    }