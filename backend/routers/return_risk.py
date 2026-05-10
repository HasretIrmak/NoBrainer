from fastapi import APIRouter

from models import ProductRequest, ReturnRiskOut
from prompts.return_prompt import build_return_prompt
from services.gemini_service import generate_json
from services.product_service import get_product_by_id
from services.scoring_service import analyze_product_scores


router = APIRouter(
    prefix="/return-risk",
    tags=["Return Risk"],
)


def build_fallback_reasons(known_issues: list[str]) -> list[str]:
    reason_map = {
        "runs_small": "Reviews indicate that the sneaker may run small.",
        "runs_large": "Some reviews suggest sizing may run large.",
        "narrow_fit": "Narrow fit is mentioned as a possible issue.",
        "wide_feet_issue": "Users with wide feet may experience discomfort.",
        "comfort_negative": "Some users report comfort problems.",
        "cheap_material": "Some reviews mention material quality concerns.",
        "low_durability": "Some users report durability issues.",
        "slippery_sole": "Some reviews mention grip or slippery sole issues.",
        "color_mismatch": "Some reviews mention color mismatch.",
    }

    reasons = [reason_map[issue] for issue in known_issues if issue in reason_map]

    if not reasons:
        reasons.append("No major return risk signal is strongly detected.")

    return reasons


def build_fallback_user_warning(risk_level: str, known_issues: list[str]) -> str:
    if "runs_small" in known_issues or "narrow_fit" in known_issues:
        return "This sneaker may feel tight. Consider sizing up, especially if you have wide feet."

    if "runs_large" in known_issues:
        return "This sneaker may run large. Check the size guide before buying."

    if risk_level == "high":
        return "This product has a high return risk. Check sizing, comfort and quality details carefully."

    if risk_level == "medium":
        return "This product has a moderate return risk. Review sizing and comfort feedback before buying."

    return "Return risk looks low based on available reviews."


def build_fallback_seller_advice(risk_level: str, known_issues: list[str]) -> str:
    advice = []

    if "runs_small" in known_issues or "narrow_fit" in known_issues:
        advice.append("Add a clear size-up recommendation and mention narrow fit in the product description.")

    if "wide_feet_issue" in known_issues:
        advice.append("Add a note for wide-feet users and include fit guidance.")

    if "cheap_material" in known_issues:
        advice.append("Improve material description and add close-up material photos.")

    if "low_durability" in known_issues:
        advice.append("Address durability concerns with clearer usage expectations or warranty messaging.")

    if advice:
        return " ".join(advice)

    if risk_level == "low":
        return "No urgent action needed. Keep highlighting comfort, quality and positive reviews."

    return "Improve product description with clearer sizing, comfort and quality information."


@router.post("/", response_model=ReturnRiskOut)
def analyze_return_risk(request: ProductRequest):
    product = get_product_by_id(request.product_id)

    scores = analyze_product_scores(product)

    risk_score = scores["return_risk_score"]
    risk_level = scores["risk_level"]
    detected_issues = product.known_issues

    fallback = {
        "reasons": build_fallback_reasons(detected_issues),
        "user_warning": build_fallback_user_warning(risk_level, detected_issues),
        "seller_advice": build_fallback_seller_advice(risk_level, detected_issues),
    }

    prompt = build_return_prompt(product=product, scores=scores)

    ai_result = generate_json(
        prompt=prompt,
        fallback=fallback,
    )

    return {
        "product_id": product.id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "detected_issues": detected_issues,
        "user_warning": ai_result.get("user_warning", fallback["user_warning"]),
        "seller_advice": ai_result.get("seller_advice", fallback["seller_advice"]),
        "reasons": ai_result.get("reasons", fallback["reasons"]),
    }