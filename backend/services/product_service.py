import json
from pathlib import Path

from fastapi import HTTPException

from models import Product


BASE_DIR = Path(__file__).resolve().parents[1]

DATA_FILE = BASE_DIR / "data" / "products.json"


def load_products() -> list[Product]:
    """
    products.json dosyasını okur
    ve Product modellerine dönüştürür.
    """

    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=500,
            detail="products.json dosyası bulunamadı."
        )

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            raw_products = json.load(file)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="products.json geçerli bir JSON değil."
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"products.json okunamadı: {str(error)}"
        )

    if not isinstance(raw_products, list):
        raise HTTPException(
            status_code=500,
            detail="products.json bir liste formatında olmalı."
        )

    try:
        validated_products = [
            Product(**item)
            for item in raw_products
        ]

        return validated_products

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
    product_id ile tek ürün döndürür.
    """

    products = load_products()

    for product in products:
        if product.id == product_id:
            return product

    raise HTTPException(
        status_code=404,
        detail=f"Ürün bulunamadı: {product_id}"
    )


def get_products_by_shoe_type(shoe_type: str) -> list[Product]:
    """
    shoe_type filtresine göre ürün döndürür.
    """

    products = load_products()

    filtered_products = [
        product
        for product in products
        if product.shoe_type.lower() == shoe_type.lower()
    ]

    return filtered_products


def get_products_by_persona(persona: str) -> list[Product]:
    """
    Persona bazlı ürün filtreleme.
    """

    products = load_products()

    filtered_products = [
        product
        for product in products
        if persona.lower() in [
            item.lower()
            for item in product.target_personas
        ]
    ]

    return filtered_products


def search_products(query: str) -> list[Product]:
    """
    Basit text search sistemi.
    """

    products = load_products()

    query = query.lower().strip()

    if not query:
        return products

    results = []

    for product in products:
        searchable_text = " ".join([
            product.title,
            product.description,
            product.brand,
            product.shoe_type,
            product.usage,
            " ".join(product.tags),
            " ".join(product.target_personas),
        ]).lower()

        if query in searchable_text:
            results.append(product)

    return results