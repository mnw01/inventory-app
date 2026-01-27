import React, { useEffect, useState } from 'react';
import { Product, CustomsStatus } from '../types';
import { X, Upload } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => void;
  onUpdate?: (product: Product) => void;
  editingProduct?: Product | null;
}

type ProductFormData = Omit<Product, 'id'>;

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  editingProduct,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    imageUrl: '',
    stock: 0,
    costPrice: 0,
    customsStatus: 'arrived' as CustomsStatus,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      const { id, ...rest } = editingProduct;
      setFormData(rest);
    } else {
      setFormData({
        name: '',
        sku: '',
        imageUrl: '',
        stock: 0,
        costPrice: 0,
        customsStatus: 'arrived',
      });
    }
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct && onUpdate) {
      onUpdate({
        ...editingProduct,
        ...formData,
      });
    } else {
      onAdd(formData);
    }

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'stock' || name === 'costPrice'
          ? value === ''
            ? 0
            : parseFloat(value)
          : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setFormData(prev => ({
          ...prev,
          imageUrl: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const isEditMode = !!editingProduct;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-y-auto max-h-[95vh] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {isEditMode ? '编辑商品资料' : '添加新商品'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU (商品编码)</label>
            <input
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">商品图片</label>
            <div className="flex gap-2 items-center">
              <input
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="图片链接（可选）"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
              />
              <label className="shrink-0 inline-flex items-center justify-center px-2 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 bg-gray-50 text-xs sm:text-sm">
                <Upload size={14} className="mr-1" />
                本地
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                支持网络图片或本地上传，推荐小尺寸图片以提升手机加载速度
              </span>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded border flex items-center justify-center overflow-hidden mt-1">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload size={18} className="text-gray-300" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">库存数量</label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成本价 (CNY)</label>
              <input
                type="number"
                name="costPrice"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">清关状态</label>
            <select
              name="customsStatus"
              value={formData.customsStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
            >
              <option value="cleared">已报关 (Cleared)</option>
              <option value="clearing">清关中 (Clearing)</option>
              <option value="arrived">已到达仓库 (Arrived)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-md hover:bg-indigo-700 active:bg-indigo-800 transition-colors font-medium text-sm"
            >
              {isEditMode ? '保存修改' : '添加商品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
