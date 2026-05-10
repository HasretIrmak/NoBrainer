import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-1.5-flash")


if not GEMINI_API_KEY:
    raise ValueError(f"GEMINI_API_KEY bulunamadı. Kontrol edilen dosya: {ENV_PATH}")


genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(MODEL_NAME)


def ask_gemini(prompt: str) -> str:
    try:
        response = model.generate_content(prompt)

        if not response.text:
            return "Gemini boş cevap döndürdü."

        return response.text

    except Exception as error:
        return f"Gemini hata verdi: {str(error)}"