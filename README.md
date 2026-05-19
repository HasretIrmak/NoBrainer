# NoBrainer

FastAPI backend ve Next.js frontend ile calisan adaptif e-ticaret demo uygulamasi.

Proje iki deneyimi birlestirir:

- Satici paneli: urun sayfasi skorlarini, satis hunisini, iade riskini ve NoBrainer optimizasyon onerilerini gosterir.
- Musteri vitrini: backenddeki urunleri listeler, urun detayinda persona bazli icerik ve iade uyarisi uretir.

## Mevcut Entegrasyon Durumu

Frontend dosyalari repo kokundeki Next.js yapisindadir:

- `app/`
- `components/`
- `lib/`
- `public/`

Backend dosyalari `backend/` altindadir. Uygulama artik mock veri yerine FastAPI endpointlerini kullanir.

`frontend/` klasoru tam Next.js uygulamasi degildir; eski/yardimci dosyalar ve ilk gelen public varliklari icin duruyor. Calisan frontend repo kokundeki Next.js uygulamasidir.

## Branch Bilgisi

Su an entegrasyon icin kullanilan dal:

```bash
git checkout integration-demo
git fetch origin
```

Uzak branchleri gormek icin:

```bash
git branch -a -vv
```

`origin/main` frontend calismalarini, `origin/backend` backend calismalarini tasir. `integration-demo` bu iki tarafi bir araya getirmek icin kullanilir.

## Kurulum

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r ..\requirements.txt
uvicorn main:app --reload
```

Backend varsayilan adres:

```text
http://localhost:8000
```

Frontend:

```bash
npm install
npm run dev
```

Frontend varsayilan adres:

```text
http://localhost:3000
```

Frontend farkli bir backend adresi kullanacaksa kok dizinde `.env.local` olustur:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Backend Endpointleri

| Method | Path | Gorev |
| --- | --- | --- |
| GET | `/health` | Backend saglik kontrolu |
| GET | `/products/` | Tum urunleri listeler |
| GET | `/products/{product_id}` | Tek urun detayini dondurur |
| GET | `/products/search?query=...` | Urun arar |
| GET | `/products/persona/{persona}` | Personaya gore urun filtreler |
| POST | `/analyze/` | Urun skorlarini ve satici insightlarini dondurur |
| POST | `/return-risk/` | Iade riski, kullanici uyarisi ve satici aksiyonu dondurur |
| POST | `/persona/` | Style, comfort veya budget personasi icin icerik uretir |
| POST | `/optimize/` | Optimize baslik, aciklama, FAQ ve guven mesajlari uretir |
| GET | `/gemini/test` | Gemini baglantisini test eder |

POST isteklerinde temel govde:

```json
{
  "product_id": "shoe_001"
}
```

Persona istegi:

```json
{
  "product_id": "shoe_001",
  "persona": "comfort"
}
```

## Projenin Calisma Prensibi

1. Backend `backend/data/products.json` dosyasini okur ve Pydantic modelleriyle dogrular.
2. Frontend `/products/` endpointinden urunleri alir ve `/shop` sayfasinda listeler.
3. Kullanici urune girdiginde `/products/{id}`, `/return-risk/` ve `/persona/` endpointleri calisir.
4. Persona degistiginde frontend yeni `/persona/` istegi atar ve hero icerigini gunceller.
5. Satici paneli secilen urun icin `/analyze/` ve `/return-risk/` endpointlerini birlikte cagirir.
6. `Optimize et` butonu `/optimize/` endpointinden NoBrainer destekli sayfa metinlerini alir.
7. Gemini API key yoksa backend fallback cevaplar dondurur; bu sayede demo tamamen durmaz.

## Ozellikler

- Next.js App Router frontend
- FastAPI backend
- JSON tabanli urun verisi
- Persona bazli urun detay icerigi
- Iade riski skoru ve kullanici uyarisi
- Satici icin conversion, trust, visual, sales health ve pricing skorlamasi
- Recharts ile radar grafik
- Gemini entegrasyonu ve fallback sistemi
- Backend image pathleriyle uyumlu `public/images/products` gorsel servisi

## Onemli Dosyalar

| Dosya | Aciklama |
| --- | --- |
| `lib/api.ts` | Frontend tarafindaki FastAPI fetch fonksiyonlari |
| `lib/types.ts` | Backend response tipleri |
| `app/shop/page.tsx` | Backendden gelen urun vitrini |
| `app/shop/[id]/page.tsx` | Dinamik urun detayi, persona ve iade riski |
| `app/seller/page.tsx` | Satici analiz paneli |
| `backend/main.py` | FastAPI app ve router kayitlari |
| `backend/models.py` | Pydantic modeller |
| `backend/services/scoring_service.py` | Rule engine ve skor hesaplari |
| `backend/services/gemini_service.py` | Gemini/fallback katmani |
| `backend/data/products.json` | Urun veri kaynagi |
