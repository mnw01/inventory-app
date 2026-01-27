import React from 'react';
import { Product } from '../types';
import { Package, Truck, Edit } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  exchangeRate: number;
  onStockAction: (product: Product) => void;
  onEdit: (product: Product) => void;
}

const getCustomsStatusLabel = (status: Product['customsStatus']) => {
  switch (status) {
    case 'cleared': return { text: '已报关', color: 'bg-green-100 text-green-800' };
    case 'clearing': return { text: '清关中', color: 'bg-yellow-100 text-yellow-800' };
    case 'arrived': return { text: '已到达仓库', color: 'bg-blue-100 text-blue-800' };
    default: return { text: '未知', color: 'bg-gray-100 text-gray-800' }; // Fallback
  }
};

export const ProductList: React.FC<ProductListProps> = ({ products, exchangeRate, onStockAction, onEdit }) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <Package size={48} className="mb-4 opacity-50" />
        <p>暂无商品，请添加新商品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {products.map((product) => {
        const status = getCustomsStatusLabel(product.customsStatus || 'arrived'); // Default for old data
        
        return (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
            <div className="h-48 w-full relative bg-gray-100">
               <img 
                 src={product.imageUrl || 'https://via.placeholder.com/300'} 
                 alt={product.name}
                 className="w-full h-full object-cover"
                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=No+Image'; }}
               />
               <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-mono">
                 SKU: {product.sku}
               </div>
               <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${status.color}`}>
                  <Truck size={12} />
                  {status.text}
               </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="text-lg font-bold text-gray-800 line-clamp-2 flex-1" title={product.name}>{product.name}</h3>
                <button 
                  onClick={() => onEdit(product)}
                  className="text-gray-400 hover:text-indigo-600 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                  title="编辑商品"
                >
                  <Edit size={18} />
                </button>
              </div>
              
              <div className="mt-auto space-y-3">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">当前库存</span>
                  <span className={`font-bold text-lg ${product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                    {product.stock}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">成本 (CNY)</span>
                    <span className="font-medium">¥{product.costPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-blue-600">
                    <span className="font-medium">预估售价 (IDR)</span>
                    <span className="font-bold">
                      Rp {(product.costPrice * exchangeRate).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => onStockAction(product)}
                  className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Package size={16} />
                  出入库操作
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
