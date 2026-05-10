from fastapi import APIRouter

from services.gemini_service import ask_gemini


router = APIRouter(
    prefix="/gemini",
    tags=["Gemini"]
)


@router.get("/test")
def test_gemini():
    """
    Gemini bağlantısını test eder.
    """

    response = ask_gemini("Merhaba Gemini. Kısaca çalıştığını söyle.")

    return {
        "success": True,
        "response": response,
    }