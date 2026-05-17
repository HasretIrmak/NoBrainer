import argparse
import json
import random
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    from playwright.sync_api import sync_playwright
except ImportError as error:
    missing_package = str(error).split("'")[-2] if "'" in str(error) else str(error)
    print(
        "Missing dependency: "
        f"{missing_package}. Install with: pip install playwright beautifulsoup4 requests"
    )
    print("Then run: python -m playwright install chromium")
    sys.exit(1)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_FILE = PROJECT_ROOT / "backend" / "data" / "trendyol_products.json"
DEFAULT_CACHE_FILE = PROJECT_ROOT / "backend" / "data" / "trendyol_import_cache.json"
DEFAULT_IMAGE_DIR = PROJECT_ROOT / "public" / "images" / "trendyol"

REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 TrendyolCollectionImporter/1.0",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}

BLOCK_MARKERS = [
    "captcha",
    "robot",
    "bot",
    "access denied",
    "erisim engellendi",
    "erisiminiz engellendi",
    "olagan disi",
    "olağan dışı",
    "guvenlik",
    "güvenlik",
]

GENDER_KEYWORDS = {
    "Women": [
        "kadın",
        "kadin",
        "bayan",
        "women",
        "woman",
    ],
    "Men": [
        "erkek",
        "bay",
        "men",
        "man",
    ],
    "Girls": [
        "kız çocuk",
        "kiz cocuk",
        "girls",
        "girl",
    ],
    "Boys": [
        "erkek çocuk",
        "erkek cocuk",
        "boys",
        "boy",
    ],
    "Kids": [
        "çocuk",
        "cocuk",
        "kids",
        "bebek",
        "baby",
    ],
}

SHOE_TYPE_KEYWORDS = {
    "sneaker": [
        "sneaker",
        "spor ayakkabı",
        "spor ayakkabi",
        "koşu ayakkabısı",
        "kosu ayakkabisi",
        "yürüyüş ayakkabısı",
        "yuruyus ayakkabisi",
        "runner",
    ],
    "boot": [
        "bot",
        "çizme",
        "cizme",
        "boot",
    ],
    "sandal": [
        "sandalet",
        "sandal",
    ],
    "slipper": [
        "terlik",
        "slipper",
    ],
    "flat": [
        "babet",
        "flat",
    ],
    "heel": [
        "topuklu",
        "heel",
        "stiletto",
    ],
    "formal_shoe": [
        "klasik ayakkabı",
        "klasik ayakkabi",
        "loafer",
        "mokasen",
        "oxford",
    ],
}

SIGNAL_KEYWORDS = {
    "runs_small": [
        "küçük kalıp",
        "kucuk kalip",
        "kalıbı küçük",
        "kalibi kucuk",
        "küçük geldi",
        "kucuk geldi",
        "bir numara büyük",
        "1 numara büyük",
        "numara büyük alın",
        "numara buyuk alin",
        "dar geldi",
    ],
    "runs_large": [
        "büyük kalıp",
        "buyuk kalip",
        "kalıbı büyük",
        "kalibi buyuk",
        "büyük geldi",
        "buyuk geldi",
        "bir numara küçük",
        "1 numara küçük",
        "numara küçük alın",
        "numara kucuk alin",
        "bol geldi",
    ],
    "narrow_fit": [
        "dar kalıp",
        "dar kalip",
        "ayağı sıktı",
        "ayagi sikti",
        "sıkıyor",
        "sikiyor",
        "taraklı ayağa",
        "tarakli ayaga",
    ],
    "wide_feet_issue": [
        "taraklı ayak",
        "tarakli ayak",
        "geniş ayak",
        "genis ayak",
        "ayağım geniş",
        "ayagim genis",
    ],
    "comfort_positive": [
        "rahat",
        "konforlu",
        "yumuşak",
        "yumusak",
        "hafif",
        "ayağımı yormadı",
        "ayagimi yormadi",
    ],
    "comfort_negative": [
        "rahatsız",
        "rahatsiz",
        "sert",
        "vuruyor",
        "vurdu",
        "acıttı",
        "acitti",
        "su topladı",
        "su topladi",
        "ağrıttı",
        "agritti",
    ],
    "cheap_material": [
        "kalitesiz",
        "ucuz duruyor",
        "malzemesi kötü",
        "malzemesi kotu",
        "plastik gibi",
    ],
    "low_durability": [
        "yırtıldı",
        "yirtildi",
        "açıldı",
        "acildi",
        "koptu",
        "dayanıklı değil",
        "dayanikli degil",
        "hemen bozuldu",
    ],
    "slippery_sole": [
        "kaydırıyor",
        "kaydiriyor",
        "tabanı kayıyor",
        "tabani kayiyor",
        "zeminde kayıyor",
        "zeminde kayiyor",
    ],
    "color_mismatch": [
        "rengi farklı",
        "rengi farkli",
        "fotoğraftaki gibi değil",
        "fotograftaki gibi degil",
        "renk farklı",
        "renk farkli",
    ],
}


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def slugify(value: str) -> str:
    value = value.lower()
    replacements = {
        "ı": "i",
        "ğ": "g",
        "ü": "u",
        "ş": "s",
        "ö": "o",
        "ç": "c",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:80] or "product"


def normalize_url(url: str) -> str:
    full_url = urljoin("https://www.trendyol.com", url)
    return full_url.split("?")[0].split("#")[0]


def extract_content_id(url: str) -> str:
    match = re.search(r"-p-(\d+)", url)
    return match.group(1) if match else slugify(url)


def parse_price(text: str) -> float:
    if not text:
        return 0.0
    text = text.replace("TL", "").replace("₺", "").strip()
    text = text.replace(".", "").replace(",", ".")
    match = re.search(r"\d+(\.\d+)?", text)
    return round(float(match.group(0)), 2) if match else 0.0


def parse_number(text: str) -> int:
    if not text:
        return 0
    text = text.replace(".", "").replace(",", "")
    match = re.search(r"\d+", text)
    return int(match.group(0)) if match else 0


def parse_rating(text: str) -> float:
    if not text:
        return 0.0
    match = re.search(r"\d+([,.]\d+)?", text)
    return round(float(match.group(0).replace(",", ".")), 2) if match else 0.0


def load_json_file(path: Path, fallback):
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def save_json_file(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def polite_sleep(delay_min: float, delay_max: float) -> None:
    time.sleep(random.uniform(delay_min, delay_max))


def page_looks_blocked(page, response=None) -> bool:
    if response and response.status in [401, 403, 429]:
        return True
    try:
        text = (page.title() + " " + page.locator("body").inner_text(timeout=2000)).lower()
    except Exception:
        return False
    return any(marker in text for marker in BLOCK_MARKERS)


def goto_page(page, url: str):
    response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(2500)
    if page_looks_blocked(page, response):
        raise RuntimeError(
            "Page appears blocked or rate-limited. Stop the run and try later with a smaller limit."
        )
    return response


def collect_json_ld(soup: BeautifulSoup) -> list[dict]:
    items = []
    for tag in soup.select('script[type="application/ld+json"]'):
        raw = tag.string or tag.get_text()
        if not raw:
            continue
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                items.extend(item for item in data if isinstance(item, dict))
            elif isinstance(data, dict):
                items.append(data)
        except Exception:
            continue
    return items


def find_product_json_ld(soup: BeautifulSoup) -> dict:
    for item in collect_json_ld(soup):
        item_type = item.get("@type")
        if item_type == "Product" or (isinstance(item_type, list) and "Product" in item_type):
            return item
    return {}


def find_initial_state(soup: BeautifulSoup) -> dict:
    patterns = [
        r"window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*(\{.*?\});",
        r"window\.__INITIAL_STATE__\s*=\s*(\{.*?\});",
    ]
    script_text = "\n".join(script.get_text() for script in soup.select("script"))
    for pattern in patterns:
        match = re.search(pattern, script_text, flags=re.DOTALL)
        if not match:
            continue
        try:
            return json.loads(match.group(1))
        except Exception:
            continue
    return {}


def walk_dicts(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_dicts(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_dicts(child)


def first_value_from_dicts(root: dict, keys: list[str]):
    for item in walk_dicts(root):
        for key in keys:
            if key in item and item[key] not in [None, "", []]:
                return item[key]
    return None


def get_meta(soup: BeautifulSoup, key: str) -> str:
    tag = soup.select_one(f'meta[property="{key}"]') or soup.select_one(f'meta[name="{key}"]')
    return clean_text(tag.get("content", "")) if tag else ""


def collect_product_urls_from_collection(page, collection_url: str, max_products: int) -> list[str]:
    print(f"Opening collection: {collection_url}")
    goto_page(page, collection_url)
    product_urls = set()
    stagnant_rounds = 0
    previous_count = 0

    for _ in range(20):
        anchors = page.locator("a[href*='-p-']")
        count = anchors.count()

        for index in range(count):
            try:
                href = anchors.nth(index).get_attribute("href")
            except Exception:
                continue
            if href and "-p-" in href:
                product_urls.add(normalize_url(href))
            if len(product_urls) >= max_products:
                return sorted(product_urls)

        if len(product_urls) == previous_count:
            stagnant_rounds += 1
        else:
            stagnant_rounds = 0
            previous_count = len(product_urls)

        if stagnant_rounds >= 4:
            break

        page.mouse.wheel(0, 1800)
        page.wait_for_timeout(1200)

    return sorted(product_urls)


def read_urls(path: Path) -> list[str]:
    return [
        normalize_url(line.strip())
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def absolute_image_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return "https://cdn.dsmcdn.com" + url
    return url


def normalize_image_url(url: str) -> str:
    url = absolute_image_url(url)
    if not url:
        return ""
    return url.split("?")[0]


def collect_images(soup: BeautifulSoup, product_ld: dict, initial_state: dict) -> list[str]:
    image_urls = []
    raw_image = product_ld.get("image")
    if isinstance(raw_image, str):
        image_urls.append(raw_image)
    elif isinstance(raw_image, list):
        image_urls.extend(item for item in raw_image if isinstance(item, str))

    state_images = first_value_from_dicts(initial_state, ["images", "imageUrls", "gallery"])
    if isinstance(state_images, list):
        for item in state_images:
            if isinstance(item, str):
                image_urls.append(item)
            elif isinstance(item, dict):
                url = item.get("url") or item.get("src") or item.get("imageUrl")
                if url:
                    image_urls.append(url)

    og_image = get_meta(soup, "og:image")
    if og_image:
        image_urls.append(og_image)

    for img in soup.select("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-original")
        if src and ("cdn.dsmcdn.com" in src or src.startswith("//cdn.dsmcdn.com") or src.startswith("/ty")):
            image_urls.append(src)

    normalized = []
    seen = set()
    for url in image_urls:
        url = normalize_image_url(url)
        if not url or url in seen:
            continue
        seen.add(url)
        normalized.append(url)
    return normalized[:16]


def extract_basic_product(page, url: str) -> dict:
    soup = BeautifulSoup(page.content(), "html.parser")
    product_ld = find_product_json_ld(soup)
    initial_state = find_initial_state(soup)

    title = clean_text(
        product_ld.get("name", "")
        or first_value_from_dicts(initial_state, ["name", "title", "productName"])
        or get_meta(soup, "og:title")
    )
    if not title:
        try:
            title = clean_text(page.locator("h1").first.inner_text(timeout=2500))
        except Exception:
            title = ""

    brand = ""
    raw_brand = product_ld.get("brand")
    if isinstance(raw_brand, dict):
        brand = clean_text(raw_brand.get("name", ""))
    elif isinstance(raw_brand, str):
        brand = clean_text(raw_brand)
    if not brand:
        brand = clean_text(str(first_value_from_dicts(initial_state, ["brandName", "brand"]) or ""))
    if brand.startswith("{") or brand.startswith("["):
        brand = ""
    if not brand:
        for selector in [".product-brand-name", ".pr-new-br a", "a[href*='-x-b-']"]:
            try:
                brand = clean_text(page.locator(selector).first.inner_text(timeout=1500))
                if brand:
                    break
            except Exception:
                continue

    description = clean_text(
        product_ld.get("description", "")
        or first_value_from_dicts(initial_state, ["description", "productDescription"])
        or get_meta(soup, "og:description")
    )

    price = 0.0
    offers = product_ld.get("offers")
    if isinstance(offers, dict):
        price = parse_price(str(offers.get("price", "")))
    if not price:
        price_value = first_value_from_dicts(initial_state, ["salePrice", "sellingPrice", "price"])
        if isinstance(price_value, dict):
            price_value = price_value.get("value") or price_value.get("text")
        price = parse_price(str(price_value or ""))
    if not price:
        for selector in [".prc-dsc", ".prc-slg", ".product-price-container", "[class*='price']"]:
            try:
                price = parse_price(page.locator(selector).first.inner_text(timeout=1500))
                if price:
                    break
            except Exception:
                continue

    rating = 0.0
    review_count = 0
    aggregate = product_ld.get("aggregateRating")
    if isinstance(aggregate, dict):
        rating = parse_rating(str(aggregate.get("ratingValue", "")))
        review_count = parse_number(str(aggregate.get("reviewCount", "")))
    if not rating:
        rating = parse_rating(str(first_value_from_dicts(initial_state, ["ratingScore", "averageRating"]) or ""))
    if not review_count:
        review_count = parse_number(str(first_value_from_dicts(initial_state, ["totalReviewCount", "reviewCount"]) or ""))
    if not rating:
        for selector in [".rating-score", ".ratings-score", "[class*='rating-score']"]:
            try:
                rating = parse_rating(page.locator(selector).first.inner_text(timeout=1500))
                if rating:
                    break
            except Exception:
                continue

    product_text = f"{title} {description} {brand}"
    return {
        "source_url": normalize_url(url),
        "content_id": extract_content_id(url),
        "title": title,
        "brand": brand or "Unknown Brand",
        "description": description,
        "price": price,
        "currency": "TRY",
        "rating": rating,
        "review_count": review_count,
        "remote_images": collect_images(soup, product_ld, initial_state),
        "shoe_type": infer_shoe_type(product_text),
        "gender": infer_gender(product_text),
    }


def click_reviews_if_available(page) -> None:
    candidates = [
        "text=Ürün Yorumları",
        "text=Yorumlar",
        "text=Değerlendirmeler",
        "a[href*='yorum']",
        "a[href*='review']",
    ]
    for selector in candidates:
        try:
            element = page.locator(selector).first
            if element.count():
                element.click(timeout=2000)
                page.wait_for_timeout(2500)
                return
        except Exception:
            continue


def review_candidate_urls(product_url: str) -> list[str]:
    clean_url = normalize_url(product_url)
    return [
        clean_url,
        f"{clean_url}/yorumlar",
        f"{clean_url}?boutiqueId=1&merchantId=1",
    ]


def extract_reviews_from_current_page(page, limit: int) -> list[dict]:
    for _ in range(4):
        page.mouse.wheel(0, 1700)
        page.wait_for_timeout(800)

    selectors = [
        ".comment-text",
        ".review-comment",
        ".comment",
        "[class*='comment-text']",
        "[class*='review-comment']",
        "[class*='comment'] p",
    ]
    raw_texts = []

    for selector in selectors:
        try:
            elements = page.locator(selector)
            count = min(elements.count(), limit * 4)
            for index in range(count):
                text = clean_text(elements.nth(index).inner_text(timeout=1000))
                if is_probable_review(text) and text not in raw_texts:
                    raw_texts.append(text)
                if len(raw_texts) >= limit:
                    break
            if len(raw_texts) >= limit:
                break
        except Exception:
            continue

    return [build_review(text) for text in raw_texts[:limit]]


def extract_reviews(page, product_url: str, limit: int) -> list[dict]:
    reviews = []
    for url in review_candidate_urls(product_url):
        try:
            goto_page(page, url)
            click_reviews_if_available(page)
            reviews = extract_reviews_from_current_page(page, limit)
            if reviews:
                return reviews
        except (PlaywrightTimeoutError, RuntimeError):
            raise
        except Exception:
            continue
    return reviews


def is_probable_review(text: str) -> bool:
    if len(text) < 18 or len(text) > 1200:
        return False
    lower = text.lower()
    noise = [
        "sepete ekle",
        "tükendi",
        "tukendi",
        "favorilere ekle",
        "satıcı",
        "satici",
        "teslimat",
        "kampanya",
        "ürün bilgileri",
        "urun bilgileri",
    ]
    return not any(item in lower for item in noise)


def extract_review_signals(text: str) -> list[str]:
    lower = text.lower()
    signals = []
    for signal, keywords in SIGNAL_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            signals.append(signal)
    return signals


def infer_sentiment(text: str, signals: list[str]) -> str:
    lower = text.lower()
    negative_signals = {
        "runs_small",
        "runs_large",
        "narrow_fit",
        "wide_feet_issue",
        "comfort_negative",
        "cheap_material",
        "low_durability",
        "slippery_sole",
        "color_mismatch",
    }
    if any(signal in negative_signals for signal in signals):
        return "negative"
    if any(word in lower for word in ["çok iyi", "cok iyi", "harika", "beğendim", "begendim", "rahat", "kaliteli"]):
        return "positive"
    return "neutral"


def build_review(text: str) -> dict:
    signals = extract_review_signals(text)
    sentiment = infer_sentiment(text, signals)
    rating = 5.0 if sentiment == "positive" else 2.0 if sentiment == "negative" else 3.0
    return {
        "rating": rating,
        "text": text,
        "sentiment": sentiment,
        "signals": signals,
    }


def infer_gender(text: str) -> str:
    lower = text.lower()
    for gender, keywords in GENDER_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return gender
    return "Unisex"


def infer_shoe_type(text: str) -> str:
    lower = text.lower()
    for shoe_type, keywords in SHOE_TYPE_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return shoe_type
    return "sneaker"


def infer_base_colour(text: str) -> str:
    colours = {
        "Black": ["siyah", "black"],
        "White": ["beyaz", "white"],
        "Grey": ["gri", "gray", "grey"],
        "Blue": ["mavi", "blue"],
        "Red": ["kırmızı", "kirmizi", "red"],
        "Green": ["yeşil", "yesil", "green"],
        "Brown": ["kahverengi", "brown"],
        "Beige": ["bej", "beige"],
        "Pink": ["pembe", "pink"],
        "Purple": ["mor", "purple"],
    }
    lower = text.lower()
    for colour, keywords in colours.items():
        if any(keyword in lower for keyword in keywords):
            return colour
    return ""


def infer_usage(text: str, shoe_type: str) -> str:
    lower = text.lower()
    if any(word in lower for word in ["koşu", "kosu", "spor", "training", "running"]):
        return "Sports"
    if shoe_type in ["formal_shoe", "heel"]:
        return "Formal"
    return "Casual"


def infer_tags(title: str, description: str, reviews: list[dict], shoe_type: str) -> list[str]:
    text = f"{title} {description} " + " ".join(review["text"] for review in reviews)
    lower = text.lower()
    tags = set()

    if any(word in lower for word in ["rahat", "konfor", "yumuşak", "yumusak", "hafif"]):
        tags.add("comfort")
    if any(word in lower for word in ["spor", "sneaker", "koşu", "kosu", "yürüyüş", "yuruyus"]):
        tags.add("sporty")
    if any(word in lower for word in ["şık", "sik", "tarz", "kombin", "güzel", "guzel"]):
        tags.add("style")
    if any(word in lower for word in ["uygun", "fiyat", "indirim", "performans", "fp"]):
        tags.add("budget")
    if any(word in lower for word in ["günlük", "gunluk", "casual"]):
        tags.add("daily")
    if shoe_type in ["heel", "formal_shoe", "flat"]:
        tags.add("style")
    if shoe_type in ["sandal", "slipper"]:
        tags.add("daily")

    if not tags:
        tags.update(["daily", "style"])
    return sorted(tags)


def infer_personas(tags: list[str]) -> list[str]:
    personas = set()
    if "style" in tags or "sporty" in tags:
        personas.add("style")
    if "comfort" in tags or "daily" in tags:
        personas.add("comfort")
    if "budget" in tags:
        personas.add("budget")
    return sorted(personas or {"style", "comfort"})


def build_known_issues(reviews: list[dict]) -> list[str]:
    issue_signals = {
        "runs_small",
        "runs_large",
        "narrow_fit",
        "wide_feet_issue",
        "comfort_negative",
        "cheap_material",
        "low_durability",
        "slippery_sole",
        "color_mismatch",
    }
    detected = set()
    for review in reviews:
        for signal in review.get("signals", []):
            if signal in issue_signals:
                detected.add(signal)
    return sorted(detected)


def build_return_risk_signals(reviews: list[dict]) -> dict:
    counter = {
        "runs_small_mentions": 0,
        "runs_large_mentions": 0,
        "wide_feet_mentions": 0,
        "comfort_complaints": 0,
        "quality_complaints": 0,
        "durability_complaints": 0,
        "slippery_sole_mentions": 0,
        "color_mismatch_mentions": 0,
    }
    for review in reviews:
        signals = set(review.get("signals", []))
        if "runs_small" in signals:
            counter["runs_small_mentions"] += 1
        if "runs_large" in signals:
            counter["runs_large_mentions"] += 1
        if "wide_feet_issue" in signals:
            counter["wide_feet_mentions"] += 1
        if "comfort_negative" in signals:
            counter["comfort_complaints"] += 1
        if "cheap_material" in signals:
            counter["quality_complaints"] += 1
        if "low_durability" in signals:
            counter["durability_complaints"] += 1
        if "slippery_sole" in signals:
            counter["slippery_sole_mentions"] += 1
        if "color_mismatch" in signals:
            counter["color_mismatch_mentions"] += 1
    return counter


def infer_fit_type(known_issues: list[str]) -> str:
    if "narrow_fit" in known_issues or "wide_feet_issue" in known_issues:
        return "narrow"
    if "runs_large" in known_issues:
        return "large"
    if "runs_small" in known_issues:
        return "small"
    return "regular"


def build_sales_signals(known_issues: list[str], rating: float) -> dict:
    return_rate = 0.08
    if len(known_issues) >= 3 or rating < 3.8:
        return_rate = 0.25
    elif known_issues:
        return_rate = 0.16
    return {
        "views": 1000,
        "clicks": 95,
        "cart_adds": 24,
        "sales": 6,
        "return_rate": return_rate,
    }


def build_visual_signals(local_images: list[str]) -> dict:
    if len(local_images) >= 4:
        return {
            "image_quality": "high",
            "image_issue": "",
            "recommendation": "Product image coverage looks acceptable.",
        }
    if len(local_images) >= 2:
        return {
            "image_quality": "medium",
            "image_issue": "limited_angles",
            "recommendation": "Add more side-view, sole and on-foot images if available.",
        }
    return {
        "image_quality": "low" if local_images else "unknown",
        "image_issue": "single_image_only" if local_images else "missing_image",
        "recommendation": "Add more product angles and close-up images.",
    }


def build_market_signals(shoe_type: str, price: float) -> dict:
    averages = {
        "sneaker": 1800,
        "boot": 2500,
        "heel": 1700,
        "sandal": 1100,
        "slipper": 800,
        "flat": 1200,
        "formal_shoe": 2200,
    }
    return {
        "avg_category_price": averages.get(shoe_type, price or 1500),
        "competitor_rating_avg": 4.3,
        "competitor_common_strengths": [
            "clear size guide",
            "real customer photos",
            "comfort-focused reviews",
        ],
    }


def download_image(url: str, target: Path) -> bool:
    if target.exists() and target.stat().st_size > 0:
        return True
    try:
        response = requests.get(url, headers=REQUEST_HEADERS, timeout=25)
        response.raise_for_status()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(response.content)
        return True
    except Exception as error:
        print(f"Image skipped: {url} ({error})")
        return False


def download_images(remote_images: list[str], product_id: str, image_dir: Path, skip_images: bool) -> list[str]:
    if skip_images:
        return []
    local_images = []
    product_dir = image_dir / product_id
    for index, image_url in enumerate(remote_images, start=1):
        parsed = urlparse(image_url)
        suffix = Path(parsed.path).suffix.lower()
        if suffix not in [".jpg", ".jpeg", ".png", ".webp"]:
            suffix = ".jpg"
        filename = f"{index:02d}{suffix}"
        target = product_dir / filename
        if download_image(image_url, target):
            local_images.append(f"/images/trendyol/{product_id}/{filename}")
    return local_images


def build_project_product(product_index: int, basic: dict, reviews: list[dict], local_images: list[str]) -> dict:
    content_id = basic["content_id"]
    product_id = f"trendyol_{product_index:03d}_{content_id}"
    product_text = f"{basic['title']} {basic['description']}"
    known_issues = build_known_issues(reviews)
    shoe_type = basic["shoe_type"]
    tags = infer_tags(basic["title"], basic["description"], reviews, shoe_type)
    rating = basic["rating"]
    if not rating and reviews:
        rating = round(sum(review["rating"] for review in reviews) / len(reviews), 2)

    return {
        "id": product_id,
        "title": basic["title"],
        "brand": basic["brand"],
        "category": "Shoes",
        "shoe_type": shoe_type,
        "gender": basic["gender"],
        "base_colour": infer_base_colour(product_text),
        "usage": infer_usage(product_text, shoe_type),
        "price": basic["price"],
        "currency": basic["currency"],
        "rating": rating,
        "review_count": basic["review_count"] or len(reviews),
        "description": basic["description"],
        "features": [],
        "tags": tags,
        "target_personas": infer_personas(tags),
        "fit_type": infer_fit_type(known_issues),
        "usage_type": tags,
        "known_issues": known_issues,
        "return_risk_signals": build_return_risk_signals(reviews),
        "sales_signals": build_sales_signals(known_issues, rating),
        "visual_signals": build_visual_signals(local_images),
        "market_signals": build_market_signals(shoe_type, basic["price"]),
        "reviews": reviews,
        "image": local_images[0] if local_images else "",
        "gallery": local_images,
        "source_trace": {
            "description_source": "trendyol_visible_page_import",
            "myntra_match_type": "not_applicable",
            "amazon_review_strategy": "not_applicable",
            "source_url": basic["source_url"],
            "trendyol_content_id": content_id,
            "remote_images": basic["remote_images"],
        },
    }


def import_one_product(page, url: str, product_index: int, args) -> dict:
    print(f"[{product_index}] Product: {url}")
    goto_page(page, url)
    basic = extract_basic_product(page, url)
    product_id = f"trendyol_{product_index:03d}_{basic['content_id']}"
    local_images = download_images(
        remote_images=basic["remote_images"],
        product_id=product_id,
        image_dir=Path(args.image_dir),
        skip_images=args.skip_images,
    )
    reviews = extract_reviews(page, url, args.limit_reviews)
    return build_project_product(product_index, basic, reviews, local_images)


def merge_products(existing: list[dict], imported: list[dict]) -> list[dict]:
    by_source = {}
    result = []
    for product in existing + imported:
        source_url = product.get("source_trace", {}).get("source_url") or product.get("id")
        if source_url in by_source:
            result[by_source[source_url]] = product
        else:
            by_source[source_url] = len(result)
            result.append(product)
    return result


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Import selected Trendyol collection or product URLs into the project Product JSON format."
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--collection", help="Public Trendyol collection URL")
    source.add_argument("--urls", help="Text file with one Trendyol product URL per line")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_FILE), help="Output JSON path")
    parser.add_argument("--cache", default=str(DEFAULT_CACHE_FILE), help="Import cache JSON path")
    parser.add_argument("--image-dir", default=str(DEFAULT_IMAGE_DIR), help="Downloaded image directory")
    parser.add_argument("--max-products", type=int, default=30)
    parser.add_argument("--limit-reviews", type=int, default=20)
    parser.add_argument("--delay-min", type=float, default=7.0)
    parser.add_argument("--delay-max", type=float, default=13.0)
    parser.add_argument("--headful", action="store_true", help="Show browser window")
    parser.add_argument("--append", action="store_true", help="Append/merge into existing output")
    parser.add_argument("--skip-images", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Collect URLs only, do not import products")
    return parser


def main() -> None:
    args = build_arg_parser().parse_args()
    output_path = Path(args.output)
    cache_path = Path(args.cache)
    cache = load_json_file(cache_path, {})
    imported_products = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headful)
        context = browser.new_context(
            viewport={"width": 1440, "height": 1200},
            user_agent=REQUEST_HEADERS["User-Agent"],
            locale="tr-TR",
        )
        page = context.new_page()

        if args.collection:
            urls = collect_product_urls_from_collection(page, args.collection, args.max_products)
        else:
            urls = read_urls(Path(args.urls))[: args.max_products]

        print(f"Collected product URLs: {len(urls)}")
        if args.dry_run:
            for url in urls:
                print(url)
            browser.close()
            return

        for index, url in enumerate(urls, start=1):
            cache_key = normalize_url(url)
            if cache_key in cache:
                print(f"[{index}] Cache hit: {url}")
                imported_products.append(cache[cache_key])
                continue

            try:
                product = import_one_product(page, url, index, args)
                imported_products.append(product)
                cache[cache_key] = product
                save_json_file(cache_path, cache)
                save_json_file(output_path, imported_products)
            except RuntimeError as error:
                print(f"Stopped: {error}")
                break
            except Exception as error:
                print(f"Skipped {url}: {error}")

            polite_sleep(args.delay_min, args.delay_max)

        browser.close()

    if args.append and output_path.exists():
        existing = load_json_file(output_path, [])
        imported_products = merge_products(existing, imported_products)

    save_json_file(output_path, imported_products)
    print(f"Done. Products written: {len(imported_products)}")
    print(f"Output: {output_path}")
    print(f"Images: {Path(args.image_dir)}")


if __name__ == "__main__":
    main()
