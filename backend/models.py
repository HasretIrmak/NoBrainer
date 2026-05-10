from pydantic import BaseModel, Field


class Review(BaseModel):
    rating: float
    text: str
    sentiment: str = "neutral"
    signals: list[str] = Field(default_factory=list)


class ReturnRiskSignals(BaseModel):
    runs_small_mentions: int = 0
    runs_large_mentions: int = 0
    wide_feet_mentions: int = 0
    comfort_complaints: int = 0
    quality_complaints: int = 0
    durability_complaints: int = 0
    slippery_sole_mentions: int = 0
    color_mismatch_mentions: int = 0


class SourceTrace(BaseModel):
    myntra_row: int | None = None
    fashion_images_row: int | None = None
    fashion_image_id: str | None = None
    amazon_asin: str | None = None
    amazon_meta_row: int | None = None
    amazon_review_rows: list[int] = Field(default_factory=list)


class Product(BaseModel):
    id: str
    title: str
    brand: str
    category: str = "Sneakers"

    price: float = 0
    currency: str = "TRY"

    rating: float = 0
    review_count: int = 0

    description: str = ""

    features: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    target_personas: list[str] = Field(default_factory=list)

    fit_type: str = "regular"
    usage_type: list[str] = Field(default_factory=list)

    known_issues: list[str] = Field(default_factory=list)
    return_risk_signals: ReturnRiskSignals = Field(default_factory=ReturnRiskSignals)

    reviews: list[Review] = Field(default_factory=list)

    image: str = ""
    gallery: list[str] = Field(default_factory=list)

    source_trace: SourceTrace | None = None