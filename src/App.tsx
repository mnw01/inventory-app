import React, { useState, useEffect } from 'react';
import { ProductList } from './components/ProductList';
import { StockModal } from './components/StockModal';
import { AddProductModal } from './components/AddProductModal';
import { Scanner } from './components/Scanner';
import { Product, TransactionType } from './types';
import { Search, Plus, DollarSign, Warehouse, ScanBarcode } from 'lucide-react';

// Mock initial data
const initialProducts: Product[] = [
  {
    id: '1',
    sku: 'SKU001',
    name: '夏季纯棉T恤 白色 L码',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    stock: 120,
    costPrice: 25.00,
    customsStatus: 'cleared'
  },
  {
    id: '2',
    sku: 'SKU002',
    name: '牛仔短裤 蓝色 M码',
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    stock: 45,
    costPrice: 45.50,
    customsStatus: 'clearing'
  },
  {
    id: '3',
    sku: 'SKU003',
    name: '运动跑鞋 黑色 42码',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    stock: 8,
    costPrice: 120.00,
    customsStatus: 'arrived'
  }
];

function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('wms_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(2200); // 1 CNY = 2200 IDR (Approx)
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('wms_products', JSON.stringify(products));
  }, [products]);

  // Filter products
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockAction = (product: Product) => {
    setSelectedProduct(product);
    setIsStockModalOpen(true);
  };

  const handleStockConfirm = (type: TransactionType, quantity: number) => {
    if (!selectedProduct) return;

    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === selectedProduct.id) {
        const newStock = type === 'in' ? p.stock + quantity : p.stock - quantity;
        return { ...p, stock: Math.max(0, newStock) };
      }
      return p;
    }));
  };

  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: Date.now().toString(),
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    setSearchQuery(decodedText);
    
    // Attempt to find exact match
    const match = products.find(p => p.sku === decodedText);
    if (match) {
      handleStockAction(match);
    } else {
      // If not found, user might want to add it. 
      // For now just filtering by SKU is enough feedback.
      // Could also prompt to add:
      if (confirm(`未找到商品 SKU: ${decodedText}。是否立即添加新商品？`)) {
         setIsAddModalOpen(true);
         // You might want to pass the SKU to the modal, but currently modal state is local.
         // A simple improvement would be to allow pre-filling the modal.
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Warehouse size={24} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">仓库管理系统</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
               <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="搜索 SKU 或名称..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600"
                  title="扫码识别"
                >
                  <ScanBarcode size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-full sm:w-auto">
                <DollarSign size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">汇率 (CNY:IDR)</span>
                <input 
                  type="number" 
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className="w-20 bg-transparent border-b border-blue-300 focus:outline-none text-blue-700 font-bold text-right"
                />
              </div>

              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={20} />
                <span className="font-medium">新增商品</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-lg font-semibold text-gray-700">商品列表 ({filteredProducts.length})</h2>
          <span className="text-sm text-gray-500">当前汇率: 1 CNY = {exchangeRate} IDR</span>
        </div>

        <ProductList 
          products={filteredProducts} 
          exchangeRate={exchangeRate}
          onStockAction={handleStockAction}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Warehouse Management System.
        </div>
      </footer>

      {/* Modals */}
      <StockModal 
        isOpen={isStockModalOpen} 
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProduct}
        onConfirm={handleStockConfirm}
      />

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProduct}
      />

      {isScannerOpen && (
        <Scanner 
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
