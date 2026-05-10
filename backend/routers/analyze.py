from fastapi import APIRouter

from models import AnalysisOut, ProductRequest
from prompts.conversion_prompt import build_conversion_prompt
from services.gemini_service import generate_json
from services.product_service import get_product_by_id
from services.scoring_service import analyze_product_scores


router = APIRouter(
    prefix="/analyze",
    tags=["Analyze"],
)


@router.post("/")
def analyze_product(request: ProductRequest):
    product = get_product_by_id(request.product_id)

    scores = analyze_product_scores(product)

    prompt = build_conversion_prompt(
        product=product,
        scores=scores,
    )

    ai_result = generate_json(
        prompt=prompt,
        fallback={
            "insights": scores["insights"],
            "recommended_actions": [],
        },
    )

    return {
        "product_id": product.id,
        **scores,
        "ai_analysis": ai_result,
    }