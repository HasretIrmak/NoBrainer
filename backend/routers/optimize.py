from fastapi import APIRouter

from models import OptimizeOut, ProductRequest
from prompts.optimize_prompt import build_optimize_prompt
from services.gemini_service import generate_json
from services.product_service import get_product_by_id
from services.scoring_service import analyze_product_scores


router = APIRouter(
    prefix="/optimize",
    tags=["Optimize"],
)


def build_fallback_optimization(product, scores: dict) -> dict:
    fit_note = ""

    if "runs_small" in product.known_issues or product.fit_type in ["small", "narrow"]:
        fit_note = " Some customers mention a tighter fit, so checking the size guide is recommended."

    optimized_title = f"{product.brand} {product.title} - Daily Sneaker"

    optimized_description = (
        f"{product.title} is a sneaker designed for everyday use, casual styling and practical comfort."
        f"{fit_note} It is supported by customer review signals and is best suited for buyers who want "
        f"a clear balance between style, comfort and daily wear."
    )

    return {
        "optimized_title": optimized_title,
        "optimized_description": optimized_description,
        "faq": [
            {
                "question": "Does this sneaker run true to size?",
                "answer": "Some review signals suggest checking the size guide before buying, especially if you have wide feet."
            },
            {
                "question": "Is it good for daily use?",
                "answer": "Yes, it can be positioned as an everyday sneaker, but comfort expectations should be clearly explained."
            },
            {
                "question": "What should sellers clarify on the product page?",
                "answer": "Sizing guidance, comfort expectations and material details should be clearly visible."
            }
        ],
        "trust_messages": [
            "Sizing guidance added to reduce return risk.",
            "Review-based fit warnings included for buyer confidence.",
            "Product description improved with clearer usage expectations."
        ]
    }


@router.post("/", response_model=OptimizeOut)
def optimize_product(request: ProductRequest):
    product = get_product_by_id(request.product_id)
    scores = analyze_product_scores(product)

    fallback = build_fallback_optimization(product, scores)
    prompt = build_optimize_prompt(product=product, scores=scores)

    ai_result = generate_json(
        prompt=prompt,
        fallback=fallback,
    )

    return {
        "product_id": product.id,
        "optimized_title": ai_result.get("optimized_title", fallback["optimized_title"]),
        "optimized_description": ai_result.get("optimized_description", fallback["optimized_description"]),
        "faq": ai_result.get("faq", fallback["faq"]),
        "trust_messages": ai_result.get("trust_messages", fallback["trust_messages"]),
    }