from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.products import router as products_router
from routers.gemini import router as gemini_router
from routers.analyze import router as analyze_router
from routers.return_risk import router as return_risk_router
from routers.persona import router as persona_router
from routers.optimize import router as optimize_router
from routers.reviews_summary import router as reviews_summary_router

app = FastAPI(
    title="NoBrainer API",
    description="Decision layer backend for personalized commerce, return risk, and product optimization.",
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
        "service": "nobrainer-backend",
    }


app.include_router(products_router)

app.include_router(gemini_router)

app.include_router(analyze_router)

app.include_router(return_risk_router)

app.include_router(persona_router)

app.include_router(optimize_router)

app.include_router(reviews_summary_router)
