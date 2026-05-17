"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product, SellerStore } from "./types";

const SELLER_PRODUCTS_KEY = "adaptive-commerce-seller-products-v1";

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function readUploadedProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(SELLER_PRODUCTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeUploadedProducts(products: Product[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(products));
  }
}

export function assignStore(product: Product, stores: SellerStore[]) {
  if (!stores.length) return "store_default";
  const source = `${product.brand}-${product.shoe_type}`;
  const index = Math.abs(source.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % stores.length;
  return stores[index].id;
}

export function getProductStoreId(product: Product, stores: SellerStore[]) {
  const trace = product.source_trace as unknown as Record<string, unknown> | null;
  return (trace?.store_id as string) || assignStore(product, stores);
}

export function createUploadedProduct(input: {
  title: string;
  brand: string;
  description: string;
  price: number;
  gender: Product["gender"];
  shoe_type: string;
  image: string;
  store_id: string;
}): Product {
  const id = makeId("seller_product");
  const tags = input.price < 1500 ? ["budget", "daily"] : ["style", "daily"];

  return {
    id,
    title: input.title,
    brand: input.brand || "Yeni Marka",
    category: "Shoes",
    shoe_type: input.shoe_type || "sneaker",
    gender: input.gender || "Unisex",
    base_colour: "",
    usage: "Casual",
    price: input.price || 0,
    currency: "TRY",
    rating: 4.2,
    review_count: 0,
    description: input.description,
    features: [],
    tags,
    target_personas: tags.includes("budget") ? ["budget", "comfort"] : ["style", "comfort"],
    fit_type: "regular",
    usage_type: tags,
    known_issues: [],
    return_risk_signals: {
      runs_small_mentions: 0,
      runs_large_mentions: 0,
      wide_feet_mentions: 0,
      comfort_complaints: 0,
      quality_complaints: 0,
      durability_complaints: 0,
      slippery_sole_mentions: 0,
      color_mismatch_mentions: 0,
    },
    sales_signals: {
      views: 100,
      clicks: 12,
      cart_adds: 3,
      sales: 1,
      return_rate: 0.08,
    },
    visual_signals: {
      image_quality: input.image ? "medium" : "unknown",
      image_issue: input.image ? "single_image_only" : "missing_image",
      recommendation: "Satıcı yüklenen ürün için daha fazla açı ve kullanım fotoğrafı ekleyebilir.",
    },
    market_signals: {
      avg_category_price: 1800,
      competitor_rating_avg: 4.3,
      competitor_common_strengths: ["net beden tablosu", "gerçek müşteri fotoğrafları", "hızlı kargo"],
    },
    reviews: [],
    image: input.image,
    gallery: input.image ? [input.image] : [],
    source_trace: {
      description_source: "seller_manual_upload",
      myntra_match_type: "not_applicable",
      amazon_review_strategy: "not_applicable",
      store_id: input.store_id,
    } as never,
  };
}

export function useSellerProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(readUploadedProducts());
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts((current) => {
      const next = [product, ...current];
      writeUploadedProducts(next);
      return next;
    });
  }, []);

  const clearProducts = useCallback(() => {
    setProducts([]);
    writeUploadedProducts([]);
  }, []);

  return useMemo(() => ({ products, addProduct, clearProducts }), [products, addProduct, clearProducts]);
}
