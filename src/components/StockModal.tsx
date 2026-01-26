import React, { useState } from 'react';
import { Product, TransactionType } from '../types';
import { X } from 'lucide-react';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (type: TransactionType, quantity: number) => void;
}

export const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, product, onConfirm }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [type, setType] = useState<TransactionType>('in');

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(type, quantity);
    onClose();
    setQuantity(1); // Reset
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">库存管理</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <p className="text-sm text-gray-500">商品名称</p>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500 mt-1">当前库存: <span className="font-bold text-black">{product.stock}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`py-2 px-4 rounded-md font-medium text-center transition-colors ${
                type === 'in' 
                  ? 'bg-green-100 text-green-700 border-2 border-green-500' 
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
              onClick={() => setType('in')}
            >
              入库 (Stock In)
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md font-medium text-center transition-colors ${
                type === 'out' 
                  ? 'bg-red-100 text-red-700 border-2 border-red-500' 
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
              onClick={() => setType('out')}
            >
              出库 (Stock Out)
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              数量
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              确认{type === 'in' ? '入库' : '出库'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
