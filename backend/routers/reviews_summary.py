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

    positive_points = []
    negative_points = []

    if positive_reviews:
        positive_points.append("Kullanicilar genel olarak konfor, hafiflik ve sik tasarimdan memnun.")
    if product.rating >= 4:
        positive_points.append(f"Mevcut degerlendirmelerde {product.rating:.1f} memnuniyet puani aldi.")
    if product.tags:
        positive_points.append(f"One cikan urun ozellikleri: {', '.join(product.tags[:2])}.")

    if "runs_small" in product.known_issues:
        negative_points.append("Kalibinin biraz dar oldugu ve 1 numara buyuk alinmasi gerektigi belirtilmis.")
    if "narrow_fit" in product.known_issues or "wide_feet_issue" in product.known_issues:
        negative_points.append("Tarakli ayak yapisina sahip kullanicilar icin yanlardan sikma yapabilir.")
    if "comfort_negative" in product.known_issues:
        negative_points.append("Uzun sureli kullanimda taban sertligi bildiren yorumlar var.")
    if "cheap_material" in product.known_issues or "low_durability" in product.known_issues:
        negative_points.append("Malzeme kalitesi beklentisi yuksek olan kullanicilar detaylari incelemeli.")

    if not positive_points:
        positive_points.append("Urun icin henuz baskin bir olumlu geri bildirim temasi olusmadi.")
    if not negative_points:
        negative_points.append("Kritik veya kronik bir olumsuz geri bildirim temasi tespit edilmedi.")

    return {
        "short_summary": (
            "Kullanici yorumlari; kalip, konfor ve iade risk sinyallerine gore analiz edildi. "
            f"Guncel iade riski seviyesi: {scores['risk_level'].upper()} "
            f"(Skor: {scores['return_risk_score']})."
        ),
        "positive_points": positive_points[:4],
        "negative_points": negative_points[:4],
        "return_risk_reasons": [
            scores.get("conversion_diagnosis", "Iade risk analizi dengeli."),
            *negative_points[:2],
        ],
    }


def normalize_summary(raw: dict, fallback: dict) -> dict:
    if not isinstance(raw, dict):
        return fallback

    result = {}
    result["short_summary"] = (
        raw.get("short_summary")
        if isinstance(raw.get("short_summary"), str)
        else fallback["short_summary"]
    )

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
