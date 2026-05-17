from fastapi import APIRouter

from models import ProductRequest, ReviewSummaryOut
from prompts.review_summary_prompt import build_review_summary_prompt
from services.gemini_service import generate_json_result
from services.product_service import get_product_by_id
from services.scoring_service import analyze_product_scores


router = APIRouter(
    prefix="/reviews-summary",
    tags=["Reviews Summary"],
)


def build_fallback_summary(product, scores: dict) -> dict:
    positive_reviews = [review for review in product.reviews if review.sentiment == "positive"]
    negative_reviews = [review for review in product.reviews if review.sentiment == "negative"]

    positive_points = []
    negative_points = []

    if positive_reviews:
        positive_points.append("Positive reviews mention comfort, daily use or general satisfaction.")
    if product.rating >= 4:
        positive_points.append(f"The product has a {product.rating:.1f} rating from available reviews.")
    if product.tags:
        positive_points.append(f"Strong product signals: {', '.join(product.tags[:3])}.")

    if "runs_small" in product.known_issues:
        negative_points.append("Some reviews indicate that the product may run small.")
    if "narrow_fit" in product.known_issues or "wide_feet_issue" in product.known_issues:
        negative_points.append("Fit may be narrow for wide-feet users.")
    if "comfort_negative" in product.known_issues:
        negative_points.append("Some customers mention comfort concerns.")
    if "cheap_material" in product.known_issues or "low_durability" in product.known_issues:
        negative_points.append("Some reviews raise material or durability concerns.")
    if negative_reviews and not negative_points:
        negative_points.append("There are negative review signals that should be checked before purchase.")

    if not positive_points:
        positive_points.append("No strong positive review theme is available yet.")
    if not negative_points:
        negative_points.append("No major negative review theme is strongly detected.")

    return {
        "short_summary": (
            "Reviews are analyzed with fit, comfort, material and return-risk signals. "
            f"Current return risk is {scores['risk_level']} with score {scores['return_risk_score']}."
        ),
        "positive_points": positive_points[:4],
        "negative_points": negative_points[:4],
        "return_risk_reasons": [
            scores["conversion_diagnosis"],
            *negative_points[:2],
        ],
    }


def normalize_summary(raw: dict, fallback: dict) -> dict:
    if not isinstance(raw, dict):
        return fallback

    result = {}
    result["short_summary"] = raw.get("short_summary") if isinstance(raw.get("short_summary"), str) else fallback["short_summary"]

    for key in ["positive_points", "negative_points", "return_risk_reasons"]:
        value = raw.get(key)
        if isinstance(value, list):
            result[key] = [str(item) for item in value if str(item).strip()][:5] or fallback[key]
        else:
            result[key] = fallback[key]

    return result


@router.post("/", response_model=ReviewSummaryOut)
def summarize_reviews(request: ProductRequest):
    product = get_product_by_id(request.product_id)
    scores = analyze_product_scores(product)
    fallback = build_fallback_summary(product, scores)
    prompt = build_review_summary_prompt(product, scores)

    ai_result, source = generate_json_result(prompt=prompt, fallback=fallback)
    summary = normalize_summary(ai_result, fallback)

    return {
        "product_id": product.id,
        "source": source,
        **summary,
    }
