import React, { useEffect, useState } from 'react';
import { Product, CustomsStatus } from '../types';
import { X, Upload, Info } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => void;
  onUpdate?: (product: Product) => void;
  editingProduct?: Product | null;
  initialSku?: string;
}

// Internal form state allows strings for numbers to support intermediate editing states (e.g. "0.", "")
interface FormState {
  name: string;
  sku: string;
  imageUrl: string;
  stock: string | number;
  costPrice: string | number;
  customsStatus: CustomsStatus;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  editingProduct,
  initialSku = '',
}) => {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    sku: '',
    imageUrl: '',
    stock: 0,
    costPrice: 0,
    customsStatus: 'arrived',
  });

  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setImageError('');

    if (editingProduct) {
      const { id, ...rest } = editingProduct;
      setFormData(rest);
    } else {
      setFormData({
        name: '',
        sku: initialSku || '',
        imageUrl: '',
        stock: 0,
        costPrice: 0,
        customsStatus: 'arrived',
      });
    }
  }, [isOpen, editingProduct, initialSku]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data for submission (convert strings back to numbers)
    const submissionData = {
      ...formData,
      stock: Number(formData.stock),
      costPrice: Number(formData.costPrice),
    };

    if (editingProduct && onUpdate) {
      onUpdate({
        ...editingProduct,
        ...submissionData,
      });
    } else {
      onAdd(submissionData);
    }

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // allow setting raw value to state to fix "cannot delete 0" or "cannot type 0.5" issues
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 1MB to prevent Supabase payload issues (standard REST limits often block large Base64)
    if (file.size > 1024 * 1024) { // 1MB
      setImageError('图片过大，请选择 1MB 以下的图片');
      return;
    }
    setImageError('');

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
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU (商品编码) <span className="text-red-500">*</span></label>
            <input
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
              placeholder="例如: SHIRT-W-L"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品名称 <span className="text-red-500">*</span></label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
              placeholder="例如: 夏季T恤"
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">商品图片</label>

            <div className="flex gap-2 items-center">
              {/* 隐藏过长的 Base64 字符串输入框，防止用户困惑，改用只读显示状态 */}
              <input
                name="imageUrl"
                value={formData.imageUrl.startsWith('data:') ? '(已选择本地图片)' : formData.imageUrl}
                onChange={(e) => {
                  // Only allow editing if it's NOT a data URL (i.e. if user is typing a http link)
                  if (!formData.imageUrl.startsWith('data:')) {
                    handleChange(e);
                  } else {
                    // If user wants to clear Base64, they can clear this field
                    if (e.target.value === '') {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }
                  }
                }}
                disabled={formData.imageUrl.startsWith('data:')}
                placeholder="输入图片链接 或 上传本地图片"
                className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm ${formData.imageUrl.startsWith('data:') ? 'bg-gray-100 text-gray-500' : ''}`}
              />

              <label className="shrink-0 inline-flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-xs sm:text-sm transition-colors">
                <Upload size={16} className="mr-1" />
                <span>选择图片</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {imageError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <Info size={12} /> {imageError}
              </p>
            )}

            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded border border-gray-200 flex items-center justify-center overflow-hidden relative group">
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    title="移除图片"
                  >
                    <X size={20} />
                  </button>
                </>
              ) : (
                <div className="text-center p-2">
                  <Upload size={20} className="text-gray-300 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-400">无图片</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              提示：图片大小建议小于 1MB，否则可能导致保存失败。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">库存数量 (件)</label>
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
              className="w-full bg-indigo-600 text-white py-2.5 rounded-md hover:bg-indigo-700 active:bg-indigo-800 transition-colors font-medium text-sm shadow-sm"
            >
              {isEditMode ? '保存修改' : '确认添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
