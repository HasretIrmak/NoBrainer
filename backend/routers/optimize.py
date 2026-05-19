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


def get_display_title(product) -> str:
    title = product.title.strip()
    brand = product.brand.strip()

    if not brand or title.lower().startswith(brand.lower()):
        return title

    return f"{brand} {title}"


def build_fallback_optimization(product, scores: dict) -> dict:
    fit_note = ""

    if "runs_small" in product.known_issues or product.fit_type in ["small", "narrow"]:
        fit_note = " Bazı kullanıcılar dar kalıp sinyali verdiği için beden tablosunun kontrol edilmesi önerilir."

    display_title = get_display_title(product)
    optimized_title = f"{display_title} - Günlük Kullanıma Uygun Sneaker"

    optimized_description = (
        f"{display_title}, günlük kullanım, rahat kombinler ve pratik konfor beklentisi için konumlandırılabilir."
        f"{fit_note} Yorum sinyalleriyle desteklenen bu ürün; stil, konfor ve günlük kullanım arasında "
        f"dengeli bir seçim arayan kullanıcılar için daha net anlatılmalıdır."
    )

    return {
        "optimized_title": optimized_title,
        "optimized_description": optimized_description,
        "faq": [
            {
                "question": "Bu sneaker kalıbı standart mı?",
                "answer": "Bazı yorum sinyalleri satın almadan önce beden tablosunun kontrol edilmesini öneriyor; özellikle taraklı ayak yapısı olan kullanıcılar dikkat etmeli."
            },
            {
                "question": "Günlük kullanım için uygun mu?",
                "answer": "Evet, günlük kullanım için konumlandırılabilir; ancak konfor ve kalıp beklentisi ürün sayfasında açıkça anlatılmalı."
            },
            {
                "question": "Satıcı ürün sayfasında neyi netleştirmeli?",
                "answer": "Beden yönlendirmesi, konfor beklentisi ve malzeme detayları görünür şekilde eklenmeli."
            }
        ],
        "trust_messages": [
            "İade riskini azaltmak için beden yönlendirmesi eklendi.",
            "Alıcı güveni için yorumlara dayalı kalıp uyarıları görünür hale getirildi.",
            "Ürün açıklaması daha net kullanım beklentileriyle güçlendirildi."
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
