import type {
  AnalysisResult,
  OptimizeResult,
  Persona,
  PersonaResult,
  Product,
  ReviewSummaryResult,
  ReturnRiskResult,
  UserProfile,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function productBody(productId: string) {
  return JSON.stringify({ product_id: productId });
}

export function fetchProducts() {
  return apiFetch<Product[]>("/products/");
}

export function fetchProductById(productId: string) {
  return apiFetch<Product>(`/products/${productId}`);
}

export function fetchProductAnalysis(productId: string) {
  return apiFetch<AnalysisResult>("/analyze/", {
    method: "POST",
    body: productBody(productId),
  });
}

export function fetchReturnRisk(productId: string) {
  return apiFetch<ReturnRiskResult>("/return-risk/", {
    method: "POST",
    body: productBody(productId),
  });
}

export function fetchPersonaContent(productId: string, persona: Persona, profile?: UserProfile | null) {
  return apiFetch<PersonaResult>("/persona/", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      persona,
      gender: profile?.gender,
      age_group: profile?.age_group,
      coupon_sensitive: profile?.coupon_sensitive,
      fit_sensitive: profile?.fit_sensitive,
    }),
  });
}

export function fetchOptimization(productId: string) {
  return apiFetch<OptimizeResult>("/optimize/", {
    method: "POST",
    body: productBody(productId),
  });
}

export function fetchReviewSummary(productId: string) {
  return apiFetch<ReviewSummaryResult>("/reviews-summary/", {
    method: "POST",
    body: productBody(productId),
  });
}
