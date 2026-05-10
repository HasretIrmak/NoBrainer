import json
from pathlib import Path

from fastapi import HTTPException

from models import Product


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = BASE_DIR / "data" / "sneakers.json"


def load_products() -> list[Product]:
    """
    sneakers.json dosyasını okur ve Product modellerine çevirir.
    """

    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=500,
            detail="sneakers.json dosyası bulunamadı."
        )

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            raw_products = json.load(file)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="sneakers.json geçerli bir JSON dosyası değil."
        )

    try:
        return [Product(**item) for item in raw_products]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Ürün verisi Product modeline uymuyor: {str(error)}"
        )


def get_all_products() -> list[Product]:
    """
    Tüm ürünleri döndürür.
    """

    return load_products()


def get_product_by_id(product_id: str) -> Product:
    """
    Verilen product_id ile tek ürün bulur.
    """

    products = load_products()

    for product in products:
        if product.id == product_id:
            return product

    raise HTTPException(
        status_code=404,
        detail=f"Ürün bulunamadı: {product_id}"
    )