"use client";
import ProductCard from "../../components/shop/ProductCard";

const PRODUCTS = [
  { id: '1', name: 'Nike Air Max 270', price: '4.299 TL', image: '👟' },
  { id: '2', name: 'Adidas Ultraboost', price: '5.100 TL', image: '🏃‍♂️' },
  { id: '3', name: 'New Balance 530', price: '3.850 TL', image: '🩶' },
  { id: '4', name: 'Puma RS-X', price: '3.150 TL', image: '🟣' },
];

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Başlık Bölümü */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter mb-4">
            Sneaker Store
          </h1>
          <p className="text-gray-500 font-medium tracking-wide">
            Yapay Zeka Destekli Kişiselleştirilmiş Alışveriş Deneyimi
          </p>
        </div>

        {/* Ürün Listesi Grid Yapısı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}