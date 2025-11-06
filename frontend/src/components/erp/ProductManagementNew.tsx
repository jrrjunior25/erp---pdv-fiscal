import React from 'react';
import EntityManager from '@components/shared/EntityManager';
import productService from '@services/modules/productService';
import type { Product } from '@types';

const ProductManagementNew: React.FC = () => {
  const fields = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'code', label: 'Código', type: 'text', required: true },
    { name: 'price', label: 'Preço', type: 'number', required: true },
    { name: 'category', label: 'Categoria', type: 'text', required: true },
  ];

  const getStats = (products: Product[]) => [
    { label: 'Total Produtos', value: products.length, color: 'from-blue-500 to-blue-600' },
    { label: 'Categorias', value: new Set(products.map(p => p.category)).size, color: 'from-green-500 to-green-600' },
    { label: 'Valor Médio', value: `R$ ${(products.reduce((sum, p) => sum + p.price, 0) / products.length || 0).toFixed(2)}`, color: 'from-purple-500 to-purple-600' },
    { label: 'Ativos', value: products.filter(p => (p as any).active !== false).length, color: 'from-orange-500 to-orange-600' },
  ];

  const renderRow = (product: Product) => (
    <tr key={product.id} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900">{product.name}</div>
        <div className="text-sm text-gray-500">{product.category}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">{product.code}</td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </td>
      <td className="px-6 py-4 text-center">
        <button className="text-blue-600 hover:text-blue-800 mr-4">Editar</button>
        <button className="text-red-600 hover:text-red-800">Excluir</button>
      </td>
    </tr>
  );

  return (
    <EntityManager
      title="Produtos"
      service={productService}
      storeKey="products"
      fields={fields}
      renderRow={renderRow}
      getStats={getStats}
    />
  );
};

export default ProductManagementNew;