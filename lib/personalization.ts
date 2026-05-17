import type { Persona, Product, UserProfile } from "./types";

export const DEFAULT_PROFILE: UserProfile = {
  name: "Demo Kullanıcı",
  gender: "Unisex",
  age_group: "adult",
  persona: "style",
  coupon_sensitive: true,
  fit_sensitive: true,
  style_sensitive: true,
  comfort_sensitive: false,
  budget_sensitive: false,
};

export function inferPersona(input: {
  style_sensitive: boolean;
  comfort_sensitive: boolean;
  budget_sensitive: boolean;
  coupon_sensitive: boolean;
  fit_sensitive: boolean;
}): Persona {
  const scores: Record<Persona, number> = {
    style: input.style_sensitive ? 3 : 0,
    comfort: input.comfort_sensitive || input.fit_sensitive ? 3 : 0,
    budget: input.budget_sensitive || input.coupon_sensitive ? 3 : 0,
  };

  if (scores.comfort >= scores.style && scores.comfort >= scores.budget) {
    return "comfort";
  }

  if (scores.budget >= scores.style && scores.budget >= scores.comfort) {
    return "budget";
  }

  return "style";
}

export function personaLabel(persona: Persona) {
  if (persona === "comfort") return "Konfor";
  if (persona === "budget") return "Bütçe";
  return "Stil";
}

export function getCoupon(product: Product, profile?: UserProfile | null) {
  const avgPrice = product.market_signals.avg_category_price || product.price || 1;
  const priceRatio = product.price / avgPrice;
  let discount = 0;

  if (profile?.coupon_sensitive || profile?.persona === "budget") {
    discount += 8;
  }

  if (product.tags.includes("budget") || priceRatio <= 0.9) {
    discount += 7;
  }

  if (product.sales_signals.return_rate >= 0.22) {
    discount += 5;
  }

  discount = Math.min(discount, 25);

  return {
    eligible: discount > 0,
    discount,
    label: discount > 0 ? `%${discount} kupon` : "Kupon yok",
    finalPrice: Math.round(product.price * (1 - discount / 100)),
  };
}

export function scoreProductForProfile(product: Product, profile: UserProfile | null) {
  if (!profile) {
    return 50;
  }

  let score = 45;
  const persona = profile.persona;

  if (product.target_personas.includes(persona)) {
    score += 22;
  }

  if (persona === "style" && (product.tags.includes("style") || product.tags.includes("sporty"))) {
    score += 16;
  }

  if (persona === "comfort" && (product.tags.includes("comfort") || product.fit_type === "regular")) {
    score += 18;
  }

  if (persona === "budget") {
    const coupon = getCoupon(product, profile);
    score += coupon.discount;
    if (product.tags.includes("budget")) {
      score += 12;
    }
  }

  if (profile.gender !== "Unisex") {
    if (product.gender === profile.gender || product.gender === "Unisex") {
      score += 12;
    } else {
      score -= 18;
    }
  }

  if (profile.age_group === "teen" || profile.age_group === "young_adult") {
    if (product.tags.includes("style") || product.tags.includes("sporty")) {
      score += 8;
    }
  }

  if (profile.age_group === "adult" || profile.age_group === "senior") {
    if (product.tags.includes("comfort") || product.known_issues.length === 0) {
      score += 8;
    }
  }

  if (profile.fit_sensitive && ["small", "narrow"].includes(product.fit_type)) {
    score -= 12;
  }

  score += Math.max(0, product.rating - 3.5) * 6;
  score -= product.sales_signals.return_rate * 30;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getMatchReason(product: Product, profile: UserProfile | null) {
  if (!profile) {
    return "Profilini tamamlayınca öneri motoru bu ürünü sana göre sıralar.";
  }

  if (profile.persona === "budget") {
    const coupon = getCoupon(product, profile);
    return coupon.eligible
      ? `Bütçe personası için ${coupon.label} ve fiyat/değer dengesi öne çıkıyor.`
      : "Bütçe personası için fiyat, puan ve iade sinyalleri birlikte değerlendirildi.";
  }

  if (profile.persona === "comfort") {
    return product.fit_type === "regular"
      ? "Konfor personası için düzenli kalıp ve yorum sinyalleri daha uygun görünüyor."
      : "Konfor personası için kalıp ve iade sinyallerini dikkatli kontrol etmek gerekiyor.";
  }

  return "Stil personası için görünüm, kullanım ve stil etiketleri öne çıkarıldı.";
}

export function sortProductsForProfile(products: Product[], profile: UserProfile | null) {
  return [...products].sort(
    (a, b) => scoreProductForProfile(b, profile) - scoreProductForProfile(a, profile)
  );
}
