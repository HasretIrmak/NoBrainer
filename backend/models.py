from typing import Literal

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


class SalesSignals(BaseModel):
    views: int = 0
    clicks: int = 0
    cart_adds: int = 0
    sales: int = 0
    return_rate: float = 0


class VisualSignals(BaseModel):
    image_quality: str = "unknown"
    image_issue: str = ""
    recommendation: str = ""


class MarketSignals(BaseModel):
    avg_category_price: float = 0
    competitor_rating_avg: float = 0
    competitor_common_strengths: list[str] = Field(default_factory=list)


class SourceTrace(BaseModel):
    fashion_images_row: int | None = None
    fashion_image_id: str | None = None
    fashion_article_type: str | None = None

    myntra_row: int | None = None
    myntra_match_type: str | None = None
    description_source: str | None = None

    amazon_review_strategy: str | None = None


class Product(BaseModel):
    id: str
    title: str
    brand: str = "Unknown Brand"

    category: str = "Shoes"
    shoe_type: str = "sneaker"
    gender: str = "Unisex"
    base_colour: str = ""
    usage: str = "Casual"

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

    sales_signals: SalesSignals = Field(default_factory=SalesSignals)
    visual_signals: VisualSignals = Field(default_factory=VisualSignals)
    market_signals: MarketSignals = Field(default_factory=MarketSignals)

    reviews: list[Review] = Field(default_factory=list)

    image: str = ""
    gallery: list[str] = Field(default_factory=list)

    source_trace: SourceTrace | None = None


class ProductRequest(BaseModel):
    product_id: str


class PersonaRequest(BaseModel):
    product_id: str
    persona: Literal["style", "comfort", "budget"]
    gender: str | None = None
    age_group: str | None = None
    coupon_sensitive: bool = False
    fit_sensitive: bool = False


class InsightItem(BaseModel):
    type: str
    title: str
    message: str
    severity: str


class RecommendationItem(BaseModel):
    category: str
    priority: Literal["high", "medium", "low"]
    action: str
    reason: str
    expected_impact: str


class FunnelMetrics(BaseModel):
    views: int = 0
    clicks: int = 0
    cart_adds: int = 0
    sales: int = 0
    click_rate: float = 0
    cart_rate: float = 0
    checkout_rate: float = 0
    purchase_rate: float = 0
    return_rate: float = 0
    main_dropoff: str = "unknown"


class AnalysisOut(BaseModel):
    product_id: str
    title_score: int
    description_score: int
    visual_score: int
    trust_score: int
    review_score: int
    sales_health_score: int
    price_competitiveness_score: int
    return_risk_score: int
    risk_level: str
    overall_conversion_score: int
    funnel: FunnelMetrics
    conversion_diagnosis: str
    ai_source: Literal["gemini", "fallback"]
    insights: list[InsightItem]
    recommendations: list[RecommendationItem] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)


class ReturnRiskEvidence(BaseModel):
    signal: str
    review_text: str
    sentiment: str
    severity: Literal["high", "medium", "low"]


class ReturnRiskOut(BaseModel):
    product_id: str
    risk_score: int
    risk_level: str
    detected_issues: list[str]
    user_warning: str
    seller_advice: str
    reasons: list[str]
    evidence: list[ReturnRiskEvidence] = Field(default_factory=list)


class PersonaContent(BaseModel):
    hero_title: str
    hero_description: str
    features: list[str]
    cta: str


class PersonaOut(BaseModel):
    product_id: str
    persona: Literal["style", "comfort", "budget"]
    source: Literal["gemini", "fallback", "cache"]
    content: PersonaContent


class FAQItem(BaseModel):
    question: str
    answer: str


class OptimizeOut(BaseModel):
    product_id: str
    optimized_title: str
    optimized_description: str
    faq: list[FAQItem]
    trust_messages: list[str]


class ReviewSummaryOut(BaseModel):
    product_id: str
    source: Literal["gemini", "fallback"]
    short_summary: str
    positive_points: list[str]
    negative_points: list[str]
    return_risk_reasons: list[str]
