import json
import os
import time
from pathlib import Path
from typing import Any

import google.generativeai as genai
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.0-flash")

_configured = False
_model = None
_cooldown_until = 0.0
_last_error = ""


def is_gemini_configured() -> bool:
    return bool(GEMINI_API_KEY)


def get_gemini_status() -> dict[str, Any]:
    return {
        "configured": is_gemini_configured(),
        "model": MODEL_NAME,
        "env_path": str(ENV_PATH),
        "circuit_open": is_circuit_open(),
        "retry_after_seconds": get_retry_after_seconds(),
        "last_error": _last_error,
    }


def is_circuit_open() -> bool:
    return time.time() < _cooldown_until


def get_retry_after_seconds() -> int:
    if not is_circuit_open():
        return 0

    return max(0, round(_cooldown_until - time.time()))


def is_quota_error(error: Exception) -> bool:
    error_text = str(error).lower()
    return "429" in error_text or "quota" in error_text or "rate" in error_text


def open_circuit(error: Exception, cooldown_seconds: int = 60) -> None:
    global _cooldown_until, _last_error

    _cooldown_until = time.time() + cooldown_seconds
    _last_error = str(error)[:500]


def get_model():
    global _configured, _model

    if not GEMINI_API_KEY:
        return None

    if not _configured:
        genai.configure(api_key=GEMINI_API_KEY)
        _configured = True

    if _model is None:
        _model = genai.GenerativeModel(MODEL_NAME)

    return _model


def ask_gemini(prompt: str) -> str:
    """
    Gemini modeline prompt gönderir ve düz metin cevap döndürür.
    """

    active_model = get_model()

    if active_model is None:
        return "Gemini kullanılamıyor: GEMINI_API_KEY bulunamadı."

    if is_circuit_open():
        return f"Gemini geçici olarak devre dışı: kota bekleme süresi aktif, {get_retry_after_seconds()} saniye sonra tekrar denenebilir."

    try:
        response = active_model.generate_content(prompt)

        if not response.text:
            return "Gemini boş cevap döndürdü."

        return response.text

    except Exception as error:
        if is_quota_error(error):
            open_circuit(error)

        return f"Gemini hata verdi: {str(error)}"


def clean_json_text(text: str) -> str:
    """
    Gemini bazen cevabı ```json ... ``` içinde döndürür.
    Bu fonksiyon JSON parse öncesi temizler.
    """

    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1).strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```", "", 1).strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    return cleaned


def generate_json_result(prompt: str, fallback: dict) -> tuple[dict, str]:
    """
    Gemini'den JSON cevap üretir.
    Cevap parse edilemezse veya Gemini hata verirse fallback döner.
    """

    active_model = get_model()

    if active_model is None:
        return fallback, "fallback"

    if is_circuit_open():
        return fallback, "fallback"

    try:
        response = active_model.generate_content(prompt)

        if not response.text:
            return fallback, "fallback"

        cleaned_text = clean_json_text(response.text)

        return json.loads(cleaned_text), "gemini"

    except Exception as error:
        # Quota errors should stop repeated Gemini calls briefly so API endpoints stay fast.
        if is_quota_error(error):
            open_circuit(error)

        return fallback, "fallback"


def generate_json(prompt: str, fallback: dict) -> dict:
    data, _source = generate_json_result(prompt, fallback)
    return data
