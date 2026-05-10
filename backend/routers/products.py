from fastapi import APIRouter

from models import Product
from services.product_service import get_all_products, get_product_by_id


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get("/", response_model=list[Product])
def list_products():
    """
    Tüm sneaker ürünlerini döndürür.
    """

    return get_all_products()


@router.get("/{product_id}", response_model=Product)
def retrieve_product(product_id: str):
    """
    ID ile tek sneaker ürününü döndürür.
    """

    return get_product_by_id(product_id)