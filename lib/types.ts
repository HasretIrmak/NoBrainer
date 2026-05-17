export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  shoe_type: string;
  gender: string;
  base_colour: string;
  usage: string;
  price: number;
  currency: string;
  rating: number;
  review_count: number;
  description: string;
  features: string[];
  tags: string[];
  target_personas: string[];
  fit_type: string;
  usage_type: string[];
  known_issues: string[];
  return_risk_signals: ReturnRiskSignals;
  sales_signals: SalesSignals;
  visual_signals: VisualSignals;
  market_signals: MarketSignals;
  reviews: Review[];
  image: string;
  gallery: string[];
  source_trace?: Record<string, unknown>;
}

export interface Review {
  rating: number;
  text: string;
  sentiment: string;
  signals: string[];
}

export interface ReturnRiskSignals {
  runs_small_mentions: number;
  runs_large_mentions: number;
  wide_feet_mentions: number;
  comfort_complaints: number;
  quality_complaints: number;
  durability_complaints: number;
  slippery_sole_mentions: number;
  color_mismatch_mentions: number;
}

export interface SalesSignals {
  views: number;
  clicks: number;
  cart_adds: number;
  sales: number;
  return_rate: number;
}

export interface VisualSignals {
  image_quality: string;
  image_issue: string;
  recommendation: string;
}

export interface MarketSignals {
  avg_category_price: number;
  competitor_rating_avg: number;
  competitor_common_strengths: string[];
}

export interface AnalysisResult {
  product_id: string;
  title_score: number;
  description_score: number;
  visual_score: number;
  trust_score: number;
  review_score: number;
  sales_health_score: number;
  price_competitiveness_score: number;
  return_risk_score: number;
  risk_level: RiskLevel;
  overall_conversion_score: number;
  funnel: FunnelMetrics;
  conversion_diagnosis: string;
  ai_source: "gemini" | "fallback";
  insights: InsightItem[];
  recommendations: RecommendationItem[];
  recommended_actions: string[];
}

export interface FunnelMetrics {
  views: number;
  clicks: number;
  cart_adds: number;
  sales: number;
  click_rate: number;
  cart_rate: number;
  checkout_rate: number;
  purchase_rate: number;
  return_rate: number;
  main_dropoff: string;
}

export interface InsightItem {
  type: string;
  title: string;
  message: string;
  severity: "high" | "medium" | "low" | string;
}

export interface RecommendationItem {
  category: string;
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
  expected_impact: string;
}

export interface ReturnRiskResult {
  product_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  detected_issues: string[];
  user_warning: string;
  seller_advice: string;
  reasons: string[];
  evidence: ReturnRiskEvidence[];
}

export interface ReturnRiskEvidence {
  signal: string;
  review_text: string;
  sentiment: string;
  severity: "high" | "medium" | "low";
}

export interface PersonaContent {
  hero_title: string;
  hero_description: string;
  features: string[];
  cta: string;
}

export interface PersonaResult {
  product_id: string;
  persona: Persona;
  source: "gemini" | "fallback" | "cache";
  content: PersonaContent;
}

export interface OptimizeResult {
  product_id: string;
  optimized_title: string;
  optimized_description: string;
  faq: FAQItem[];
  trust_messages: string[];
}

export interface ReviewSummaryResult {
  product_id: string;
  source: "gemini" | "fallback";
  short_summary: string;
  positive_points: string[];
  negative_points: string[];
  return_risk_reasons: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface UserProfile {
  name: string;
  gender: "Women" | "Men" | "Unisex" | "Kids";
  age_group: "teen" | "young_adult" | "adult" | "senior";
  persona: Persona;
  coupon_sensitive: boolean;
  fit_sensitive: boolean;
  style_sensitive: boolean;
  comfort_sensitive: boolean;
  budget_sensitive: boolean;
}

export type AuthRole = "user" | "seller";

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: "user";
  profile: UserProfile;
}

export interface SellerStore {
  id: string;
  seller_id: string;
  name: string;
  category: string;
  shipping_fee: number;
  marketplace_fee_rate: number;
  fixed_expense: number;
}

export interface SellerAccount {
  id: string;
  username: string;
  password: string;
  role: "seller";
  display_name: string;
  stores: SellerStore[];
}

export type AuthAccount = UserAccount | SellerAccount;

export interface CartItem {
  product_id: string;
  quantity: number;
}

export interface ReturnRecord {
  id: string;
  product_id: string;
  reason: string;
  note: string;
  created_at: string;
  code: string;
  risk_level: RiskLevel | "unknown";
}

export type Persona = "style" | "comfort" | "budget";
export type RiskLevel = "high" | "medium" | "low";
