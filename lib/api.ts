import { Product, AnalysisResult } from './types';
import { API_URL } from './constants';

export async function getAllProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products/`);
  if (!res.ok) throw new Error('Ürünler yüklenemedi');
  return res.json();
}

export async function getProductById(id: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) throw new Error('Ürün bulunamadı');
  return res.json();
}

export async function analyzeProduct(id: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: id }),
  });
  return res.json();
}