from fastapi import APIRouter

from models import Product
from services.product_service import (
    get_all_products,
    get_product_by_id,
    get_products_by_persona,
    get_products_by_shoe_type,
    search_products,
)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get("/", response_model=list[Product])
def list_products():
    """
    Tüm ürünleri döndürür.
    """

    return get_all_products()


@router.get("/search", response_model=list[Product])
def search_products_endpoint(query: str):
    """
    Basit ürün arama sistemi.
    """

    return search_products(query)


@router.get("/shoe-type/{shoe_type}", response_model=list[Product])
def get_by_shoe_type(shoe_type: str):
    """
    Shoe type filtresi.
    """

    return get_products_by_shoe_type(shoe_type)


@router.get("/persona/{persona}", response_model=list[Product])
def get_by_persona(persona: str):
    """
    Persona filtresi.
    """

    return get_products_by_persona(persona)


@router.get("/{product_id}", response_model=Product)
def retrieve_product(product_id: str):
    """
    ID ile tek ürün döndürür.
    """

    return get_product_by_id(product_id)