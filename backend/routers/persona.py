from fastapi import APIRouter

from models import PersonaContent, PersonaOut, PersonaRequest, Product
from prompts.persona_prompt import build_persona_prompt
from services.gemini_service import generate_json_result
from services.product_service import get_product_by_id


router = APIRouter(
    prefix="/persona",
    tags=["Persona"],
)


PERSONA_CONTENT_CACHE: dict[tuple[str, str], dict] = {}


def get_display_title(product: Product) -> str:
    title = product.title.strip()
    brand = product.brand.strip()

    if not brand or title.lower().startswith(brand.lower()):
        return title

    return f"{brand} {title}"


def fallback_persona_content(product: Product, persona: str) -> dict:
    brand_title = get_display_title(product)

    if persona == "style":
        return {
            "hero_title": f"{brand_title} ile daha güçlü günlük stil",
            "hero_description": (
                "Görünümü öne çıkaran, günlük kombinlerde ayakkabının stili taşımasını isteyen kullanıcılar "
                "için hazırlanmış bir ürün görünümü. Silüet, renk uyumu ve ilk izlenim bu persona için öne çıkar."
            ),
            "features": [
                "Renk ve kombin uyumu",
                "Günlük stil odaklı kullanım",
                "İlk izlenimi güçlendiren ürün sunumu",
            ],
            "cta": "Stiline ekle",
        }

    if persona == "comfort":
        fit_note = "regular fit"

        if product.fit_type in ["small", "narrow"]:
            fit_note = "daha dar kalıp, satın almadan önce beden bilgisini kontrol edin"
        elif product.fit_type == "large":
            fit_note = "daha geniş kalıp, her zamanki bedeninizle karşılaştırın"

        return {
            "hero_title": f"{brand_title} ile günlük konfor",
            "hero_description": (
                "Bu görünüm, ürünün konfor, kalıp ve günlük kullanım sinyallerini öne çıkarır. "
                f"Güncel kalıp sinyali: {fit_note}."
            ),
            "features": [
                "Satın almadan önce kalıp yönlendirmesi",
                "Konfor ve yürüyüş sinyalleri",
                "Yorumlara dayalı beden bağlamı",
            ],
            "cta": "Kalıbı kontrol et",
        }

    value_note = "kategori ortalamasının altında fiyatlanıyor"

    if product.market_signals.avg_category_price and product.price > product.market_signals.avg_category_price:
        value_note = "kategori ortalamasının üstünde fiyatlanıyor; bu yüzden değer önerisi net anlatılmalı"

    return {
        "hero_title": f"{brand_title} için akıllı fiyat/değer seçimi",
        "hero_description": (
            "Bu görünüm fiyat, puan ve pratik günlük kullanım dengesine odaklanır. "
            f"Bu ürün {value_note}."
        ),
        "features": [
            f"{product.rating:.1f} puan bağlamı",
            "Fiyat/değer karşılaştırması",
            "Pratik satın alma yönlendirmesi",
        ],
        "cta": "Değeri karşılaştır",
    }


def normalize_persona_content(raw_content: dict, fallback: dict) -> dict:
    try:
        return PersonaContent.model_validate(raw_content).model_dump()
    except Exception:
        return fallback


@router.post("/", response_model=PersonaOut)
def generate_persona_page(request: PersonaRequest):
    product = get_product_by_id(request.product_id)
    cache_key = (product.id, request.persona)

    if cache_key in PERSONA_CONTENT_CACHE:
        return {
            "product_id": product.id,
            "persona": request.persona,
            "source": "cache",
            "content": PERSONA_CONTENT_CACHE[cache_key],
        }

    fallback = fallback_persona_content(product, request.persona)
    prompt = build_persona_prompt(
        product=product,
        persona_type=request.persona,
        gender=request.gender,
        age_group=request.age_group,
        coupon_sensitive=request.coupon_sensitive,
        fit_sensitive=request.fit_sensitive,
    )

    ai_result, source = generate_json_result(
        prompt=prompt,
        fallback=fallback,
    )

    content = normalize_persona_content(ai_result, fallback)

    if content == fallback and source == "gemini":
        source = "fallback"

    PERSONA_CONTENT_CACHE[cache_key] = content

    return {
        "product_id": product.id,
        "persona": request.persona,
        "source": source,
        "content": content,
    }
