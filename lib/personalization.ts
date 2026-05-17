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
    
    // Yapay zekanın ürettiği dinamik açıklama kelimeleri
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