from models import Product


NEGATIVE_ISSUES = {
    "runs_small",
    "runs_large",
    "narrow_fit",
    "wide_feet_issue",
    "comfort_negative",
    "cheap_material",
    "low_durability",
    "poor_cushioning",
    "slippery_sole",
    "color_mismatch",
}


def clamp_score(score: float) -> int:
    return max(0, min(100, round(score)))


def calculate_return_risk_score(product: Product) -> int:
    score = 20

    signals = product.return_risk_signals

    score += signals.runs_small_mentions * 4
    score += signals.runs_large_mentions * 3
    score += signals.wide_feet_mentions * 5
    score += signals.comfort_complaints * 5
    score += signals.quality_complaints * 5
    score += signals.durability_complaints * 6
    score += signals.slippery_sole_mentions * 4
    score += signals.color_mismatch_mentions * 3

    score += len([issue for issue in product.known_issues if issue in NEGATIVE_ISSUES]) * 6

    if product.rating < 4.0:
        score += 10

    if product.rating < 3.5:
        score += 15

    negative_reviews = len([review for review in product.reviews if review.sentiment == "negative"])

    score += negative_reviews * 2

    return clamp_score(score)


def get_risk_level(risk_score: int) -> str:
    if risk_score >= 70:
        return "high"

    if risk_score >= 40:
        return "medium"

    return "low"


def calculate_title_score(product: Product) -> int:
    title = product.title.strip()

    score = 50

    if len(title) >= 20:
        score += 20

    if product.brand.lower() in title.lower():
        score += 10

    if any(word in title.lower() for word in ["shoe", "shoes", "sneaker", "running", "sports"]):
        score += 10

    if len(title) > 80:
        score -= 10

    return clamp_score(score)


def calculate_description_score(product: Product) -> int:
    description = product.description.strip()

    score = 40

    if len(description) >= 80:
        score += 25

    if len(description) >= 160:
        score += 15

    if product.tags:
        score += 10

    if product.fit_type and product.fit_type != "regular":
        score += 5

    if len(description) < 40:
        score -= 20

    return clamp_score(score)


def calculate_visual_score(product: Product) -> int:
    score = 40

    if product.image:
        score += 40

    if product.gallery:
        score += 10

    if product.image.endswith((".jpg", ".jpeg", ".png", ".webp")):
        score += 10

    return clamp_score(score)


def calculate_trust_score(product: Product) -> int:
    score = 50

    if product.rating >= 4.5:
        score += 25
    elif product.rating >= 4.0:
        score += 15
    elif product.rating < 3.5:
        score -= 15

    if product.review_count >= 20:
        score += 15
    elif product.review_count >= 5:
        score += 8

    negative_reviews = len([review for review in product.reviews if review.sentiment == "negative"])
    score -= negative_reviews * 3

    if "cheap_material" in product.known_issues:
        score -= 10

    if "low_durability" in product.known_issues:
        score -= 10

    return clamp_score(score)


def calculate_review_score(product: Product) -> int:
    score = 50

    positive_reviews = len([review for review in product.reviews if review.sentiment == "positive"])
    negative_reviews = len([review for review in product.reviews if review.sentiment == "negative"])

    score += positive_reviews * 3
    score -= negative_reviews * 4

    if product.review_count >= 10:
        score += 10

    return clamp_score(score)


def calculate_overall_conversion_score(
    title_score: int,
    description_score: int,
    visual_score: int,
    trust_score: int,
    review_score: int,
    return_risk_score: int,
) -> int:
    score = (
        title_score * 0.18
        + description_score * 0.22
        + visual_score * 0.15
        + trust_score * 0.25
        + review_score * 0.20
    )

    risk_penalty = return_risk_score * 0.20

    return clamp_score(score - risk_penalty)


def build_basic_insights(product: Product, risk_score: int) -> list[dict]:
    insights = []

    if "runs_small" in product.known_issues:
        insights.append({
            "type": "warning",
            "title": "Sizing issue detected",
            "message": "Reviews suggest that this sneaker may run small.",
            "severity": "medium",
        })

    if "wide_feet_issue" in product.known_issues or "narrow_fit" in product.known_issues:
        insights.append({
            "type": "warning",
            "title": "Wide feet risk",
            "message": "Some users mention narrow fit or discomfort for wide feet.",
            "severity": "high" if risk_score >= 70 else "medium",
        })

    if "cheap_material" in product.known_issues:
        insights.append({
            "type": "warning",
            "title": "Material trust issue",
            "message": "Some reviews mention cheap or poor quality material.",
            "severity": "medium",
        })

    if not insights:
        insights.append({
            "type": "positive",
            "title": "Healthy product signals",
            "message": "No major fit or quality issue is strongly detected from reviews.",
            "severity": "low",
        })

    return insights


def analyze_product_scores(product: Product) -> dict:
    return_risk_score = calculate_return_risk_score(product)
    title_score = calculate_title_score(product)
    description_score = calculate_description_score(product)
    visual_score = calculate_visual_score(product)
    trust_score = calculate_trust_score(product)
    review_score = calculate_review_score(product)

    overall_conversion_score = calculate_overall_conversion_score(
        title_score=title_score,
        description_score=description_score,
        visual_score=visual_score,
        trust_score=trust_score,
        review_score=review_score,
        return_risk_score=return_risk_score,
    )

    return {
        "title_score": title_score,
        "description_score": description_score,
        "visual_score": visual_score,
        "trust_score": trust_score,
        "review_score": review_score,
        "return_risk_score": return_risk_score,
        "risk_level": get_risk_level(return_risk_score),
        "overall_conversion_score": overall_conversion_score,
        "insights": build_basic_insights(product, return_risk_score),
    }