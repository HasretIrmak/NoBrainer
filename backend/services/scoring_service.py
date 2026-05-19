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


def safe_rate(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0

    return numerator / denominator


def band_score(value: float, low: float, good: float, excellent: float) -> int:
    if value <= low:
        return clamp_score((value / low) * 30) if low else 0

    if value <= good:
        return clamp_score(30 + ((value - low) / (good - low)) * 40)

    if value <= excellent:
        return clamp_score(70 + ((value - good) / (excellent - good)) * 30)

    return 100


def calculate_sales_funnel(product: Product) -> dict:
    signals = product.sales_signals

    click_rate = safe_rate(signals.clicks, signals.views)
    cart_rate = safe_rate(signals.cart_adds, signals.clicks)
    checkout_rate = safe_rate(signals.sales, signals.cart_adds)
    purchase_rate = safe_rate(signals.sales, signals.views)

    main_dropoff = "healthy"

    if signals.views >= 500 and click_rate < 0.06:
        main_dropoff = "discovery"
    elif signals.clicks >= 50 and cart_rate < 0.16:
        main_dropoff = "product_page"
    elif signals.cart_adds >= 10 and checkout_rate < 0.18:
        main_dropoff = "checkout"
    elif signals.return_rate >= 0.25:
        main_dropoff = "retention"

    return {
        "views": signals.views,
        "clicks": signals.clicks,
        "cart_adds": signals.cart_adds,
        "sales": signals.sales,
        "click_rate": round(click_rate, 4),
        "cart_rate": round(cart_rate, 4),
        "checkout_rate": round(checkout_rate, 4),
        "purchase_rate": round(purchase_rate, 4),
        "return_rate": round(signals.return_rate, 4),
        "main_dropoff": main_dropoff,
    }


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
    score = 70

    if not product.image:
        score -= 40

    image_quality = product.visual_signals.image_quality.lower()
    image_issue = product.visual_signals.image_issue.lower()

    if image_quality == "low":
        score -= 25
    elif image_quality == "medium":
        score -= 10
    elif image_quality == "high":
        score += 15

    if not product.gallery:
        score -= 12

    if "single_angle" in image_issue:
        score -= 15

    if "single_image" in image_issue:
        score -= 10

    if product.image and not product.image.endswith((".jpg", ".jpeg", ".png", ".webp")):
        score -= 10

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


def calculate_sales_health_score(product: Product, funnel: dict) -> int:
    click_score = band_score(funnel["click_rate"], low=0.03, good=0.08, excellent=0.16)
    cart_score = band_score(funnel["cart_rate"], low=0.10, good=0.25, excellent=0.40)
    checkout_score = band_score(funnel["checkout_rate"], low=0.08, good=0.20, excellent=0.35)
    purchase_score = band_score(funnel["purchase_rate"], low=0.002, good=0.006, excellent=0.012)
    return_score = clamp_score(100 - (funnel["return_rate"] * 220))

    score = (
        click_score * 0.20
        + cart_score * 0.25
        + checkout_score * 0.25
        + purchase_score * 0.15
        + return_score * 0.15
    )

    return clamp_score(score)


def calculate_price_competitiveness_score(product: Product) -> int:
    avg_price = product.market_signals.avg_category_price

    if not avg_price:
        return 60

    price_ratio = product.price / avg_price
    score = 75

    if price_ratio <= 0.75:
        score += 20
    elif price_ratio <= 1.00:
        score += 10
    elif price_ratio <= 1.15:
        score -= 5
    elif price_ratio <= 1.35:
        score -= 18
    else:
        score -= 32

    competitor_rating = product.market_signals.competitor_rating_avg

    if competitor_rating:
        if product.rating >= competitor_rating + 0.15:
            score += 8
        elif product.rating < competitor_rating - 0.20:
            score -= 12

    if product.sales_signals.return_rate >= 0.25:
        score -= 8

    return clamp_score(score)


def calculate_overall_conversion_score(
    title_score: int,
    description_score: int,
    visual_score: int,
    trust_score: int,
    review_score: int,
    sales_health_score: int,
    price_competitiveness_score: int,
    return_risk_score: int,
) -> int:
    score = (
        title_score * 0.12
        + description_score * 0.16
        + visual_score * 0.14
        + trust_score * 0.18
        + review_score * 0.13
        + sales_health_score * 0.18
        + price_competitiveness_score * 0.09
    )

    risk_penalty = return_risk_score * 0.20

    return clamp_score(score - risk_penalty)


def build_conversion_diagnosis(funnel: dict) -> str:
    dropoff = funnel["main_dropoff"]

    if dropoff == "discovery":
        return "Ürün görüntüleniyor ancak yeterli tıklama almıyor. İlk izlenim, kart görseli, başlık veya fiyat konumlandırması güçlendirilmeli."

    if dropoff == "product_page":
        return "Kullanıcılar ürüne giriyor ancak yeterince sepete eklemiyor. Ürün detay sayfası kalıp, kalite veya değer sorularını yeterince net yanıtlamıyor olabilir."

    if dropoff == "checkout":
        return "Kullanıcılar ürünü sepete ekliyor ancak satın almayı tamamlamıyor. Fiyat güveni, kargo, güven mesajı veya iade riski son kararı engelliyor olabilir."

    if dropoff == "retention":
        return "Ürün satıyor ancak iade oranı yüksek. Trafiği artırmadan önce kalıp, konfor, kalite veya beklenti uyumsuzluğu ele alınmalı."

    return "Satış hunisi genel olarak sağlıklı görünüyor. Optimizasyon daha zayıf içerik ve risk sinyallerini güçlendirmeye odaklanmalı."


def build_conversion_insights(
    product: Product,
    risk_score: int,
    funnel: dict,
    visual_score: int,
    sales_health_score: int,
    price_competitiveness_score: int,
) -> list[dict]:
    insights = []

    if funnel["main_dropoff"] == "discovery":
        insights.append({
            "type": "warning",
            "title": "İlk tıklama performansı zayıf",
            "message": "Görüntülenmeler yeterince ürün tıklamasına dönüşmüyor. Kart görseli, başlık netliği ve fiyat sunumu iyileştirilmeli.",
            "severity": "high" if funnel["click_rate"] < 0.04 else "medium",
        })

    if funnel["main_dropoff"] == "product_page":
        insights.append({
            "type": "warning",
            "title": "Ürün sayfası yeterince ikna edici değil",
            "message": "Kullanıcılar ürüne tıklıyor ancak sağlıklı oranda sepete eklemiyor. Kalıp, malzeme, beden ve yorum sinyalleri daha net olmalı.",
            "severity": "medium",
        })

    if funnel["main_dropoff"] == "checkout":
        insights.append({
            "type": "warning",
            "title": "Sepet ilgisi satışa dönüşmüyor",
            "message": "Ürün sepete ekleniyor ancak satın alma öncesinde kullanıcı kaybediyor. Güven mesajı, iade yönlendirmesi ve değer kanıtı eklenmeli.",
            "severity": "high",
        })

    if funnel["main_dropoff"] == "retention":
        insights.append({
            "type": "warning",
            "title": "Satış sonrası iade oranı yüksek",
            "message": "Ürün satıyor ancak iade oranı yüksek. Beden, konfor veya kalite beklentisi kullanıcıyla uyuşmuyor olabilir.",
            "severity": "high",
        })

    if sales_health_score < 50:
        insights.append({
            "type": "warning",
            "title": "Satış sağlığı skoru düşük",
            "message": "Tıklama, sepete ekleme, satış veya iade aşamalarında ölçülebilir bir dönüşüm problemi var.",
            "severity": "high",
        })

    if visual_score < 55:
        recommendation = "Daha fazla açı, yakın plan malzeme fotoğrafı ve ayakta kullanım görseli ekleyin."
        insights.append({
            "type": "suggestion",
            "title": "Görsel sunum iyileştirilmeli",
            "message": recommendation,
            "severity": "medium",
        })

    if price_competitiveness_score < 55:
        insights.append({
            "type": "warning",
            "title": "Fiyat konumu daha iyi gerekçelendirilmeli",
            "message": "Ürün fiyatı puan, iade oranı veya kategori karşılaştırmasıyla yeterince desteklenmiyor. Değer kanıtı veya kampanya mesajı ekleyin.",
            "severity": "medium",
        })

    if "runs_small" in product.known_issues:
        insights.append({
            "type": "warning",
            "title": "Beden sorunu tespit edildi",
            "message": "Yorumlar bu sneaker modelinin küçük kalıplı olabileceğini gösteriyor.",
            "severity": "medium",
        })

    if "wide_feet_issue" in product.known_issues or "narrow_fit" in product.known_issues:
        insights.append({
            "type": "warning",
            "title": "Taraklı ayak riski",
            "message": "Bazı kullanıcılar dar kalıp veya taraklı ayak için rahatsızlık sinyali veriyor.",
            "severity": "high" if risk_score >= 70 else "medium",
        })

    if "cheap_material" in product.known_issues:
        insights.append({
            "type": "warning",
            "title": "Malzeme güveni sorunu",
            "message": "Bazı yorumlarda malzemenin düşük kaliteli algılandığı belirtiliyor.",
            "severity": "medium",
        })

    if not insights:
        insights.append({
            "type": "positive",
            "title": "Ürün sinyalleri sağlıklı",
            "message": "Yorumlarda güçlü bir kalıp veya kalite problemi tespit edilmedi.",
            "severity": "low",
        })

    return insights


def build_recommendations(product: Product, scores: dict, funnel: dict) -> list[dict]:
    recommendations = []

    if scores["description_score"] < 60:
        recommendations.append({
            "category": "description",
            "priority": "high" if scores["description_score"] < 45 else "medium",
            "action": "Açıklamayı beden, malzeme, kullanım alanı ve bakım bilgileriyle genişletin.",
            "reason": f"Açıklama skoru {scores['description_score']}; ürün sayfası ürünü yeterince net anlatmıyor.",
            "expected_impact": "Ürün sayfası güvenini ve sepete ekleme oranını artırır.",
        })

    if scores["visual_score"] < 60:
        image_issue = product.visual_signals.image_issue or "limited product imagery"
        recommendations.append({
            "category": "visual",
            "priority": "high" if scores["visual_score"] < 40 else "medium",
            "action": "Yan açı, yakın plan malzeme ve ayakta kullanım görselleri ekleyin.",
            "reason": f"Görsel skoru {scores['visual_score']} ve görsel sorunu '{image_issue}'.",
            "expected_impact": "İlk tıklama performansını ve satın alma öncesi güveni artırır.",
        })

    if scores["return_risk_score"] >= 60:
        recommendations.append({
            "category": "return_risk",
            "priority": "high" if scores["return_risk_score"] >= 70 else "medium",
            "action": "Kalıp ve beden uyarılarını ürün sayfasının üst bölümüne taşıyın.",
            "reason": f"İade riski skoru {scores['return_risk_score']}; tespit edilen sorunlar: {', '.join(product.known_issues) or 'yok'}.",
            "expected_impact": "Beklenti uyumsuzluğunu ve önlenebilir iadeleri azaltır.",
        })

    if scores["sales_health_score"] < 55:
        recommendations.append({
            "category": "sales_funnel",
            "priority": "high" if scores["sales_health_score"] < 45 else "medium",
            "action": "Ana huni kırılımını daha net güven, değer ve satın alma mesajlarıyla ele alın.",
            "reason": f"Satış sağlığı skoru {scores['sales_health_score']} ve ana kırılım '{funnel['main_dropoff']}'.",
            "expected_impact": "Zayıf huni aşamasındaki kullanıcıları tamamlanan satın almaya yaklaştırır.",
        })

    if scores["price_competitiveness_score"] < 60:
        avg_price = product.market_signals.avg_category_price
        recommendations.append({
            "category": "pricing",
            "priority": "medium",
            "action": "Fiyatı kalite kanıtı, garanti, karşılaştırma veya kampanya mesajıyla destekleyin.",
            "reason": f"Fiyat rekabet skoru {scores['price_competitiveness_score']}; ürün fiyatı {product.price}, kategori ortalaması {avg_price}.",
            "expected_impact": "Fiyat tereddüdünü azaltır ve ödeme güvenini artırır.",
        })

    if "wide_feet_issue" in product.known_issues or "narrow_fit" in product.known_issues:
        recommendations.append({
            "category": "fit",
            "priority": "medium",
            "action": "Taraklı ayak kullanıcıları için net bir not ekleyin ve beden tablosunu kontrol etmeyi önerin.",
            "reason": "Yorum ve sorun sinyalleri dar kalıp veya taraklı ayak rahatsızlığına işaret ediyor.",
            "expected_impact": "Doğru alıcının doğru bedeni seçmesine yardımcı olur ve kalıp kaynaklı iadeleri azaltır.",
        })

    if not recommendations:
        recommendations.append({
            "category": "optimization",
            "priority": "low",
            "action": "Mevcut sayfa yapısını koruyun; görseller ve yorum vurgularında küçük iyileştirmeler test edin.",
            "reason": "Huni, fiyat, görsel veya iade riski tarafında güçlü bir sorun tespit edilmedi.",
            "expected_impact": "Büyük değişiklik yapmadan dönüşümü kademeli olarak iyileştirir.",
        })

    priority_order = {"high": 0, "medium": 1, "low": 2}

    recommendations.sort(
        key=lambda item: (
            priority_order.get(item["priority"], 3),
            item["category"],
        )
    )

    return recommendations[:5]


def build_recommended_actions(recommendations: list[dict]) -> list[str]:
    return [item["action"] for item in recommendations]


def analyze_product_scores(product: Product) -> dict:
    funnel = calculate_sales_funnel(product)
    return_risk_score = calculate_return_risk_score(product)
    title_score = calculate_title_score(product)
    description_score = calculate_description_score(product)
    visual_score = calculate_visual_score(product)
    trust_score = calculate_trust_score(product)
    review_score = calculate_review_score(product)
    sales_health_score = calculate_sales_health_score(product, funnel)
    price_competitiveness_score = calculate_price_competitiveness_score(product)

    overall_conversion_score = calculate_overall_conversion_score(
        title_score=title_score,
        description_score=description_score,
        visual_score=visual_score,
        trust_score=trust_score,
        review_score=review_score,
        sales_health_score=sales_health_score,
        price_competitiveness_score=price_competitiveness_score,
        return_risk_score=return_risk_score,
    )

    scores = {
        "title_score": title_score,
        "description_score": description_score,
        "visual_score": visual_score,
        "trust_score": trust_score,
        "review_score": review_score,
        "sales_health_score": sales_health_score,
        "price_competitiveness_score": price_competitiveness_score,
        "return_risk_score": return_risk_score,
        "risk_level": get_risk_level(return_risk_score),
        "overall_conversion_score": overall_conversion_score,
        "funnel": funnel,
        "conversion_diagnosis": build_conversion_diagnosis(funnel),
    }

    scores["insights"] = build_conversion_insights(
        product=product,
        risk_score=return_risk_score,
        funnel=funnel,
        visual_score=visual_score,
        sales_health_score=sales_health_score,
        price_competitiveness_score=price_competitiveness_score,
    )

    scores["recommendations"] = build_recommendations(
        product=product,
        scores=scores,
        funnel=funnel,
    )

    scores["recommended_actions"] = build_recommended_actions(scores["recommendations"])

    return scores
