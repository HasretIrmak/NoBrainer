import csv
import gzip
import json
import random
import shutil
from pathlib import Path
from statistics import mean


PROJECT_ROOT = Path(__file__).resolve().parents[2]

RAW_DATA_DIR = PROJECT_ROOT / "raw_data"
AMAZON_DIR = RAW_DATA_DIR / "amazon_review_2023"
MYNTRA_DIR = RAW_DATA_DIR / "myntra"
FASHION_DIR = RAW_DATA_DIR / "fashion_images"

OUTPUT_JSON = PROJECT_ROOT / "backend" / "data" / "products.json"
FRONTEND_IMAGE_DIR = PROJECT_ROOT / "frontend" / "public" / "images" / "products"

TARGET_PRODUCT_COUNT = 80
MAX_PRODUCTS_PER_SHOE_TYPE = 15

MAX_REVIEWS_PER_SHOE_TYPE = 450
REVIEWS_PER_PRODUCT_MIN = 6
REVIEWS_PER_PRODUCT_MAX = 12


ARTICLE_TYPE_TO_SHOE_TYPE = {
    "Sports Shoes": "sneaker",
    "Casual Shoes": "sneaker",
    "Formal Shoes": "formal_shoe",
    "Heels": "heel",
    "Flats": "flat",
    "Boots": "boot",
    "Booties": "boot",
    "Sandals": "sandal",
    "Flip Flops": "slipper",
}


SHOE_TYPE_KEYWORDS = {
    "sneaker": [
        "sneaker", "sneakers", "running shoe", "running shoes",
        "walking shoe", "walking shoes", "sports shoe", "sports shoes",
        "tennis shoe", "tennis shoes", "trainer", "trainers",
        "athletic shoe", "athletic shoes",
    ],
    "boot": [
        "boot", "boots", "ankle boot", "ankle boots",
        "winter boot", "winter boots", "hiking boot", "hiking boots",
    ],
    "heel": [
        "heel", "heels", "high heel", "high heels",
        "pumps", "stiletto", "stilettos",
    ],
    "sandal": [
        "sandal", "sandals", "open toe", "open-toe",
        "strap sandal", "strap sandals",
    ],
    "slipper": [
        "slipper", "slippers", "flip flop", "flip-flop",
        "flip flops", "slides", "slider", "sliders",
    ],
    "flat": [
        "flat", "flats", "ballet flat", "ballet flats",
    ],
    "formal_shoe": [
        "formal shoe", "formal shoes", "dress shoe", "dress shoes",
        "loafer", "loafers", "oxford", "oxfords",
        "business shoe", "business shoes",
    ],
}


GENERAL_SHOE_WORDS = [
    "shoe", "shoes", "foot", "feet", "fit", "fits", "size", "sizing",
    "sole", "heel", "toe", "walking", "walk", "comfortable", "uncomfortable",
]


BANNED_REVIEW_WORDS = [
    "scrub", "scrubs", "pants", "jeans", "shirt", "dress", "bra",
    "sleeve", "waist", "inseam", "pocket", "fabric", "skirt",
    "jacket", "coat", "shorts", "leggings", "sock", "socks",
    "stocking", "stockings", "underwear", "compression sock", "wool socks",
]


MYNTRA_BANNED_WORDS = [
    "shirt", "shirts", "t-shirt", "tshirt", "top", "tops", "kurta",
    "dress", "jeans", "pants", "trousers", "shorts", "skirt",
    "jacket", "coat", "bra", "brief", "briefs", "socks", "sock",
    "watch", "watches", "bag", "bags", "belt", "wallet", "cap",
    "sunglasses", "leggings", "saree", "dupatta",
]


BRAND_STOPWORDS = {
    "men", "women", "boys", "girls", "kids", "unisex",
    "white", "black", "brown", "blue", "red", "green", "yellow",
    "grey", "gray", "pink", "purple", "orange", "navy",
    "casual", "formal", "sports", "running", "walking",
    "shoes", "shoe", "sandals", "sandal", "slippers", "slipper",
    "flip", "flops", "boots", "boot", "heels", "heel", "flats", "flat",
}


SHOE_TYPE_EXCLUSION_WORDS = {
    "sneaker": ["boot", "boots", "slipper", "slippers", "sandal", "sandals", "heel", "heels", "loafer", "loafers", "oxford", "oxfords", "sock", "socks"],
    "boot": ["sneaker", "sneakers", "slipper", "slippers", "sandal", "sandals", "heel", "heels", "loafer", "loafers", "sock", "socks"],
    "heel": ["sneaker", "sneakers", "boot", "boots", "slipper", "slippers", "sandal", "sandals", "loafer", "loafers", "sock", "socks"],
    "sandal": ["sneaker", "sneakers", "boot", "boots", "slipper", "slippers", "heel", "heels", "loafer", "loafers", "sock", "socks"],
    "slipper": ["sneaker", "sneakers", "boot", "boots", "sandal", "sandals", "heel", "heels", "loafer", "loafers", "sock", "socks"],
    "flat": ["sneaker", "sneakers", "boot", "boots", "slipper", "slippers", "sandal", "sandals", "heel", "heels", "loafer", "loafers", "sock", "socks"],
    "formal_shoe": ["sneaker", "sneakers", "boot", "boots", "slipper", "slippers", "sandal", "sandals", "heel", "heels", "sock", "socks"],
}


SIGNAL_KEYWORDS = {
    "runs_small": ["runs small", "run small", "too small", "tight", "size up", "sizing up", "order up", "small size"],
    "runs_large": ["runs large", "run large", "too big", "too large", "size down", "sizing down", "order down", "large size"],
    "narrow_fit": ["narrow", "tight fit", "too tight", "narrow fit", "pinch", "pinches"],
    "wide_feet_issue": ["wide feet", "wide foot", "too narrow", "not for wide feet"],
    "comfort_positive": ["comfortable", "comfy", "all day", "walking", "soft", "supportive", "cushion", "cushioned"],
    "comfort_negative": ["uncomfortable", "hurts", "hurt", "pain", "stiff", "blister", "blisters", "rubbed", "rubbing"],
    "cheap_material": ["cheap material", "poor quality", "bad quality", "feels cheap", "cheaply made"],
    "low_durability": ["not durable", "fell apart", "wore out", "broke", "torn", "cracked", "wearing down"],
    "slippery_sole": ["slippery", "no grip", "poor grip", "not enough traction"],
    "color_mismatch": ["color different", "not same color", "color mismatch", "different color"],
}


DEFAULT_PRICE_BY_SHOE_TYPE = {
    "sneaker": 2499,
    "boot": 3999,
    "heel": 2999,
    "sandal": 1499,
    "slipper": 999,
    "flat": 1799,
    "formal_shoe": 3499,
}


def find_first_file(base_dir: Path, patterns: list[str]) -> Path | None:
    for pattern in patterns:
        matches = list(base_dir.rglob(pattern))
        if matches:
            return matches[0]
    return None


def find_all_files(base_dir: Path, patterns: list[str]) -> list[Path]:
    files = []
    for pattern in patterns:
        files.extend(base_dir.rglob(pattern))
    return files


def open_jsonl_gz(path: Path):
    return gzip.open(path, "rt", encoding="utf-8", errors="ignore")


def safe_get(row: dict, keys: list[str], default=""):
    for key in keys:
        if key in row and row[key] not in [None, ""]:
            return row[key]
    return default


def normalize_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(str(item) for item in value)
    if isinstance(value, dict):
        return " ".join(str(v) for v in value.values())
    return str(value)


def clean_price(value, fallback: float) -> float:
    try:
        text = str(value)
        text = text.replace(",", "").replace("₹", "").replace("Rs.", "").replace("INR", "").strip()
        price = float(text)
        return round(price, 2) if price > 0 else fallback
    except Exception:
        return fallback


def tokenize(text: str) -> set[str]:
    cleaned = ""
    for char in text.lower():
        cleaned += char if char.isalnum() or char.isspace() else " "
    return {word for word in cleaned.split() if len(word) >= 3}


def contains_any(text: str, keywords: list[str]) -> bool:
    lower = text.lower()
    return any(keyword in lower for keyword in keywords)


def infer_brand_from_title(title: str) -> str:
    words = title.strip().split()

    for word in words[:3]:
        cleaned = "".join(char for char in word if char.isalnum()).strip()

        if not cleaned:
            continue

        if cleaned.lower() in BRAND_STOPWORDS:
            continue

        if len(cleaned) >= 2:
            return cleaned

    return "Generic Footwear"


def resolve_brand(matched_myntra: dict | None, fashion_item: dict) -> str:
    title_brand = infer_brand_from_title(fashion_item["title"])

    if matched_myntra:
        myntra_brand = matched_myntra.get("brand", "").strip()

        if myntra_brand and myntra_brand != "Unknown Brand":
            return myntra_brand

    return title_brand


def detect_gender_from_text(text: str) -> str:
    lower = f" {text.lower()} "
    if " women " in lower or " women's " in lower or " woman " in lower:
        return "Women"
    if " men " in lower or " men's " in lower or " man " in lower:
        return "Men"
    if " girls " in lower or " girl " in lower:
        return "Girls"
    if " boys " in lower or " boy " in lower:
        return "Boys"
    if " kids " in lower or " kid " in lower:
        return "Kids"
    return "Unisex"


def detect_shoe_type_from_article_type(article_type: str) -> str | None:
    return ARTICLE_TYPE_TO_SHOE_TYPE.get(article_type)


def detect_shoe_type_from_text(text: str) -> str | None:
    lower = text.lower()
    priority_order = ["formal_shoe", "sneaker", "boot", "heel", "sandal", "slipper", "flat"]

    for shoe_type in priority_order:
        if any(keyword in lower for keyword in SHOE_TYPE_KEYWORDS.get(shoe_type, [])):
            return shoe_type

    return None


def extract_review_signals(text: str) -> list[str]:
    text_lower = text.lower()
    signals = []

    for signal, keywords in SIGNAL_KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            signals.append(signal)

    return signals


def sentiment_from_rating(rating: float) -> str:
    if rating >= 4:
        return "positive"
    if rating <= 2:
        return "negative"
    return "neutral"


def is_clean_shoe_review(text: str, shoe_type: str) -> bool:
    lower = text.lower()

    if len(lower) < 40:
        return False
    if contains_any(lower, BANNED_REVIEW_WORDS):
        return False
    if contains_any(lower, SHOE_TYPE_EXCLUSION_WORDS.get(shoe_type, [])):
        return False
    if not contains_any(lower, SHOE_TYPE_KEYWORDS.get(shoe_type, [])):
        return False
    if not contains_any(lower, GENERAL_SHOE_WORDS):
        return False

    return True


def build_known_issues(reviews: list[dict]) -> list[str]:
    issue_signals = {
        "runs_small", "runs_large", "narrow_fit", "wide_feet_issue",
        "comfort_negative", "cheap_material", "low_durability",
        "slippery_sole", "color_mismatch",
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


def infer_tags(title: str, description: str, shoe_type: str, usage: str, reviews: list[dict]) -> list[str]:
    text = f"{title} {description} {shoe_type} {usage} "
    text += " ".join(review["text"] for review in reviews)
    text = text.lower()

    tags = set()

    if any(word in text for word in ["comfortable", "comfy", "walking", "all day", "soft", "cushion"]):
        tags.add("comfort")
    if any(word in text for word in ["daily", "everyday", "casual"]):
        tags.add("daily")
    if shoe_type == "sneaker" or any(word in text for word in ["running", "sport", "training", "gym"]):
        tags.add("sporty")
    if any(word in text for word in ["style", "stylish", "outfit", "looks", "fashion"]):
        tags.add("style")
    if any(word in text for word in ["cheap", "price", "value", "budget", "affordable"]):
        tags.add("budget")
    if shoe_type in ["heel", "formal_shoe", "flat"]:
        tags.add("style")
    if shoe_type in ["slipper", "sandal"]:
        tags.add("daily")

    if not tags:
        tags.add("daily")

    return sorted(tags)


def infer_personas(tags: list[str]) -> list[str]:
    personas = set()

    if "style" in tags or "sporty" in tags:
        personas.add("style")
    if "comfort" in tags or "daily" in tags:
        personas.add("comfort")
    if "budget" in tags:
        personas.add("budget")

    if not personas:
        personas.update(["style", "comfort"])

    return sorted(personas)


def build_sales_signals(rating: float, known_issues: list[str]) -> dict:
    views = random.randint(600, 3500)
    clicks = random.randint(60, max(80, int(views * 0.20)))
    cart_adds = random.randint(10, max(12, int(clicks * 0.35)))
    base_sales = random.randint(2, max(3, int(cart_adds * 0.45)))

    if rating < 3.8 or len(known_issues) >= 3:
        sales = max(1, int(base_sales * 0.55))
        return_rate = round(random.uniform(0.22, 0.38), 2)
    elif rating >= 4.4 and len(known_issues) <= 1:
        sales = max(3, int(base_sales * 1.2))
        return_rate = round(random.uniform(0.06, 0.16), 2)
    else:
        sales = base_sales
        return_rate = round(random.uniform(0.12, 0.26), 2)

    return {
        "views": views,
        "clicks": clicks,
        "cart_adds": cart_adds,
        "sales": sales,
        "return_rate": return_rate,
    }


def build_visual_signals(gallery: list[str]) -> dict:
    image_quality = random.choice(["high", "medium", "medium", "low"])

    if image_quality == "low":
        issue = "single_angle_or_low_detail"
        recommendation = "Add clear side-view, close-up material, and on-foot lifestyle images."
    elif not gallery:
        issue = "single_image_only"
        recommendation = "Add more product angles and lifestyle images to improve buyer confidence."
    else:
        issue = ""
        recommendation = "Product image coverage looks acceptable."

    return {
        "image_quality": image_quality,
        "image_issue": issue,
        "recommendation": recommendation,
    }


def build_market_signals(shoe_type: str) -> dict:
    strengths_by_type = {
        "sneaker": ["clear size guide", "comfort-focused reviews", "lifestyle photos"],
        "boot": ["durability claims", "weather protection details", "sole grip information"],
        "heel": ["heel height details", "comfort guidance", "occasion styling photos"],
        "sandal": ["strap comfort details", "sole flexibility info", "summer lifestyle images"],
        "slipper": ["softness details", "grip information", "home comfort positioning"],
        "flat": ["daily comfort positioning", "material close-ups", "true-to-size guidance"],
        "formal_shoe": ["premium material details", "occasion-based styling", "fit guidance"],
    }

    return {
        "avg_category_price": DEFAULT_PRICE_BY_SHOE_TYPE.get(shoe_type, 2499),
        "competitor_rating_avg": round(random.uniform(4.1, 4.6), 2),
        "competitor_common_strengths": strengths_by_type.get(
            shoe_type,
            ["clear size guide", "better product photos", "stronger review signals"],
        ),
    }


def load_fashion_products() -> list[dict]:
    styles_path = find_first_file(FASHION_DIR, ["styles.csv"])

    if not styles_path:
        raise RuntimeError("Fashion styles.csv bulunamadı.")

    image_files = {
        path.stem: path
        for path in find_all_files(FASHION_DIR, ["*.jpg", "*.jpeg", "*.png"])
    }

    products = []
    counts_by_type = {}

    print(f"Fashion styles.csv bulundu: {styles_path}")
    print(f"Fashion image dosyası sayısı: {len(image_files)}")

    with open(styles_path, "r", encoding="utf-8", errors="ignore", newline="") as file:
        reader = csv.DictReader(file)

        for row_number, row in enumerate(reader, start=2):
            master_category = safe_get(row, ["masterCategory"], default="")
            article_type = safe_get(row, ["articleType"], default="")
            shoe_type = detect_shoe_type_from_article_type(article_type)

            if master_category != "Footwear":
                continue
            if not shoe_type:
                continue
            if counts_by_type.get(shoe_type, 0) >= MAX_PRODUCTS_PER_SHOE_TYPE:
                continue

            image_id = str(safe_get(row, ["id"], default="")).strip()

            if image_id not in image_files:
                continue

            display_name = safe_get(row, ["productDisplayName"], default="").strip()

            if not display_name:
                continue

            products.append({
                "fashion_row": row_number,
                "image_id": image_id,
                "source_image_path": image_files[image_id],
                "title": display_name,
                "gender": safe_get(row, ["gender"], default="Unisex"),
                "base_colour": safe_get(row, ["baseColour"], default=""),
                "usage": safe_get(row, ["usage"], default="Casual"),
                "article_type": article_type,
                "shoe_type": shoe_type,
            })

            counts_by_type[shoe_type] = counts_by_type.get(shoe_type, 0) + 1

            if len(products) >= TARGET_PRODUCT_COUNT:
                break

    print(f"Fashion footwear ürün sayısı: {len(products)}")
    print(f"Shoe type dağılımı: {counts_by_type}")

    return products


def is_safe_myntra_footwear_row(raw_text: str, shoe_type: str) -> bool:
    lower = raw_text.lower()

    if contains_any(lower, MYNTRA_BANNED_WORDS):
        return False
    if not contains_any(lower, GENERAL_SHOE_WORDS):
        return False
    if not contains_any(lower, SHOE_TYPE_KEYWORDS.get(shoe_type, [])):
        return False

    return True


def load_myntra_products() -> list[dict]:
    csv_path = find_first_file(MYNTRA_DIR, ["*.csv"])

    if not csv_path:
        print("Myntra CSV bulunamadı. Fiyatlar fallback üretilecek.")
        return []

    print(f"Myntra CSV bulundu: {csv_path}")

    products = []
    skipped_dirty = 0

    with open(csv_path, "r", encoding="utf-8", errors="ignore", newline="") as file:
        reader = csv.DictReader(file)

        for row_number, row in enumerate(reader, start=2):
            combined_text = " ".join(normalize_text(value) for value in row.values())
            shoe_type = detect_shoe_type_from_text(combined_text)

            if not shoe_type:
                continue

            if not is_safe_myntra_footwear_row(combined_text, shoe_type):
                skipped_dirty += 1
                continue

            title = safe_get(row, [
                "product_name", "productName", "name", "title", "ProductName", "p_name",
            ], default="")

            if not title:
                title = safe_get(row, ["productDisplayName"], default="")

            if not title:
                continue

            brand = safe_get(row, [
                "brand", "brand_name", "Brand", "brandName",
            ], default="Unknown Brand")

            price_raw = safe_get(row, [
                "price", "selling_price", "discounted_price", "mrp", "Price",
            ], default="0")

            fallback_price = DEFAULT_PRICE_BY_SHOE_TYPE.get(shoe_type, 2499)
            price = clean_price(price_raw, fallback=fallback_price)

            description = safe_get(row, [
                "description", "product_description", "desc", "product_details", "Description",
            ], default=title)

            products.append({
                "myntra_row": row_number,
                "title": title,
                "brand": brand or "Unknown Brand",
                "price": price,
                "description": description or title,
                "shoe_type": shoe_type,
                "gender": detect_gender_from_text(combined_text),
                "raw_text": combined_text.lower(),
                "title_tokens": tokenize(title),
            })

    print(f"Myntra güvenli footwear adayı: {len(products)}")
    print(f"Myntra kirli/uygunsuz satır atlandı: {skipped_dirty}")

    return products


def is_safe_myntra_description(description: str, fashion_item: dict) -> bool:
    lower = description.lower()
    shoe_type = fashion_item["shoe_type"]

    if contains_any(lower, MYNTRA_BANNED_WORDS):
        return False
    if not contains_any(lower, GENERAL_SHOE_WORDS):
        return False
    if not contains_any(lower, SHOE_TYPE_KEYWORDS.get(shoe_type, [])):
        return False

    return True


def build_fallback_description(fashion_item: dict) -> str:
    return (
        f"{fashion_item['title']} is a {fashion_item['base_colour']} "
        f"{fashion_item['article_type'].lower()} designed for "
        f"{fashion_item['usage'].lower()} use."
    )


def match_myntra_product(fashion_item: dict, myntra_products: list[dict]) -> dict | None:
    if not myntra_products:
        return None

    shoe_type = fashion_item["shoe_type"]
    gender = fashion_item["gender"]
    colour = fashion_item["base_colour"].lower()
    usage = fashion_item["usage"].lower()
    fashion_title_tokens = tokenize(fashion_item["title"])
    gender_required = gender in ["Men", "Women", "Boys", "Girls"]

    best_item = None
    best_score = -1

    for item in myntra_products:
        if item["shoe_type"] != shoe_type:
            continue

        if gender_required and item["gender"] not in [gender, "Unisex"]:
            continue

        item_text = item["raw_text"]
        score = 50

        if item["gender"] == gender:
            score += 25
        if colour and colour in item_text:
            score += 12
        if usage and usage in item_text:
            score += 8

        overlap = len(fashion_title_tokens.intersection(item["title_tokens"]))
        score += overlap * 6

        if item["brand"] and item["brand"] != "Unknown Brand":
            score += 5
        if item["price"] > 0:
            score += 5

        if score > best_score:
            best_score = score
            best_item = item

    if best_score < 90:
        return None

    return best_item


def load_amazon_review_pools() -> dict[str, list[dict]]:
    review_path = find_first_file(AMAZON_DIR, [
        "Clothing_Shoes_and_Jewelry.jsonl.gz", "*Clothing*.jsonl.gz", "*Shoes*.jsonl.gz",
    ])

    if not review_path:
        print("Amazon review jsonl.gz bulunamadı. Review fallback üretilecek.")
        return {shoe_type: [] for shoe_type in SHOE_TYPE_KEYWORDS}

    print(f"Amazon review bulundu: {review_path}")

    pools = {shoe_type: [] for shoe_type in SHOE_TYPE_KEYWORDS}
    seen_texts = set()

    with open_jsonl_gz(review_path) as file:
        for row_number, line in enumerate(file, start=1):
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue

            text = normalize_text(safe_get(row, ["text", "review_text", "body"], default=""))
            title = normalize_text(safe_get(row, ["title", "summary"], default=""))
            review_text = f"{title}. {text}".strip(". ").strip()

            if len(review_text) < 40:
                continue

            normalized_key = review_text[:220].lower()

            if normalized_key in seen_texts:
                continue

            rating_raw = safe_get(row, ["rating", "overall", "stars"], default=3)

            try:
                rating = float(rating_raw)
            except Exception:
                rating = 3.0

            matched_any_pool = False

            for shoe_type in pools:
                if len(pools[shoe_type]) >= MAX_REVIEWS_PER_SHOE_TYPE:
                    continue

                if not is_clean_shoe_review(review_text, shoe_type):
                    continue

                signals = extract_review_signals(review_text)

                pools[shoe_type].append({
                    "rating": rating,
                    "text": review_text,
                    "sentiment": sentiment_from_rating(rating),
                    "signals": signals,
                    "source": "amazon_reviews_2023",
                    "source_row": row_number,
                })

                matched_any_pool = True
                break

            if matched_any_pool:
                seen_texts.add(normalized_key)

            if all(len(items) >= MAX_REVIEWS_PER_SHOE_TYPE for items in pools.values()):
                print("Tüm Amazon review havuzları yeterince doldu. Tarama durduruldu.")
                break

    print("Amazon review pool dağılımı:")

    for shoe_type, reviews in pools.items():
        print(f"  - {shoe_type}: {len(reviews)}")

    return pools


def build_fallback_reviews(shoe_type: str, title: str) -> list[dict]:
    base = [
        {
            "rating": 5.0,
            "text": f"{title} looks good and feels comfortable for daily use.",
            "sentiment": "positive",
            "signals": ["comfort_positive"],
        },
        {
            "rating": 4.0,
            "text": "The fit is mostly good, but checking the size guide before buying is helpful.",
            "sentiment": "positive",
            "signals": [],
        },
        {
            "rating": 4.0,
            "text": "Comfortable enough for walking and casual outfits.",
            "sentiment": "positive",
            "signals": ["comfort_positive"],
        },
    ]

    type_specific = {
        "sneaker": {
            "rating": 2.0,
            "text": "The sneaker feels a little narrow and may not be ideal for wide feet.",
            "sentiment": "negative",
            "signals": ["narrow_fit", "wide_feet_issue"],
        },
        "boot": {
            "rating": 3.0,
            "text": "The boots look durable, but the sole grip could be better on slippery ground.",
            "sentiment": "neutral",
            "signals": ["slippery_sole"],
        },
        "heel": {
            "rating": 2.0,
            "text": "The heels look stylish but become uncomfortable after long wear.",
            "sentiment": "negative",
            "signals": ["comfort_negative"],
        },
        "sandal": {
            "rating": 3.0,
            "text": "The sandals are nice for summer, but the strap can feel tight.",
            "sentiment": "neutral",
            "signals": ["narrow_fit"],
        },
        "slipper": {
            "rating": 3.0,
            "text": "The slippers are soft, but the sole may wear out with heavy use.",
            "sentiment": "neutral",
            "signals": ["low_durability"],
        },
        "flat": {
            "rating": 3.0,
            "text": "The flats are easy to wear, but cushioning could be better.",
            "sentiment": "neutral",
            "signals": ["comfort_negative"],
        },
        "formal_shoe": {
            "rating": 3.0,
            "text": "The formal shoes look premium, but they need some break-in time.",
            "sentiment": "neutral",
            "signals": ["comfort_negative"],
        },
    }

    if shoe_type in type_specific:
        base.append(type_specific[shoe_type])

    return base


def prepare_review_pools_for_sampling(review_pools: dict[str, list[dict]]) -> dict[str, list[dict]]:
    prepared = {}

    for shoe_type, reviews in review_pools.items():
        copied = reviews[:]
        random.shuffle(copied)
        prepared[shoe_type] = copied

    return prepared


def select_reviews_for_product(shoe_type: str, title: str, sampling_pools: dict[str, list[dict]]) -> list[dict]:
    pool = sampling_pools.get(shoe_type, [])
    requested_count = random.randint(REVIEWS_PER_PRODUCT_MIN, REVIEWS_PER_PRODUCT_MAX)

    if len(pool) >= REVIEWS_PER_PRODUCT_MIN:
        selected = []
        for _ in range(min(len(pool), requested_count)):
            selected.append(pool.pop())
    else:
        selected = build_fallback_reviews(shoe_type, title)

    return [
        {
            "rating": review["rating"],
            "text": review["text"],
            "sentiment": review["sentiment"],
            "signals": review["signals"],
        }
        for review in selected
    ]


def copy_frontend_image(source_path: Path, product_id: str) -> str:
    FRONTEND_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    extension = source_path.suffix.lower() or ".jpg"
    target_path = FRONTEND_IMAGE_DIR / f"{product_id}{extension}"

    shutil.copyfile(source_path, target_path)

    return f"/images/products/{target_path.name}"


def clear_old_product_images():
    FRONTEND_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    for path in FRONTEND_IMAGE_DIR.glob("shoe_*.*"):
        if path.is_file():
            path.unlink()


def build_products_json():
    random.seed(42)

    print("Yeni footwear products.json veri hazırlama başladı...")

    fashion_products = load_fashion_products()
    myntra_products = load_myntra_products()
    amazon_review_pools = load_amazon_review_pools()
    sampling_pools = prepare_review_pools_for_sampling(amazon_review_pools)

    if not fashion_products:
        raise RuntimeError("Fashion dataset içinde uygun Footwear ürünü bulunamadı.")

    clear_old_product_images()
    random.shuffle(fashion_products)

    products = []

    for index, fashion_item in enumerate(fashion_products[:TARGET_PRODUCT_COUNT], start=1):
        product_id = f"shoe_{index:03d}"
        shoe_type = fashion_item["shoe_type"]

        matched_myntra = match_myntra_product(
            fashion_item=fashion_item,
            myntra_products=myntra_products,
        )

        fallback_price = DEFAULT_PRICE_BY_SHOE_TYPE.get(shoe_type, 2499)
        fallback_description = build_fallback_description(fashion_item)

        brand = resolve_brand(matched_myntra, fashion_item)

        if matched_myntra:
            price = matched_myntra["price"]
            myntra_row = matched_myntra["myntra_row"]
            match_type = "strict_safe_shoe_type_gender_keyword_match"

            if is_safe_myntra_description(matched_myntra["description"], fashion_item):
                description = matched_myntra["description"]
                description_source = "myntra_safe_description"
            else:
                description = fallback_description
                description_source = "fashion_generated_description"

        else:
            price = fallback_price
            description = fallback_description
            myntra_row = None
            match_type = "fallback_no_safe_myntra_match"
            description_source = "fashion_generated_description"

        reviews = select_reviews_for_product(
            shoe_type=shoe_type,
            title=fashion_item["title"],
            sampling_pools=sampling_pools,
        )

        ratings = [review["rating"] for review in reviews]
        avg_rating = round(mean(ratings), 2) if ratings else 0

        known_issues = build_known_issues(reviews)
        return_risk_signals = build_return_risk_signals(reviews)
        fit_type = infer_fit_type(known_issues)

        tags = infer_tags(
            title=fashion_item["title"],
            description=description,
            shoe_type=shoe_type,
            usage=fashion_item["usage"],
            reviews=reviews,
        )

        target_personas = infer_personas(tags)

        image_path = copy_frontend_image(
            source_path=fashion_item["source_image_path"],
            product_id=product_id,
        )

        gallery = []

        product = {
            "id": product_id,
            "title": fashion_item["title"],
            "brand": brand,
            "category": "Shoes",
            "shoe_type": shoe_type,
            "gender": fashion_item["gender"],
            "base_colour": fashion_item["base_colour"],
            "usage": fashion_item["usage"],
            "price": price,
            "currency": "TRY",
            "rating": avg_rating,
            "review_count": len(reviews),
            "description": description,
            "features": [],
            "tags": tags,
            "target_personas": target_personas,
            "fit_type": fit_type,
            "usage_type": tags,
            "known_issues": known_issues,
            "return_risk_signals": return_risk_signals,
            "sales_signals": build_sales_signals(
                rating=avg_rating,
                known_issues=known_issues,
            ),
            "visual_signals": build_visual_signals(
                gallery=gallery,
            ),
            "market_signals": build_market_signals(
                shoe_type=shoe_type,
            ),
            "reviews": reviews,
            "image": image_path,
            "gallery": gallery,
            "source_trace": {
                "fashion_images_row": fashion_item["fashion_row"],
                "fashion_image_id": fashion_item["image_id"],
                "fashion_article_type": fashion_item["article_type"],
                "myntra_row": myntra_row,
                "myntra_match_type": match_type,
                "description_source": description_source,
                "brand_source": "myntra_brand_or_fashion_title_inference",
                "amazon_review_strategy": "strict_shoe_type_filtered_review_pool_without_reuse_until_pool_empty",
            },
        }

        products.append(product)

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as file:
        json.dump(products, file, ensure_ascii=False, indent=2)

    print(f"Tamamlandı: {len(products)} ürün yazıldı.")
    print(f"Çıktı: {OUTPUT_JSON}")
    print(f"Görseller: {FRONTEND_IMAGE_DIR}")


if __name__ == "__main__":
    build_products_json()