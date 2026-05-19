from models import Product


def build_persona_prompt(
    product: Product,
    persona_type: str,
    gender: str | None = None,
    age_group: str | None = None,
    coupon_sensitive: bool = False,
    fit_sensitive: bool = False,
) -> str:
    title = product.title
    brand = product.brand
    description = product.description
    price = product.price
    tags = ", ".join(product.tags)
    known_issues = ", ".join(product.known_issues)

    base_info = f"""
Ürün başlığı: {title}
Marka: {brand}
Fiyat: {price} {product.currency}
Etiketler: {tags}
Bilinen sorunlar: {known_issues}
Kullanıcı cinsiyet tercihi: {gender or "bilinmiyor"}
Kullanıcı yaş grubu: {age_group or "bilinmiyor"}
Kupon hassasiyeti: {coupon_sensitive}
Kalıp hassasiyeti: {fit_sensitive}

Açıklama:
{description}
"""

    if persona_type == "style":
        focus = """
Odaklan:
- estetik görünüm
- günlük stil ve kombin uyumu
- sokak stili uyumu
- güçlü ilk izlenim
- stil güveni
"""

    elif persona_type == "comfort":
        focus = """
Odaklan:
- konfor
- yastıklama
- günlük kullanım
- yürüyüş deneyimi
- ayak desteği
"""

    elif persona_type == "budget":
        focus = """
Odaklan:
- fiyat/performans
- pratik faydalar
- dayanıklılık beklentisi
- ulaşılabilir kalite
- mantıklı satın alma kararı
"""

    else:
        focus = "Genel e-ticaret dönüşümüne odaklan."

    return f"""
Sen bir e-ticaret ürün metni yazarısın.

Bu sneaker ürünü için personaya özel içerik oluştur.

Persona: {persona_type}
Kullanıcının cinsiyet tercihi, yaş grubu, kupon hassasiyeti ve kalıp hassasiyetini uygun olduğunda metne yansıt.
Tıbbi iddia uydurma ve iade riskini gizleme. Kalıp riski varsa açıkça belirt.

Dil kuralları:
- Tüm JSON değerlerini Türkçe yaz.
- Marka/model adlarını koru, ancak başlık, açıklama, özellikler ve CTA Türkçe olsun.
- İngilizce cümle kullanma.

{focus}

{base_info}

YALNIZCA geçerli JSON döndür.
Markdown kullanma.
Cevabı kod bloğuna alma.

JSON schema:
{{
  "hero_title": "personaya özel kısa Türkçe başlık",
  "hero_description": "bu persona için 2 cümlelik Türkçe ürün açıklaması",
  "features": [
    "Türkçe özellik 1",
    "Türkçe özellik 2",
    "Türkçe özellik 3"
  ],
  "cta": "kısa Türkçe aksiyon metni"
}}
"""
