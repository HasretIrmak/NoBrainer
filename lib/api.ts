import type {
  AnalysisResult,
  OptimizeResult,
  Persona,
  PersonaResult,
  Product,
  ReturnRiskResult,
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

export function fetchPersonaContent(productId: string, persona: Persona) {
  return apiFetch<PersonaResult>("/persona/", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, persona }),
  });
}

export function fetchOptimization(productId: string) {
  return apiFetch<OptimizeResult>("/optimize/", {
    method: "POST",
    body: productBody(productId),
  });
}
