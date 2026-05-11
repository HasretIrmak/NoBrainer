"use client";
import Link from 'next/link';

// Şimdilik sahte ürün listesi (Yarın Hasret'in /products API'sine bağlanacak)
const products = [
  { id: '1', name: 'Nike Air Max 270', price: '4.299 TL', image: '👟' },
  { id: '2', name: 'Adidas Ultraboost', price: '5.100 TL', image: '👟' },
  { id: '3', name: 'New Balance 530', price: '3.850 TL', image: '👟' },
  { id: '4', name: 'Puma RS-X', price: '3.150 TL', image: '👟' },
];

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Tüm Ürünler</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/shop/${product.id}`}
              className="group border rounded-2xl p-4 hover:shadow-xl transition-all cursor-pointer border-gray-100"
            >
              <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform">
                {product.image}
              </div>
              <h3 className="font-bold text-gray-800">{product.name}</h3>
              <p className="text-blue-600 font-semibold">{product.price}</p>
              <button className="w-full mt-4 bg-gray-900 text-white py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                İncele
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}