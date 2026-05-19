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

export const PERSONA_PROFILES: Record<
  Persona,
  {
    title: string;
    summary: string;
    signals: string[];
    preferences: Pick<
      UserProfile,
      "coupon_sensitive" | "fit_sensitive" | "style_sensitive" | "comfort_sensitive" | "budget_sensitive"
    >;
  }
> = {
  style: {
    title: "Style Hunter",
    summary: "Trend görünüm, kombin uyumu ve güçlü ilk izlenim arar.",
    signals: ["Trend tasarım", "Sportif silüet", "Kombin uyumu"],
    preferences: {
      coupon_sensitive: false,
      fit_sensitive: false,
      style_sensitive: true,
      comfort_sensitive: false,
      budget_sensitive: false,
    },
  },
  comfort: {
    title: "Comfort Keeper",
    summary: "Gün boyu rahatlık, doğru kalıp ve düşük iade riski ister.",
    signals: ["Standart kalıp", "Konfor yorumları", "Düşük risk"],
    preferences: {
      coupon_sensitive: false,
      fit_sensitive: true,
      style_sensitive: false,
      comfort_sensitive: true,
      budget_sensitive: false,
    },
  },
  budget: {
    title: "Value Sniper",
    summary: "Fiyat/performans, kupon ve kategori ortalamasına göre iyi fırsat arar.",
    signals: ["Kupon avantajı", "Fiyat/değer", "Güvenli indirim"],
    preferences: {
      coupon_sensitive: true,
      fit_sensitive: false,
      style_sensitive: false,
      comfort_sensitive: false,
      budget_sensitive: true,
    },
  },
};

export function applyPersonaPreset(profile: UserProfile, persona: Persona): UserProfile {
  return {
    ...profile,
    ...PERSONA_PROFILES[persona].preferences,
    persona,
  };
}

// 🎯 ETİKETLERİ VE GEMINI ANALİZ KUTUSUNDAKİ İNGİLİZCE KELİMELERİ ÇEVİREN SÖZLÜK
export function translateTag(tag: string): string {
  if (!tag) return "";
  
  const dictionary: Record<string, string> = {
    "running": "Koşu",
    "sneaker": "Spor Ayakkabı",
    "comfort": "Maksimum Konfor",
    "casual": "Günlük Kullanım",
    "breathable": "Nefes Alabilir Kumaş",
    "lightweight": "Ultra Hafif",
    "durable": "Yüksek Dayanıklılık",
    "unisex": "Uniseks",
    "budget": "Fiyat/Performans",
    "sporty": "Sportif Tarz",
    "style": "Trend Tasarım",
    "regular": "Standart Kalıp",
    "narrow": "Dar Kalıp",
    "small": "Küçük Kalıp",
    "runs_small": "Dar Kalıp (1 Numara Büyük Alınız)",
    "narrow_fit": "Dar Kalıp",
    "wide_feet_issue": "Taraklı Ayaklar İçin Uygun Değil",
    "comfort_negative": "Sert Taban Sinyali",
    "cheap_material": "Ortalama Malzeme Kalitesi",
    "low_durability": "Düşük Dayanıklılık Riski",
    
    // Renk ve kombin varyasyonları
    "white color styling": "Beyaz Renk Kombini",
    "brown color styling": "Kahverengi Renk Kombini",
    "black color styling": "Siyah Renk Kombini",
    "grey color styling": "Gri Renk Kombini",
    "gray color styling": "Gri Renk Kombini",
    "blue color styling": "Mavi Renk Kombini",
    "red color styling": "Kırmızı Renk Kombini",
    "casual outfit match": "Günlük Giyim Uyumu",
    "sports outfit match": "Spor Giyim Uyumu",
    "style-first product presentation": "Tarz Odaklı Ürün Sunumu"
  };
  
  const cleanTag = tag.toLowerCase().trim().replace(/\s+/g, " ");
  return dictionary[cleanTag] || tag;
}

// 🎯 SEKMELER ARASI GEÇİŞTE METİNLERİN DONMASINI ENGELLEYEN DİNAMİK ÇEVİRİ MOTORU
export function translateTitle(title: string): string {
  if (!title) return "";

  // 1. Kısım: Tam Cümle Kalkanları (Sabit veya bilinen uyarılar için)
  const sentenceMap: Record<string, string> = {
    "this sneaker may feel tight. consider sizing up, especially if you have wide feet.": 
      "Bu ayakkabının kalıbı biraz dar gelebilir. Özellikle taraklı ayak yapısına sahipseniz konforunuz için 1 numara büyük almanızı öneririz."
  };

  const cleanInput = title.toLowerCase().trim().replace(/\s+/g, " ");
  if (sentenceMap[cleanInput]) {
    return sentenceMap[cleanInput];
  }

  // 2. Kısım: Akıllı Dinamik Kelime/Token Çevirici
  // Backend'den (Gemini'dan) ne gelirse gelsin kelime kelime eşleştirip dinamik yapıyı bozmadan Türkçeleştirir.
  const wordDictionary: Record<string, string> = {
    // Genel kelimeler
    "men": "Erkek", "men's": "Erkek", "women": "Kadın", "women's": "Kadın",
    "shoes": "Ayakkabısı", "shoe": "Ayakkabı", "running": "Koşu", "casual": "Günlük",
    "brown": "Kahverengi", "black": "Siyah", "white": "Beyaz", "blue": "Mavi", "red": "Kırmızı",
    "sportswear": "Spor", "sneakers": "Spor Ayakkabı", "sneaker": "Spor Ayakkabı",
    "captoe": "Klasik Burun", "with": "ve", "a": "", "sharper": "Şık", "everyday": "Günlük", "look": "Görünüm",
    
    // NoBrainer motorunun urettigi dinamik aciklama kelimeleri
    "built": "tasarlanmış",
    "for": "için",
    "outfits": "kombinler",
    "outfit": "kombin",
    "where": "ki burada",
    "the": "",
    "needs": "gerekiyor",
    "to": "",
    "carry": "taşımak",
    "best": "en iyisi",
    "shoppers": "alışveriş yapanlar",
    "who": "olanlar",
    "care": "önem veren",
    "about": "hakkında",
    "styling": "stil",
    "silhouette": "silüet",
    "and": "ve",
    "first": "ilk",
    "impression": "izlenim",
    "preference": "tercih",
    "prioritizes": "önceliklendiren",
    "all-day": "gün boyu",
    "wear": "kullanım",
    "cushioning": "yastıklama",
    "support": "destek",
    "value": "fiyat/performans",
    "conscious": "bilinçli",
    "smart": "akıllı",
    "buyers": "alıcılar"
  };

  const words = title.split(/(\s+)/); // Boşlukları koruyarak kelimelere ayırıyoruz
  const translatedWords = words.map(word => {
    // Kelimeyi temizle
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9']/g, "");
    if (!cleanWord) return word; // Boşluk veya noktalama işaretlerini aynen koru
    
    const match = wordDictionary[cleanWord];
    if (match !== undefined) {
      // Eğer kelime sözlükte varsa, orijinal kelimenin sonundaki noktayı/virgülü koruyarak ekle
      const suffix = word.slice(cleanWord.length);
      return match + suffix;
    }
    
    // Sözlükte yoksa marka adıdır veya özel terimdir, ilk harfini büyük bırak
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  return translatedWords.join("").trim().replace(/\s+/g, " ");
}

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

  const tags = new Set(product.tags);
  const issues = new Set(product.known_issues);
  const avgPrice = product.market_signals.avg_category_price || product.price || 1;
  const priceRatio = product.price / avgPrice;
  const returnRate = product.sales_signals.return_rate || 0;
  let score = 36;
  const persona = profile.persona;

  if (product.target_personas.includes(persona)) {
    score += 14;
  }

  if (persona === "style") {
    if (tags.has("style")) score += 28;
    if (tags.has("sporty")) score += 16;
    if (tags.has("casual") || tags.has("daily")) score += 8;
    if (product.visual_signals.image_quality === "high") score += 8;
    if (issues.has("cheap_material") || issues.has("low_durability")) score -= 8;
    score -= returnRate * 18;
  }

  if (persona === "comfort") {
    if (tags.has("comfort")) score += 26;
    if (tags.has("breathable")) score += 8;
    if (tags.has("lightweight")) score += 8;
    if (tags.has("durable")) score += 8;
    if (product.fit_type === "regular") score += 22;
    if (["small", "narrow"].includes(product.fit_type)) score -= 18;
    if (issues.has("runs_small")) score -= 14;
    if (issues.has("narrow_fit") || issues.has("wide_feet_issue")) score -= 18;
    if (issues.has("comfort_negative") || issues.has("poor_cushioning")) score -= 20;
    score -= returnRate * 48;
  }

  if (persona === "budget") {
    const coupon = getCoupon(product, profile);
    if (tags.has("budget")) score += 26;
    if (priceRatio <= 0.75) score += 22;
    else if (priceRatio <= 0.9) score += 16;
    else if (priceRatio <= 1) score += 8;
    else if (priceRatio > 1.2) score -= 16;
    score += coupon.discount * 0.8;
    if (product.rating >= 4.2) score += 8;
    if (returnRate >= 0.25) score -= 14;
    if (issues.has("cheap_material") || issues.has("low_durability")) score -= 10;
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
    score -= 14;
  }

  score += Math.max(0, product.rating - 3.5) * 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getMatchReason(product: Product, profile: UserProfile | null) {
  if (!profile) {
    return "Profilini tamamlayınca öneri motoru bu ürünü sana göre sıralar.";
  }

  if (profile.persona === "budget") {
    const coupon = getCoupon(product, profile);
    const avgPrice = product.market_signals.avg_category_price || product.price || 1;
    const priceRatio = product.price / avgPrice;
    return coupon.eligible
      ? `Value Sniper için ${coupon.label}, ${priceRatio <= 1 ? "kategoriye göre iyi fiyat" : "kontrollü fiyat"} ve iade riski birlikte değerlendirildi.`
      : "Value Sniper için fiyat, puan ve iade sinyalleri birlikte kontrol edildi.";
  }

  if (profile.persona === "comfort") {
    const hasFitRisk = ["small", "narrow"].includes(product.fit_type) || product.known_issues.some((issue) => ["runs_small", "narrow_fit", "wide_feet_issue", "comfort_negative"].includes(issue));
    return !hasFitRisk
      ? "Comfort Keeper için kalıp, konfor yorumu ve düşük iade riski öne çıkıyor."
      : "Comfort Keeper için kalıp ve konfor sinyalleri dikkatli kontrol edildi.";
  }

  return "Style Hunter için görünüm, kullanım tarzı ve kombin sinyalleri öne çıkarıldı.";
}

export function sortProductsForProfile(products: Product[], profile: UserProfile | null) {
  return [...products].sort(
    (a, b) => scoreProductForProfile(b, profile) - scoreProductForProfile(a, profile)
  );
}
