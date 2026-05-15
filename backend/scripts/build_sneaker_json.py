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

OUTPUT_JSON = PROJECT_ROOT / "backend" / "data" / "sneakers.json"
FRONTEND_IMAGE_DIR = PROJECT_ROOT / "frontend" / "public" / "images" / "sneakers"

TARGET_PRODUCT_COUNT = 100
MAX_AMAZON_META_MATCHES = 2000
MIN_REVIEWS_PER_PRODUCT = 5
MAX_REVIEWS_PER_PRODUCT = 20


SNEAKER_KEYWORDS = [
    "sneaker",
    "sneakers",
    "shoe",
    "shoes",
    "running shoe",
    "running shoes",
    "casual shoe",
    "casual shoes",
    "sports shoe",
    "sports shoes",
    "trainer",
    "trainers",
]


SIGNAL_KEYWORDS = {
    "runs_small": ["runs small", "too small", "tight", "size up", "small size"],
    "runs_large": ["runs large", "too big", "size down"],
    "narrow_fit": ["narrow", "tight fit", "too tight"],
    "wide_feet_issue": ["wide feet", "wide foot", "too narrow"],
    "comfort_positive": ["comfortable", "comfy", "all day", "daily use", "walking"],
    "comfort_negative": ["uncomfortable", "hurts", "pain", "stiff"],
    "cheap_material": ["cheap material", "poor quality", "bad quality", "feels cheap"],
    "low_durability": ["not durable", "fell apart", "wore out", "broke", "torn"],
    "slippery_sole": ["slippery", "no grip"],
    "color_mismatch": ["color different", "not same color", "color mismatch"],
}


def contains_sneaker_keyword(value: str) -> bool:
    if not value:
        return False

    text = value.lower()
    return any(keyword in text for keyword in SNEAKER_KEYWORDS)


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


def infer_tags(title: str, description: str, reviews: list[dict]) -> list[str]:
    text = f"{title} {description} " + " ".join(r["text"] for r in reviews)
    text = text.lower()

    tags = set()

    if any(word in text for word in ["comfortable", "comfy", "walking", "all day"]):
        tags.add("comfort")

    if any(word in text for word in ["daily", "everyday", "casual"]):
        tags.add("daily")

    if any(word in text for word in ["running", "sport", "training", "gym"]):
        tags.add("sporty")

    if any(word in text for word in ["style", "stylish", "outfit", "looks"]):
        tags.add("style")

    if any(word in text for word in ["cheap", "price", "value", "budget"]):
        tags.add("budget")

    if any(word in text for word in ["lightweight", "light weight"]):
        tags.add("lightweight")

    if not tags:
        tags.add("daily")

    return sorted(tags)


def infer_personas(tags: list[str]) -> list[str]:
    personas = set()

    if "style" in tags or "streetwear" in tags:
        personas.add("style")

    if "comfort" in tags or "daily" in tags or "walking" in tags:
        personas.add("comfort")

    if "budget" in tags:
        personas.add("budget")

    if not personas:
        personas.update(["style", "comfort"])

    return sorted(personas)


def infer_fit_type(known_issues: list[str]) -> str:
    if "narrow_fit" in known_issues or "wide_feet_issue" in known_issues:
        return "narrow"

    if "runs_large" in known_issues:
        return "large"

    if "runs_small" in known_issues:
        return "small"

    return "regular"


def load_myntra_products() -> list[dict]:
    csv_path = find_first_file(MYNTRA_DIR, ["*.csv"])

    if not csv_path:
        print("Myntra CSV bulunamadı.")
        return []

    print(f"Myntra CSV bulundu: {csv_path}")

    products = []

    with open(csv_path, "r", encoding="utf-8", errors="ignore", newline="") as file:
        reader = csv.DictReader(file)

        for row_number, row in enumerate(reader, start=2):
            combined_text = " ".join(normalize_text(value) for value in row.values())

            if not contains_sneaker_keyword(combined_text):
                continue

            title = safe_get(row, [
                "product_name",
                "productName",
                "name",
                "title",
                "ProductName",
                "p_name",
            ])

            brand = safe_get(row, [
                "brand",
                "brand_name",
                "Brand",
                "brandName",
            ], default="Unknown Brand")

            price_raw = safe_get(row, [
                "price",
                "selling_price",
                "discounted_price",
                "mrp",
                "Price",
            ], default="0")

            description = safe_get(row, [
                "description",
                "product_description",
                "desc",
                "product_details",
                "Description",
            ], default=title)

            try:
                price = float(str(price_raw).replace(",", "").replace("₹", "").strip())
            except ValueError:
                price = 0

            products.append({
                "title": title or "Sneaker Product",
                "brand": brand or "Unknown Brand",
                "price": price,
                "description": description or title or "Sneaker product.",
                "myntra_row": row_number,
            })

    print(f"Myntra sneaker adayı: {len(products)}")
    return products


def load_fashion_images() -> list[dict]:
    styles_path = find_first_file(FASHION_DIR, ["styles.csv"])

    if not styles_path:
        print("styles.csv bulunamadı.")
        return []

    print(f"Fashion styles.csv bulundu: {styles_path}")

    images = []
    image_files = {path.stem: path for path in find_all_files(FASHION_DIR, ["*.jpg", "*.jpeg", "*.png"])}

    with open(styles_path, "r", encoding="utf-8", errors="ignore", newline="") as file:
        reader = csv.DictReader(file)

        for row_number, row in enumerate(reader, start=2):
            combined_text = " ".join(normalize_text(value) for value in row.values())

            if not contains_sneaker_keyword(combined_text):
                continue

            image_id = str(safe_get(row, ["id", "productId", "image_id"])).strip()

            if image_id not in image_files:
                continue

            images.append({
                "image_id": image_id,
                "source_image_path": image_files[image_id],
                "fashion_images_row": row_number,
                "display_name": safe_get(row, ["productDisplayName", "product_name", "name"], default=""),
                "usage": safe_get(row, ["usage"], default=""),
                "base_colour": safe_get(row, ["baseColour"], default=""),
            })

    print(f"Fashion sneaker görsel adayı: {len(images)}")
    return images


def load_amazon_sneaker_meta() -> dict:
    meta_path = find_first_file(AMAZON_DIR, ["meta*.jsonl.gz", "*meta*.jsonl.gz"])

    if not meta_path:
        print("Amazon meta jsonl.gz bulunamadı.")
        return {}

    print(f"Amazon meta bulundu: {meta_path}")

    sneaker_meta = {}

    with open_jsonl_gz(meta_path) as file:
        for row_number, line in enumerate(file, start=1):
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue

            title = normalize_text(safe_get(row, ["title"], default=""))
            categories = normalize_text(safe_get(row, ["categories", "category"], default=""))
            description = normalize_text(safe_get(row, ["description", "features"], default=""))

            combined_text = f"{title} {categories} {description}"

            if not contains_sneaker_keyword(combined_text):
                continue

            asin = safe_get(row, ["parent_asin", "asin"], default="")

            if not asin:
                continue

            sneaker_meta[asin] = {
                "amazon_asin": asin,
                "amazon_title": title,
                "amazon_meta_row": row_number,
            }

            if len(sneaker_meta) >= MAX_AMAZON_META_MATCHES:
                break

    print(f"Amazon sneaker meta adayı: {len(sneaker_meta)}")
    return sneaker_meta


def load_amazon_reviews_for_products(sneaker_meta: dict) -> dict:
    review_path = find_first_file(AMAZON_DIR, [
        "Clothing_Shoes_and_Jewelry.jsonl.gz",
        "*Clothing*.jsonl.gz",
        "*Shoes*.jsonl.gz",
    ])

    if not review_path:
        print("Amazon review jsonl.gz bulunamadı.")
        return {}

    print(f"Amazon review bulundu: {review_path}")

    asin_set = set(sneaker_meta.keys())
    reviews_by_asin = {asin: [] for asin in asin_set}

    with open_jsonl_gz(review_path) as file:
        for row_number, line in enumerate(file, start=1):
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue

            asin = safe_get(row, ["parent_asin", "asin"], default="")

            if asin not in asin_set:
                continue

            text = normalize_text(safe_get(row, ["text", "review_text", "body"], default=""))
            title = normalize_text(safe_get(row, ["title", "summary"], default=""))

            review_text = f"{title}. {text}".strip(". ").strip()

            if len(review_text) < 20:
                continue

            rating_raw = safe_get(row, ["rating", "overall", "stars"], default=3)

            try:
                rating = float(rating_raw)
            except ValueError:
                rating = 3.0

            signals = extract_review_signals(review_text)

            reviews_by_asin[asin].append({
                "rating": rating,
                "text": review_text,
                "sentiment": sentiment_from_rating(rating),
                "signals": signals,
                "source": "amazon_reviews_2023",
                "source_row": row_number,
            })

            if all(len(items) >= MAX_REVIEWS_PER_PRODUCT for items in reviews_by_asin.values()):
                break

    filtered = {
        asin: reviews
        for asin, reviews in reviews_by_asin.items()
        if len(reviews) >= MIN_REVIEWS_PER_PRODUCT
    }

    print(f"Yeterli review bulunan Amazon ürünü: {len(filtered)}")
    return filtered


def copy_frontend_image(source_path: Path, sneaker_id: str) -> str:
    FRONTEND_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    extension = source_path.suffix.lower() or ".jpg"
    target_path = FRONTEND_IMAGE_DIR / f"{sneaker_id}{extension}"

    shutil.copyfile(source_path, target_path)

    return f"/images/sneakers/{target_path.name}"


def build_sneakers_json():
    print("Veri hazırlama başladı...")

    myntra_products = load_myntra_products()
    fashion_images = load_fashion_images()

    amazon_meta = load_amazon_sneaker_meta()
    amazon_reviews = load_amazon_reviews_for_products(amazon_meta)

    usable_amazon_asins = list(amazon_reviews.keys())

    if not usable_amazon_asins:
        raise RuntimeError("Yeterli Amazon sneaker review bulunamadı. Meta/review dosyalarını kontrol et.")

    if not myntra_products:
        raise RuntimeError("Myntra sneaker ürünü bulunamadı.")

    if not fashion_images:
        raise RuntimeError("Fashion image sneaker görseli bulunamadı.")

    random.shuffle(myntra_products)
    random.shuffle(fashion_images)
    random.shuffle(usable_amazon_asins)

    total = min(TARGET_PRODUCT_COUNT, len(myntra_products), len(fashion_images), len(usable_amazon_asins))

    sneakers = []

    for index in range(total):
        sneaker_id = f"sneaker_{index + 1:03d}"

        myntra_item = myntra_products[index]
        fashion_item = fashion_images[index]
        amazon_asin = usable_amazon_asins[index]
        reviews = amazon_reviews[amazon_asin][:MAX_REVIEWS_PER_PRODUCT]

        ratings = [review["rating"] for review in reviews]
        avg_rating = round(mean(ratings), 2) if ratings else 0

        known_issues = build_known_issues(reviews)
        return_risk_signals = build_return_risk_signals(reviews)

        title = myntra_item["title"]
        description = myntra_item["description"]

        tags = infer_tags(title, description, reviews)
        target_personas = infer_personas(tags)
        fit_type = infer_fit_type(known_issues)

        image_path = copy_frontend_image(fashion_item["source_image_path"], sneaker_id)

        product = {
            "id": sneaker_id,
            "title": title,
            "brand": myntra_item["brand"],
            "category": "Sneakers",
            "price": myntra_item["price"],
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
            "reviews": [
                {
                    "rating": review["rating"],
                    "text": review["text"],
                    "sentiment": review["sentiment"],
                    "signals": review["signals"],
                }
                for review in reviews
            ],
            "image": image_path,
            "gallery": [],
            "source_trace": {
                "myntra_row": myntra_item["myntra_row"],
                "fashion_images_row": fashion_item["fashion_images_row"],
                "fashion_image_id": fashion_item["image_id"],
                "amazon_asin": amazon_asin,
                "amazon_meta_row": amazon_meta.get(amazon_asin, {}).get("amazon_meta_row"),
                "amazon_review_rows": [review["source_row"] for review in reviews],
            },
        }

        sneakers.append(product)

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as file:
        json.dump(sneakers, file, ensure_ascii=False, indent=2)

    print(f"Tamamlandı: {len(sneakers)} ürün yazıldı.")
    print(f"Çıktı: {OUTPUT_JSON}")
    print(f"Görseller: {FRONTEND_IMAGE_DIR}")


if __name__ == "__main__":
    build_sneakers_json()