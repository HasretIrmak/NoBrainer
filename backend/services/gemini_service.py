import json
import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.0-flash")


if not GEMINI_API_KEY:
    raise ValueError(f"GEMINI_API_KEY bulunamadı. Kontrol edilen dosya: {ENV_PATH}")


genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(MODEL_NAME)


def ask_gemini(prompt: str) -> str:
    """
    Gemini modeline prompt gönderir ve düz text cevap döndürür.
    """

    try:
        response = model.generate_content(prompt)

        if not response.text:
            return "Gemini boş cevap döndürdü."

        return response.text

    except Exception as error:
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


def generate_json(prompt: str, fallback: dict) -> dict:
    """
    Gemini'den JSON cevap üretir.
    Cevap parse edilemezse veya Gemini hata verirse fallback döner.
    """

    try:
        response = model.generate_content(prompt)

        if not response.text:
            return fallback

        cleaned_text = clean_json_text(response.text)

        return json.loads(cleaned_text)

    except Exception:
        return fallback