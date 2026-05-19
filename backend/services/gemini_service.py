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
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash-lite")
FALLBACK_MODEL_NAMES = [
    model.strip()
    for model in os.getenv(
        "GEMINI_FALLBACK_MODELS",
        "gemini-2.5-flash,gemini-2.0-flash",
    ).split(",")
    if model.strip()
]
MODEL_NAMES = list(dict.fromkeys([MODEL_NAME, *FALLBACK_MODEL_NAMES]))

_configured = False
_models: dict[str, Any] = {}
_cooldown_until = 0.0
_last_error = ""
_last_model = ""


def is_gemini_configured() -> bool:
    return bool(GEMINI_API_KEY)


def get_gemini_status() -> dict[str, Any]:
    return {
        "configured": is_gemini_configured(),
        "model": MODEL_NAME,
        "model_candidates": MODEL_NAMES,
        "last_model": _last_model,
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


def open_circuit(error: Exception, cooldown_seconds: int = 300) -> None:
    global _cooldown_until, _last_error

    _cooldown_until = time.time() + cooldown_seconds
    _last_error = str(error)[:500]


def configure_gemini() -> bool:
    global _configured

    if not GEMINI_API_KEY:
        return False

    if not _configured:
        genai.configure(api_key=GEMINI_API_KEY)
        _configured = True

    return True


def get_model(model_name: str):
    if not configure_gemini():
        return None

    if model_name not in _models:
        _models[model_name] = genai.GenerativeModel(model_name)

    return _models[model_name]


def generate_text_with_models(prompt: str) -> tuple[str | None, str | None, Exception | None]:
    global _last_model

    if not configure_gemini():
        return None, None, None

    last_error = None

    for model_name in MODEL_NAMES:
        try:
            response = get_model(model_name).generate_content(prompt)

            if response.text:
                _last_model = model_name
                return response.text, model_name, None

            last_error = RuntimeError(f"{model_name} bos cevap dondurdu.")
        except Exception as error:
            last_error = error

            if not is_quota_error(error):
                break

    return None, None, last_error


def ask_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        return "Gemini kullanilamiyor: GEMINI_API_KEY bulunamadi."

    if is_circuit_open():
        return (
            "Gemini gecici olarak devre disi: kota bekleme suresi aktif, "
            f"{get_retry_after_seconds()} saniye sonra tekrar denenebilir."
        )

    text, _model_name, error = generate_text_with_models(prompt)

    if text:
        return text

    if error and is_quota_error(error):
        open_circuit(error)

    if error:
        return f"Gemini hata verdi: {str(error)}"

    return "Gemini kullanilamiyor: GEMINI_API_KEY bulunamadi."


def clean_json_text(text: str) -> str:
    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1).strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```", "", 1).strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    return cleaned


def clean_generated_value(value):
    if isinstance(value, str):
        return (
            value.replace("**", "")
            .replace("__", "")
            .replace("`", "")
            .strip()
        )

    if isinstance(value, list):
        return [clean_generated_value(item) for item in value]

    if isinstance(value, dict):
        return {key: clean_generated_value(item) for key, item in value.items()}

    return value


def generate_json_result(prompt: str, fallback: dict) -> tuple[dict, str]:
    if not GEMINI_API_KEY:
        return fallback, "fallback"

    if is_circuit_open():
        return fallback, "fallback"

    text, _model_name, error = generate_text_with_models(prompt)

    if text:
        try:
            cleaned_text = clean_json_text(text)
            return clean_generated_value(json.loads(cleaned_text)), "gemini"
        except Exception:
            return fallback, "fallback"

    if error and is_quota_error(error):
        open_circuit(error)

    return fallback, "fallback"


def generate_json(prompt: str, fallback: dict) -> dict:
    data, _source = generate_json_result(prompt, fallback)
    return data
