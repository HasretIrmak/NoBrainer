export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  description: string;
  reviews: string[];
  tags: string[];
  known_issues: string[];
  image: string;
}

export interface PersonaContent {
  hero_title: string;
  description: string;
  features: string[];
  cta_text: string;
}

export interface AnalysisResult {
  conversion_score: number;
  trust_score: number;
  visual_score: number;
  return_score: number;
  insights: string[];
}