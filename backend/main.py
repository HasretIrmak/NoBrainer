from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.products import router as products_router
from routers.gemini import router as gemini_router

app = FastAPI(
    title="Adaptive Commerce Intelligence API",
    description="AI-powered backend for adaptive sneaker commerce experience.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "adaptive-commerce-ai-backend",
    }


app.include_router(products_router)

app.include_router(gemini_router)