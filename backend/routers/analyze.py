from fastapi import APIRouter

from models import AnalysisOut, ProductRequest
from prompts.conversion_prompt import build_conversion_prompt
from services.gemini_service import generate_json_result
from services.product_service import get_product_by_id
from services.scoring_service import analyze_product_scores


router = APIRouter(
    prefix="/analyze",
    tags=["Analyze"],
)


def normalize_insights(raw_insights: list, fallback_insights: list[dict]) -> list[dict]:
    normalized = []

    for item in raw_insights:
        if not isinstance(item, dict):
            continue

        title = item.get("title")
        message = item.get("message")

        if not title or not message:
            continue

        normalized.append({
            "type": item.get("type", "suggestion"),
            "title": str(title),
            "message": str(message),
            "severity": item.get("severity", "medium"),
        })

    return normalized or fallback_insights


def normalize_actions(raw_actions: list, fallback_actions: list[str]) -> list[str]:
    normalized = [
        str(action)
        for action in raw_actions
        if isinstance(action, str) and action.strip()
    ]

    return (normalized or fallback_actions)[:5]


def merge_ai_analysis(scores: dict, ai_result: dict, source: str) -> dict:
    insights = ai_result.get("insights")
    recommended_actions = ai_result.get("recommended_actions")
    conversion_diagnosis = ai_result.get("conversion_diagnosis")

    if not isinstance(insights, list):
        insights = scores["insights"]

    if not isinstance(recommended_actions, list):
        recommended_actions = scores["recommended_actions"]

    if not isinstance(conversion_diagnosis, str) or not conversion_diagnosis.strip():
        conversion_diagnosis = scores["conversion_diagnosis"]

    return {
        **scores,
        "conversion_diagnosis": conversion_diagnosis,
        "ai_source": source,
        "insights": normalize_insights(insights, scores["insights"]),
        "recommendations": scores["recommendations"],
        "recommended_actions": normalize_actions(recommended_actions, scores["recommended_actions"]),
    }


@router.post("/", response_model=AnalysisOut)
def analyze_product(request: ProductRequest):
    product = get_product_by_id(request.product_id)

    scores = analyze_product_scores(product)

    prompt = build_conversion_prompt(
        product=product,
        scores=scores,
    )

    fallback = {
        "conversion_diagnosis": scores["conversion_diagnosis"],
        "insights": scores["insights"],
        "recommendations": scores["recommendations"],
        "recommended_actions": scores["recommended_actions"],
    }

    ai_result, source = generate_json_result(
        prompt=prompt,
        fallback=fallback,
    )

    return {
        "product_id": product.id,
        **merge_ai_analysis(scores, ai_result, source),
    }
