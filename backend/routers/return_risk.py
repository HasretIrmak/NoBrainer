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


SIGNAL_TO_ISSUE = {
    "runs_small": "runs_small",
    "runs_large": "runs_large",
    "narrow_fit": "narrow_fit",
    "wide_feet_issue": "wide_feet_issue",
    "comfort_negative": "comfort_negative",
    "cheap_material": "cheap_material",
    "low_durability": "low_durability",
    "slippery_sole": "slippery_sole",
    "color_mismatch": "color_mismatch",
}


def get_evidence_severity(signal: str, sentiment: str) -> str:
    if sentiment == "negative":
        return "high"

    if signal in ["runs_small", "runs_large", "narrow_fit", "wide_feet_issue", "comfort_negative"]:
        return "medium"

    return "low"


def build_return_risk_evidence(product, detected_issues: list[str]) -> list[dict]:
    evidence = []
    seen = set()

    for review in product.reviews:
        for signal in review.signals:
            issue = SIGNAL_TO_ISSUE.get(signal)

            if not issue or issue not in detected_issues:
                continue

            key = (issue, review.text[:80])

            if key in seen:
                continue

            seen.add(key)
            evidence.append({
                "signal": issue,
                "review_text": review.text[:260],
                "sentiment": review.sentiment,
                "severity": get_evidence_severity(issue, review.sentiment),
            })

            if len(evidence) >= 5:
                return evidence

    return evidence


def build_fallback_reasons(known_issues: list[str]) -> list[str]:
    reason_map = {
        "runs_small": "Yorumlar ayakkabının küçük kalıplı olabileceğini gösteriyor.",
        "runs_large": "Bazı yorumlar bedenin büyük gelebileceğini söylüyor.",
        "narrow_fit": "Dar kalıp olası bir sorun olarak öne çıkıyor.",
        "wide_feet_issue": "Taraklı ayak yapısına sahip kullanıcılar rahatsızlık yaşayabilir.",
        "comfort_negative": "Bazı kullanıcılar konfor problemi bildiriyor.",
        "cheap_material": "Bazı yorumlarda malzeme kalitesiyle ilgili endişeler var.",
        "low_durability": "Bazı kullanıcılar dayanıklılık sorunu bildiriyor.",
        "slippery_sole": "Bazı yorumlarda taban tutuşu veya kayganlık sorunu geçiyor.",
        "color_mismatch": "Bazı yorumlarda renk uyumsuzluğu belirtiliyor.",
    }

    reasons = [reason_map[issue] for issue in known_issues if issue in reason_map]

    if not reasons:
        reasons.append("Güçlü bir iade riski sinyali tespit edilmedi.")

    return reasons


def build_fallback_user_warning(risk_level: str, known_issues: list[str]) -> str:
    if "runs_small" in known_issues or "narrow_fit" in known_issues:
        return "Bu ayakkabı dar gelebilir. Özellikle taraklı ayak yapınız varsa bir numara büyük düşünün."

    if "runs_large" in known_issues:
        return "Bu ayakkabı büyük kalıplı olabilir. Satın almadan önce beden tablosunu kontrol edin."

    if risk_level == "high":
        return "Bu üründe iade riski yüksek. Beden, konfor ve kalite detaylarını dikkatli kontrol edin."

    if risk_level == "medium":
        return "Bu üründe orta seviye iade riski var. Satın almadan önce beden ve konfor yorumlarını inceleyin."

    return "Mevcut yorumlara göre iade riski düşük görünüyor."


def build_fallback_seller_advice(risk_level: str, known_issues: list[str]) -> str:
    advice = []

    if "runs_small" in known_issues or "narrow_fit" in known_issues:
        advice.append("Ürün açıklamasına net bir beden büyütme önerisi ve dar kalıp notu ekleyin.")

    if "wide_feet_issue" in known_issues:
        advice.append("Taraklı ayak yapısına sahip kullanıcılar için kalıp yönlendirmesi ekleyin.")

    if "cheap_material" in known_issues:
        advice.append("Malzeme açıklamasını güçlendirin ve yakın plan malzeme görselleri ekleyin.")

    if "low_durability" in known_issues:
        advice.append("Dayanıklılık beklentisini kullanım önerileri veya garanti mesajlarıyla netleştirin.")

    if advice:
        return " ".join(advice)

    if risk_level == "low":
        return "Acil aksiyon gerekmiyor. Konfor, kalite ve olumlu yorumları görünür tutun."

    return "Ürün açıklamasını daha net beden, konfor ve kalite bilgisiyle iyileştirin."


@router.post("/", response_model=ReturnRiskOut)
def analyze_return_risk(request: ProductRequest):
    product = get_product_by_id(request.product_id)

    scores = analyze_product_scores(product)

    risk_score = scores["return_risk_score"]
    risk_level = scores["risk_level"]
    detected_issues = product.known_issues
    evidence = build_return_risk_evidence(product, detected_issues)

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
        "evidence": evidence,
    }
