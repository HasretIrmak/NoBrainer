# NoBrainer

**AI-assisted decision support for e-commerce.** NoBrainer goes beyond listing products: it scores return risk, mines review signals, personalizes the storefront by shopper persona, and gives sellers concrete recommendations to improve their listings.

> Turkish version: [README.tr.md](README.tr.md)

## Overview

NoBrainer is a full-stack MVP built around two experiences:

- **Customer experience:** persona-based product ranking (style, comfort, budget), personalized product pages, favorites, cart and coupons, return-risk warnings, and a quick return-code flow.
- **Seller experience:** a dashboard for store-level product management, sales funnel, return risk, finance summary (revenue, costs, shipping, profit, return cost), listing-quality scores, and AI-generated optimization suggestions.

The current version runs on a curated footwear catalog (24 products) as a demo architecture. The target design is category-agnostic; electronics and real operational data are on the roadmap.

## Key Features

- Product storefront and detail pages with persona-driven personalization
- Per-product **return-risk analysis** with a buyer warning and a recommended seller action
- **Review summarization**: positive and negative themes and risk reasons extracted from reviews
- Seller dashboard with funnel metrics (views, clicks, add-to-cart, sales, return rate) and financial tracking
- **Listing-quality scores**: title, description, imagery, trust, reviews, price competitiveness, sales health, return risk
- **Gemini-powered content**: persona copy, review summaries, return explanations, and listing optimization text (title, description, FAQ, trust messages)
- **Graceful degradation**: if the Gemini key is missing, quota is exceeded, or a live call fails, the backend returns fallback responses so the flow keeps working
- Sellers can add new products and include them in the local analysis flow

## Architecture

NoBrainer pairs two layers:

1. **Rule-based scoring engine:** deterministically scores product data, review signals, return indicators, and funnel metrics.
2. **LLM decision layer:** Gemini generates persona content, review summaries, return explanations, and listing optimization text, with a model fallback chain and JSON cleanup.

```text
NoBrainer
├── app/                  # Next.js App Router pages
├── components/           # Shared UI and product/seller components
├── lib/                  # API client, stores, types, personalization logic
├── public/               # Product images
├── backend/
│   ├── main.py           # FastAPI application
│   ├── models.py         # Pydantic models
│   ├── routers/          # API routes
│   ├── services/         # Scoring, product service, Gemini layer
│   ├── prompts/          # Gemini prompt templates
│   ├── data/             # Demo product datasets
│   └── scripts/          # Data preparation / transformation scripts
└── requirements.txt      # Backend dependencies
```

**How a request flows**

1. The backend loads `backend/data/products.json` and validates it with Pydantic models.
2. The frontend fetches `/products/` and renders the `/shop` page.
3. The shopper's persona (style, comfort or budget) influences product match scores.
4. The product detail page combines `/products/{id}`, `/return-risk/`, `/reviews-summary/` and `/persona/`.
5. Cart, favorites, return codes and demo session state are kept in `localStorage`.
6. The seller dashboard calls `/analyze/` and `/return-risk/` for the selected product.
7. The "NoBrainer suggestion" action calls `/optimize/` for listing improvements.
8. If a live Gemini call fails, the backend serves fallback data and the demo continues.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Pydantic |
| AI | Google Gemini API |
| Data | JSON product catalog (demo) |
| State | React state, `localStorage`-based demo stores |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+

### 1. Backend

```bash
python -m venv .venv
# Windows (PowerShell): .\.venv\Scripts\activate
# macOS / Linux:        source .venv/bin/activate
pip install -r requirements.txt
```

Optional Gemini configuration: copy `backend/.env.example` to `backend/.env` and set your key.

```env
GEMINI_API_KEY=your_api_key_here
MODEL_NAME=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-2.5-flash,gemini-2.0-flash
```

Without a key the app still runs and returns fallback responses.

Start the API (runs on `http://localhost:8000`):

```bash
cd backend
uvicorn main:app --reload
```

On Windows you can also run `npm run dev:backend` from the repo root (use `npm.cmd` if PowerShell blocks `npm`).

### 2. Frontend

In a second terminal, from the repo root:

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`. If the port is busy, use `npm run dev -- --port 3001`.

> `npm run build` only produces a production build; it does not start the app. Use `npm run start` after building.

### Demo accounts

These are demo-only credentials for local use.

| Role | Username | Password |
| --- | --- | --- |
| Customer | `kullanici` | `123456` |
| Seller | `satici` | `123456` |

## API Reference

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Backend health check |
| GET | `/products/` | List all products |
| GET | `/products/{product_id}` | Get a single product |
| GET | `/products/search?query=...` | Search products |
| GET | `/products/shoe-type/{shoe_type}` | Filter by shoe type |
| GET | `/products/persona/{persona}` | Filter by persona |
| POST | `/analyze/` | Product score, sales funnel and seller recommendations |
| POST | `/return-risk/` | Return risk, buyer warning and seller action |
| POST | `/persona/` | Persona-specific (style, comfort, budget) product content |
| POST | `/optimize/` | Title, description, FAQ and trust-message suggestions |
| POST | `/reviews-summary/` | Review summary, pros/cons and risk reasons |
| GET | `/gemini/test` | Test the Gemini connection |

Request body (most POST endpoints):

```json
{ "product_id": "shoe_001" }
```

Persona request:

```json
{ "product_id": "shoe_001", "persona": "comfort" }
```

## Key Files

| File | Purpose |
| --- | --- |
| `app/shop/[id]/page.tsx` | Product detail: persona content, return risk, review summary |
| `app/seller/page.tsx` | Seller dashboard, finance summary, listing optimization |
| `app/returns/page.tsx` | Return code and risk-reason flow |
| `lib/api.ts` | Frontend client for the FastAPI backend |
| `lib/personalization.ts` | Persona, coupon and product-match logic |
| `lib/userStore.ts` | Cart, favorites, profile and returns state |
| `backend/main.py` | FastAPI app and router registration |
| `backend/services/scoring_service.py` | Scoring and risk engine |
| `backend/services/gemini_service.py` | Gemini client, fallback model chain, JSON cleanup |
| `backend/data/products.json` | Demo product dataset |

## Data

The demo uses a prepared dataset instead of live marketplace integrations. Its structure is modeled on public e-commerce research data (review datasets, fashion catalogs, product image sources) and includes:

- 24 footwear products (sneaker, formal shoe, sandal, slipper)
- Title, brand, price, category, gender, color, usage and description fields
- Customer reviews with sentiment and review-derived risk signals
- Funnel metrics: views, clicks, add-to-cart, sales, return rate
- Image-quality signals and listing improvement suggestions
- Market signals: category average price, competitor average rating, shared strengths

## Verification

```bash
npm run build                       # frontend production build
python -m compileall backend        # backend syntax check
curl http://localhost:8000/health   # backend health
curl http://localhost:8000/gemini/test   # Gemini connectivity
```

## Known Limitations

- Product data is a demo dataset, not live marketplace data.
- Personalization uses demo profile signals instead of real user history.
- Seller financial metrics use demo calculation logic.
- On Gemini quota errors the system returns fallback responses by design.
- Only the footwear category is active; electronics and others are on the roadmap.

## Roadmap

- Category-specific schema and risk signals for electronics (specs fit, warranty trust, battery complaints, shipping damage, price/performance)
- Integration of real order, return, view and review data
- Supervised ML for return-risk prediction
- Category-agnostic recommendation / learning-to-rank model
- NLP aspect-based sentiment analysis for reviews
- Computer-vision listing-quality scoring
- Real cost, stock and campaign data in the seller dashboard
- A/B testing and performance dashboards; user segmentation and lifecycle analytics
