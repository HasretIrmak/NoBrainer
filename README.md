# NoBrainer

NoBrainer, e-ticaret ürün sayfalarını yalnızca listeleyen değil; kullanıcı profili, iade riski, yorum sinyalleri, fiyat hassasiyeti ve satıcı performansı üzerinden karar destek katmanı sunan bir akıllı ticaret platformu prototipidir.

Proje iki ana deneyim üzerine kuruludur:

- Müşteri deneyimi: kullanıcının persona profiline göre ürün sıralama, ürün detayını kişiselleştirme, kupon/sepete ekleme, favori, iade uyarısı ve hızlı iade kodu akışları.
- Satıcı deneyimi: mağaza bazlı ürün yönetimi, satış hunisi, iade riski, finans özeti, ürün sayfası kalitesi ve NoBrainer destekli optimizasyon önerileri.

Mevcut sürüm ayakkabı kategorisiyle çalışan bir MVP/demo mimarisidir. İlerleyen aşamalarda elektronik kategorisi ve gerçek operasyonel e-ticaret verileriyle çalışan daha gelişmiş AI/ML modelleri hedeflenmektedir.

## Mevcut Durum

Aktif frontend uygulaması repo kökündeki Next.js App Router yapısındadır:

- `app/`
- `components/`
- `lib/`
- `public/`

Backend uygulaması `backend/` klasörü altında FastAPI ile çalışır. `frontend/` klasörü eski/yardımcı frontend çıktıları ve ilk aktarılan varlıklar için tutulmaktadır; çalışan ana arayüz repo kökündeki Next.js uygulamasıdır.

Şu anda uygulama `backend/data/products.json` içindeki hazır ürün verisini kullanır. Veri seti ayakkabı ürünleri, ürün görselleri, yorum sinyalleri, satış hunisi metrikleri, pazar sinyalleri ve iade risk sinyallerinden oluşur.

## Ürün Kapsamı

NoBrainer'ın mevcut MVP kapsamı:

- Ürün vitrini ve ürün detay sayfası
- Style, comfort ve budget personlarına göre kişiselleştirme
- Kullanıcı profili, favoriler, sepet, kupon ve demo sipariş akışı
- Ürün bazlı iade riski analizi
- Yorumlardan olumlu/olumsuz tema çıkarımı
- Satıcı panelinde mağaza, ürün, ciro, gider, kargo, kâr ve iade maliyeti takibi
- Ürün sayfası kalite skorları: başlık, açıklama, görsel, güven, yorum, fiyat rekabeti, satış sağlığı ve iade riski
- Gemini destekli içerik üretimi ve kota/API hatalarında fallback yanıt sistemi
- Satıcının yeni ürün ekleyebilmesi ve yerel analiz akışına dahil edebilmesi

## Veri Stratejisi

Bu demo aşamasında gerçek canlı pazar yeri entegrasyonu yerine hazır veri setleri kullanılmaktadır. Veri yapısı, Amazon yorum datasetleri, moda/katalog ürün datasetleri ve ürün görsel veri kaynakları gibi e-ticaret araştırmalarında kullanılan hazır kaynaklara benzer şekilde modellenmiştir.

Mevcut veri katmanı şunları içerir:

- 24 adet ayakkabı ürünü
- Sneaker, formal shoe, sandal ve slipper alt tipleri
- Ürün başlığı, marka, fiyat, kategori, cinsiyet, renk, kullanım amacı ve açıklama alanları
- Kullanıcı yorumları, sentiment bilgisi ve yorumdan çıkarılan risk sinyalleri
- Satış hunisi metrikleri: görüntülenme, tıklama, sepete ekleme, satış ve iade oranı
- Görsel kalite sinyalleri ve ürün sayfası iyileştirme önerileri
- Pazar sinyalleri: kategori ortalama fiyatı, rakip ortalama puanı ve ortak güçlü yönler
- Kaynak izleme alanları: görsel/katalog eşleşmesi, açıklama kaynağı ve yorum havuzu stratejisi

Gelecek hedefi, demo veri setinden gerçek operasyonel veriye geçmektir. Bunun için sipariş, iade, ürün görüntüleme, tıklama, sepet, satın alma, kullanıcı segmenti, yorum, stok, kargo ve satıcı maliyet verilerinin güvenli şekilde sisteme bağlanması planlanmaktadır.

## AI ve ML Yaklaşımı

Mevcut sürümde iki katman birlikte çalışır:

- Kural tabanlı skor motoru: ürün verisi, yorum sinyalleri, iade göstergeleri ve satış hunisi metriklerini deterministik olarak puanlar.
- LLM destekli karar katmanı: Gemini ile persona içeriği, yorum özeti, iade açıklaması ve ürün sayfası optimizasyon metinleri üretir.

Gemini API anahtarı yoksa, kota aşılırsa veya canlı çağrı başarısız olursa backend fallback yanıtlar döndürür. Bu sayede demo akışı tamamen durmaz.

İlerleyen aşamalarda daha spesifik makine öğrenmesi yöntemleri eklenmesi planlanmaktadır:

- İade riski tahmini için supervised classification modelleri
- Kullanıcı-ürün eşleşmesi için learning-to-rank ve öneri sistemleri
- Yorumlardan konu, duygu ve problem çıkarımı için NLP/aspect-based sentiment analysis
- Ürün sayfası kalitesi ve görsel yeterliliği için computer vision tabanlı kalite skoru
- Fiyat ve kampanya etkisi için price elasticity / uplift modeling
- Satıcı performansı için demand forecasting ve anomaly detection
- A/B test sonuçlarını değerlendiren deney analitiği

## Gelecek Kategori Planı

Mevcut veri modeli ayakkabı kategorisine göre örneklenmiştir; ancak sistemin hedef mimarisi kategori bağımsızdır.

Yakın vadeli kategori genişlemesi:

- Elektronik ürünler
- Aksesuarlar
- Giyim alt kategorileri

Elektronik kategorisi eklendiğinde ürün sinyalleri de kategoriye özel genişletilecektir:

- Teknik özellik uyumu
- Garanti ve servis güveni
- Batarya/performans şikayetleri
- Kargo hasarı ve kutu açılım riski
- Fiyat/performans karşılaştırması
- Kullanım amacı bazlı öneriler

## Mimari

```text
NoBrainer
├── app/                  # Next.js App Router sayfaları
├── components/           # Ortak UI ve ürün/satıcı bileşenleri
├── lib/                  # Frontend API, store, tip ve kişiselleştirme katmanı
├── public/               # Ürün görselleri
├── backend/
│   ├── main.py           # FastAPI uygulaması
│   ├── models.py         # Pydantic modelleri
│   ├── routers/          # API route dosyaları
│   ├── services/         # Skorlama, ürün servisi ve Gemini katmanı
│   ├── prompts/          # Gemini prompt şablonları
│   ├── data/             # Demo ürün veri setleri
│   └── scripts/          # Veri hazırlama / dönüştürme scriptleri
└── requirements.txt      # Backend bağımlılıkları
```

## Teknoloji Yığını

- Frontend: Next.js 14, React 18, TypeScript
- UI: Tailwind CSS, Framer Motion, Recharts
- Backend: FastAPI, Pydantic
- AI entegrasyonu: Google Gemini API
- Veri: JSON tabanlı demo ürün kataloğu
- Durum yönetimi: React state, localStorage tabanlı demo store yapısı

## Kurulum

Önce backend ortamını hazırlayın:

```powershell
cd "directory_path"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Opsiyonel Gemini ayarı için `backend/.env` dosyası oluşturulabilir:

```env
GEMINI_API_KEY=your_api_key_here
MODEL_NAME=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-2.5-flash,gemini-2.0-flash
```

Frontend bağımlılıklarını kurun:

```powershell
npm.cmd install
```

## Çalıştırma

Proje iki ayrı server ile çalışır. Backendin çalışması tek başına `localhost:3000` adresini açmaz. `npm.cmd run build` komutu da uygulamayı başlatmaz; yalnızca production build üretir.

1. Backend terminali:

```powershell
cd "directory_path"
npm.cmd run dev:backend
```

Backend adresi:

```text
http://localhost:8000
```

2. Frontend için ikinci terminal:

```powershell
cd "directory_path"
npm.cmd run dev
```

Frontend adresi:

```text
http://localhost:3000
```

3000 portu doluysa:

```powershell
npm.cmd run dev -- --port 3001
```

Production çalıştırma:

```powershell
npm.cmd run build
npm.cmd run start
```

## Demo Hesapları

Müşteri hesabı:

```text
Kullanıcı adı: kullanici
Şifre: 123456
```

Satıcı hesabı:

```text
Kullanıcı adı: satici
Şifre: 123456
```

## API Endpointleri

| Method | Path | Açıklama |
| --- | --- | --- |
| GET | `/health` | Backend sağlık kontrolü |
| GET | `/products/` | Tüm ürünleri listeler |
| GET | `/products/{product_id}` | Tek ürün detayı döndürür |
| GET | `/products/search?query=...` | Ürün araması yapar |
| GET | `/products/shoe-type/{shoe_type}` | Ayakkabı tipine göre filtreler |
| GET | `/products/persona/{persona}` | Personaya göre ürün filtreler |
| POST | `/analyze/` | Ürün skoru, satış hunisi ve satıcı önerileri üretir |
| POST | `/return-risk/` | İade riski, kullanıcı uyarısı ve satıcı aksiyonu üretir |
| POST | `/persona/` | Style, comfort veya budget personası için ürün içeriği üretir |
| POST | `/optimize/` | Başlık, açıklama, FAQ ve güven mesajları önerir |
| POST | `/reviews-summary/` | Yorumlardan özet, olumlu/olumsuz noktalar ve risk nedenleri çıkarır |
| GET | `/gemini/test` | Gemini bağlantısını test eder |

Temel POST gövdesi:

```json
{
  "product_id": "shoe_001"
}
```

Persona isteği:

```json
{
  "product_id": "shoe_001",
  "persona": "comfort"
}
```

## Çalışma Prensibi

1. Backend `backend/data/products.json` dosyasını okur ve Pydantic modelleriyle doğrular.
2. Frontend `/products/` endpointinden ürünleri alır ve `/shop` sayfasında listeler.
3. Kullanıcı profili style, comfort veya budget personasına göre ürün eşleşme skorunu etkiler.
4. Ürün detayında `/products/{id}`, `/return-risk/`, `/reviews-summary/` ve `/persona/` endpointleri birlikte çalışır.
5. Sepet, favoriler, iade kodları ve demo oturum bilgileri localStorage üzerinde tutulur.
6. Satıcı paneli seçili ürün için `/analyze/` ve `/return-risk/` endpointlerini çağırır.
7. `NoBrainer önerisi üret` akışı `/optimize/` endpointinden ürün sayfası iyileştirme metinleri alır.
8. Gemini canlı çağrısı başarısız olursa backend fallback verisiyle demo akışını sürdürür.

## Önemli Dosyalar

| Dosya | Açıklama |
| --- | --- |
| `app/page.tsx` | NoBrainer giriş sayfası |
| `app/shop/page.tsx` | Ürün vitrini |
| `app/shop/[id]/page.tsx` | Ürün detayı, persona içeriği, iade riski ve yorum özeti |
| `app/profile/page.tsx` | Kullanıcı persona ve profil ayarları |
| `app/cart/page.tsx` | Sepet, kupon ve demo sipariş akışı |
| `app/returns/page.tsx` | İade kodu ve risk nedeni akışı |
| `app/seller/page.tsx` | Satıcı paneli, finans özeti ve ürün optimizasyonu |
| `lib/api.ts` | Frontend FastAPI client fonksiyonları |
| `lib/personalization.ts` | Persona, kupon ve ürün eşleşme mantığı |
| `lib/userStore.ts` | Sepet, favori, profil ve iade state yönetimi |
| `backend/main.py` | FastAPI uygulaması ve router kayıtları |
| `backend/models.py` | Backend veri modelleri |
| `backend/services/scoring_service.py` | Skorlama ve risk motoru |
| `backend/services/gemini_service.py` | Gemini, fallback model zinciri ve JSON temizleme katmanı |
| `backend/data/products.json` | Demo ürün veri seti |

## Test ve Doğrulama

Frontend production build:

```powershell
npm.cmd run build
```

Backend Python dosyalarını derleme kontrolü:

```powershell
python -m compileall backend
```

Backend sağlık kontrolü:

```powershell
curl http://localhost:8000/health
```

Gemini bağlantı kontrolü:

```powershell
curl http://localhost:8000/gemini/test
```

## Bilinen Sınırlar

- Ürün verisi şu an canlı pazar yeri verisi değildir; demo amaçlı hazır veri setlerinden hazırlanmış JSON katalog kullanılmaktadır.
- Kişiselleştirme akışı gerçek kullanıcı geçmişi yerine demo profil sinyalleriyle çalışır.
- Satıcı finans metrikleri demo hesaplama mantığına dayanır.
- Gemini kota hatalarında sistem fallback yanıt üretir; bu beklenen bir dayanıklılık davranışıdır.
- Elektronik ve diğer kategoriler henüz aktif veri seti olarak eklenmemiştir; yol haritasındadır.

## Yol Haritası

- Elektronik kategorisi için kategoriye özel ürün şeması ve risk sinyalleri
- Gerçek sipariş, iade, ürün görüntüleme ve yorum verisi entegrasyonu
- ML tabanlı iade riski tahmini
- Kategori bağımsız recommendation/ranking modeli
- Satıcı panelinde gerçek maliyet, stok ve kampanya verileri
- Görsel kalite analizi için bilgisayarlı görü katmanı
- A/B test ve performans ölçüm dashboardları
- Daha gelişmiş kullanıcı segmentasyonu ve lifecycle analitiği
