from fastapi import APIRouter

from services.gemini_service import ask_gemini, get_gemini_status


router = APIRouter(
    prefix="/gemini",
    tags=["Gemini"],
)


@router.get("/test")
def test_gemini():
    """
    Gemini baglantisini test eder.
    """

    response = ask_gemini("Merhaba Gemini. Kisaca calistigini soyle.")
    status = get_gemini_status()

    return {
        "success": not response.startswith("Gemini hata verdi") and "kullanilamiyor" not in response,
        "status": status,
        "response": response,
    }
