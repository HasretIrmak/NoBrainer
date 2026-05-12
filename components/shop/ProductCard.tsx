import Link from 'next/link';

export default function ProductCard({ product }: { product: any }) {
  return (
    <Link href={`/shop/${product.id}`} className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all border border-gray-100 block">
      <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform">
        {product.image}
      </div>
      <h3 className="font-bold text-gray-800">{product.name}</h3>
      <div className="flex justify-between items-center mt-2">
        <span className="text-blue-600 font-bold">{product.price}</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">İncele →</span>
      </div>
    </Link>
  );
}