import argparse
import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv

try:
    import google.generativeai as genai
except ImportError:
    genai = None


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
DEFAULT_INPUT = BACKEND_DIR / "data" / "products.json"
DEFAULT_OUTPUT = BACKEND_DIR / "data" / "products_tr.json"

load_dotenv(BACKEND_DIR / ".env")


def get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("MODEL_NAME", "gemini-2.0-flash")
    if not api_key or genai is None:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


def fallback_translate(text: str) -> str:
    replacements = {
        "comfortable": "rahat",
        "Comfortable": "Rahat",
        "too small": "küçük geldi",
        "runs small": "kalıbı küçük",
        "narrow": "dar",
        "wide feet": "geniş ayak",
        "cheap material": "kalitesiz malzeme",
        "good quality": "iyi kalite",
        "walking": "yürüyüş",
        "daily use": "günlük kullanım",
        "shoe": "ayakkabı",
        "Shoes": "Ayakkabı",
        "sneaker": "spor ayakkabı",
        "return": "iade",
    }
    translated = text
    for source, target in replacements.items():
        translated = translated.replace(source, target)
    return translated


def translate_text(model, text: str, delay: float) -> str:
    if not text or len(text.strip()) < 3:
        return text
    if model is None:
        return fallback_translate(text)

    prompt = f"""
Translate the following ecommerce product/review text into natural Turkish.
Preserve product names, brand names and shoe sizes.
Return only the translated text, no markdown.

Text:
{text[:3500]}
"""
    try:
        response = model.generate_content(prompt)
        time.sleep(delay)
        return response.text.strip() if response.text else fallback_translate(text)
    except Exception:
        return fallback_translate(text)


def translate_products(input_path: Path, output_path: Path, limit: int | None, delay: float) -> None:
    model = get_model()
    products = json.loads(input_path.read_text(encoding="utf-8"))
    translated = []

    for index, product in enumerate(products, start=1):
      if limit is not None and index > limit:
          translated.append(product)
          continue

      print(f"[{index}/{len(products)}] {product.get('title', '')}")
      item = dict(product)
      item["description"] = translate_text(model, item.get("description", ""), delay)

      reviews = []
      for review in item.get("reviews", []):
          next_review = dict(review)
          next_review["text"] = translate_text(model, next_review.get("text", ""), delay)
          reviews.append(next_review)
      item["reviews"] = reviews
      translated.append(item)

      output_path.write_text(json.dumps(translated, ensure_ascii=False, indent=2), encoding="utf-8")

    output_path.write_text(json.dumps(translated, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Tamamlandı: {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--delay", type=float, default=0.4)
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = input_path if args.in_place else Path(args.output)
    translate_products(input_path=input_path, output_path=output_path, limit=args.limit, delay=args.delay)


if __name__ == "__main__":
    main()
