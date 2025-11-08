import React from 'react';
import type { Product } from '@types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
  <div
    className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all hover:shadow-md p-3 flex items-center gap-3"
    onClick={() => onAddToCart(product)}
  >
    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
      {product.name.charAt(0).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
      <p className="text-lg font-bold text-blue-600 mt-1">
        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
    </div>
  </div>
);

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  return (
    <div className="space-y-2">
      {products.map(product => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
};

export default ProductGrid;
