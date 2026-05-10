# Adaptive Commerce Intelligence Platform

> Gemini AI destekli e-ticaret deneyim katmanı.  
> Satıcı optimizasyonu + adaptif kullanıcı deneyimi — tek sistemde.

---

## Proje Nedir?

Bugünkü e-ticaret platformları herkese **aynı ürün sayfasını** gösterir.  
Bu proje bunun önüne geçer:

- **Satıcıya** → ürün sayfasının dönüşüm zayıflıklarını ve iade riskini analiz eder
- **Kullanıcıya** → aynı ürünü kişilik tipine göre (Style / Comfort / Budget) farklı içerikle gösterir
- **İkisini bağlar** → aynı yorum analizi hem satıcıyı uyarır hem kullanıcıyı yönlendirir *(closed feedback loop)*

---

## Teknoloji Stack

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Frontend | Next.js 14 + TailwindCSS | Hızlı geliştirme, App Router |
| Animasyon | Framer Motion | Persona switch wow effect |
| Grafikler | Recharts | Seller dashboard skor grafikleri |
| Backend | Python FastAPI | Async, hızlı, Gemini entegrasyonu kolay |
| Validasyon | Pydantic v2 | Request/response şema kontrolü |
| AI | Google Gemini 2.0 Flash | Vision + Text + Reasoning tek API |
| Veri | JSON flat-file | DB yok, sıfır kurulum karmaşıklığı |

---

## Kurulum

### Gereksinimler

- Python 3.11+
- Node.js 18+
- Gemini API key → https://aistudio.google.com

---

### Backend

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

`.env` dosyasını aç, API key'ini yaz:

```
GEMINI_API_KEY=buraya_api_keyini_yaz
```

Backend'i başlat:

```bash
uvicorn main:app --reload
```

→ http://localhost:8000/health  
→ http://localhost:8000/docs (Swagger UI)

---

### Frontend

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install framer-motion recharts
npm run dev
```

→ http://localhost:3000

---

## Uygulama Sayfaları

| URL | Sayfa | Kim Kullanır |
|-----|-------|--------------|
| `/` | Landing page | Herkes |
| `/seller` | AI Conversion Doctor dashboard | Satıcı |
| `/shop` | Sneaker vitrin | Kullanıcı |
| `/shop/[id]` | Dinamik ürün sayfası + persona switch | Kullanıcı |

---

## API Endpoint'leri

| Method | Path | Ne Yapar |
|--------|------|----------|
| GET | `/products/` | Tüm ürünleri listele |
| GET | `/products/{id}` | Tek ürün detayı |
| POST | `/analyze/` | Conversion + trust analizi (Seller) |
| POST | `/return-risk/` | İade riski analizi (Her iki taraf) |
| POST | `/persona/` | Persona bazlı içerik üretimi (User) |
| POST | `/optimize/` | Başlık + açıklama + FAQ optimizasyonu (Seller) |

---

## Sistem Akışı

```
Satıcı ürün seçer
    → POST /analyze/
    → Gemini: conversion zayıflıkları + trust sorunları
    → Seller dashboard'a skor + insight listesi döner

    → POST /return-risk/
    → Rule engine + Gemini: dar kalıp, geniş ayak riski
    → Satıcıya: "Kalıp bilgisini ürüne ekle"
    → Kullanıcıya: "⚠️ Yarım numara büyük alın"
           ↑ İşte bu closed feedback loop

Kullanıcı ürün sayfasına girer
    → Persona seçer: Style / Comfort / Budget
    → POST /persona/
    → Gemini: persona odaklı hero_title + description + features
    → Sayfa anlık güncellenir (Framer Motion animasyon)

Satıcı "Optimize with AI" tıklar
    → POST /optimize/
    → Gemini: yeni başlık + açıklama + FAQ + trust mesajları
    → Önce/Sonra karşılaştırma UI'ı
```

---

## Ürün Sayısını Artırma

`backend/data/sneakers.json` dosyasına kayıt ekle:

```json
{
  "id": "sneaker_031",
  "title": "Ürün Başlığı",
  "brand": "Marka",
  "price": 2999,
  "rating": 4.3,
  "description": "Açıklama metni...",
  "reviews": ["Yorum 1", "Yorum 2", "Yorum 3"],
  "tags": ["casual", "comfort"],
  "known_issues": ["runs_small"],
  "image": "/images/sneakers/sneaker_031.jpg"
}
```

Restart gerekmez — JSON her istekte okunur.

---

## Klasör Yapısı

```
adaptive-commerce-ai/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, router kayıt
│   ├── models.py                # Pydantic request/response şemaları
│   ├── requirements.txt
│   ├── .env                     # GEMINI_API_KEY (git'e commit etme!)
│   ├── routers/
│   │   ├── products.py          # GET /products/
│   │   ├── analyze.py           # POST /analyze/
│   │   ├── return_risk.py       # POST /return-risk/
│   │   ├── persona.py           # POST /persona/
│   │   └── optimize.py          # POST /optimize/
│   ├── services/
│   │   ├── gemini_service.py    # Tüm Gemini API çağrıları
│   │   ├── product_service.py   # JSON okuma, ürün getirme
│   │   └── scoring_service.py   # Rule engine + 0-100 skorlar
│   ├── prompts/
│   │   ├── conversion_prompt.py # Başlık + açıklama analizi
│   │   ├── return_prompt.py     # İade risk yorumlama
│   │   ├── persona_prompt.py    # Style/Comfort/Budget içerik
│   │   └── optimize_prompt.py  # Başlık + FAQ üretimi
│   └── data/
│       └── sneakers.json        # 30+ curated ürün
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing
│   │   ├── seller/page.tsx      # Seller dashboard
│   │   ├── shop/page.tsx        # Ürün vitrin
│   │   └── shop/[id]/page.tsx   # Dinamik ürün sayfası
│   ├── components/
│   │   ├── seller/              # ScoreCard, InsightList, OptimizePanel
│   │   ├── shop/                # PersonaSwitch, ProductHero, ReturnWarning
│   │   └── ui/                  # Navbar, LoadingSpinner
│   ├── lib/
│   │   ├── api.ts               # Backend fetch fonksiyonları
│   │   └── types.ts             # TypeScript interface'ler
│   └── public/images/sneakers/  # Ürün görselleri
└── README.md
```

---

## Geliştirme Notları

- **Scraper yok** — JSON ile çalışıyoruz, sıfır hata riski
- **Veritabanı yok** — `sneakers.json` yeterli, kurulum sıfır
- **ML yok** — Gemini reasoning + rule engine, demo için daha güçlü ve açıklanabilir
- **Prompt'lar** `backend/prompts/` klasöründe ayrı dosyalar — düzenlemesi kolay
- **Return Intelligence** hem seller hem user tarafını aynı Gemini çağrısından besler