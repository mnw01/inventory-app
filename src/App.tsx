import { useState, useEffect } from 'react';
import { ProductList } from './components/ProductList';
import { StockModal } from './components/StockModal';
import { AddProductModal } from './components/AddProductModal';
import { Scanner } from './components/Scanner';
import { Sidebar } from './components/Sidebar';
import { TransactionRecords } from './components/TransactionRecords';
import { Product, TransactionType, TransactionRecord } from './types';
import { Search, Plus, DollarSign, Warehouse, ScanBarcode, RefreshCw, Check, X, Cloud } from 'lucide-react';
import { supabase } from './lib/supabase';

// Mock initial data (fallback)
const initialProducts: Product[] = [];

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('wms_exchange_rate');
    return saved ? parseFloat(saved) : 2200;
  });
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string>('');
  const [lastRateUpdate, setLastRateUpdate] = useState<Date | null>(() => {
    const saved = localStorage.getItem('wms_rate_update_time');
    return saved ? new Date(saved) : null;
  });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success'>('idle');
  const [currentPage, setCurrentPage] = useState<'inventory' | 'records'>('inventory');
  const [scannedSku, setScannedSku] = useState('');

  // 出入库记录
  const [transactionRecords, setTransactionRecords] = useState<TransactionRecord[]>([]);

  // --- Supabase Data Fetching & Realtime ---

  const mapProductFromDB = (data: any): Product => ({
    id: data.id,
    sku: data.sku,
    name: data.name,
    imageUrl: data.image_url || '',
    stock: data.stock,
    costPrice: data.cost_price,
    customsStatus: data.customs_status || 'arrived',
  });

  const mapTransactionFromDB = (data: any): TransactionRecord => ({
    id: data.id,
    productId: data.product_id,
    type: data.type as TransactionType,
    quantity: data.quantity,
    date: data.timestamp,
    note: '', // DB schema simple for now
  });

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch Transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (transactionsError) throw transactionsError;

      const loadedProducts = (productsData || []).map(mapProductFromDB);
      setProducts(loadedProducts);
      setTransactionRecords((transactionsData || []).map(mapTransactionFromDB));

      // ** Data Migration Logic **
      // If DB is empty but LocalStorage has data, migrate it automatically.
      if (loadedProducts.length === 0) {
        const localProducts = localStorage.getItem('wms_products');
        if (localProducts) {
          try {
            const parsedLocal: Product[] = JSON.parse(localProducts);
            if (parsedLocal.length > 0) {
              console.log('Migrating local data to Supabase...');
              const productsToInsert = parsedLocal.map(p => ({
                id: p.id, // Keep existing ID
                sku: p.sku,
                name: p.name,
                image_url: p.imageUrl,
                stock: p.stock,
                cost_price: p.costPrice,
                customs_status: p.customsStatus
              }));

              const { error: migrateError } = await supabase.from('products').insert(productsToInsert);
              if (!migrateError) {
                console.log('Migration successful');
                // Auto reload to fetch fresh data
                fetchData();
              } else {
                console.error('Migration failed:', migrateError);
              }
            }
          } catch (e) {
            console.error('Migration parse error', e);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to Realtime changes
    const productSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Realtime product update:', payload);
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [mapProductFromDB(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? mapProductFromDB(payload.new) : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    const transactionSubscription = supabase
      .channel('public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        console.log('Realtime transaction update:', payload);
        if (payload.eventType === 'INSERT') {
          setTransactionRecords(prev => [mapTransactionFromDB(payload.new), ...prev]);
        }
        // Usually we don't update/delete transactions, but if needed, add logic here
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productSubscription);
      supabase.removeChannel(transactionSubscription);
    };
  }, []);

  // 获取实时汇率 (Unchanged)
  const fetchExchangeRate = async () => {
    setIsLoadingRate(true);
    setRateError('');
    let hasError = false;

    try {
      let response = await fetch('https://api.exchangerate-api.com/v4/latest/CNY');
      let data;

      if (!response.ok) {
        response = await fetch('https://api.exchangerate.host/latest?base=CNY&symbols=IDR');
        if (!response.ok) throw new Error('获取汇率失败');
        data = await response.json();
        if (data.success && data.rates && data.rates.IDR) {
          const rate = Math.round(data.rates.IDR);
          setExchangeRate(rate);
          setLastRateUpdate(new Date());
          localStorage.setItem('wms_exchange_rate', rate.toString());
          localStorage.setItem('wms_rate_update_time', new Date().toISOString());
          return;
        } else {
          throw new Error('汇率数据格式错误');
        }
      }

      data = await response.json();
      if (data.rates && data.rates.IDR) {
        const rate = Math.round(data.rates.IDR);
        setExchangeRate(rate);
        setLastRateUpdate(new Date());
        localStorage.setItem('wms_exchange_rate', rate.toString());
        localStorage.setItem('wms_rate_update_time', new Date().toISOString());
      } else {
        throw new Error('汇率数据格式错误');
      }
    } catch (err: any) {
      console.error('获取汇率失败:', err);
      setRateError('获取实时汇率失败，使用本地保存的汇率');
      hasError = true;
    } finally {
      setIsLoadingRate(false);
      if (!hasError) {
        setUpdateStatus('success');
        setTimeout(() => setUpdateStatus('idle'), 2000);
      }
    }
  };

  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(() => {
      fetchExchangeRate();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockAction = (product: Product) => {
    setSelectedProduct(product);
    setIsStockModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleStockConfirm = async (type: TransactionType, quantity: number) => {
    if (!selectedProduct) return;

    const newStock = type === 'in' ? selectedProduct.stock + quantity : selectedProduct.stock - quantity;
    const finalStock = Math.max(0, newStock);

    // Update Product in DB
    const { error: productError } = await supabase
      .from('products')
      .update({ stock: finalStock })
      .eq('id', selectedProduct.id);

    if (productError) {
      console.error('Failed to update stock:', productError);
      alert('库存更新失败，请重试');
      return;
    }

    // Create Transaction Record in DB
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        product_id: selectedProduct.id,
        type,
        quantity,
        timestamp: new Date().toISOString(),
        price: selectedProduct.costPrice // Snapshot price
      });

    if (txError) {
      console.error('Failed to record transaction:', txError);
    }
  };

  const handleAddProduct = async (newProductData: Omit<Product, 'id'>) => {
    // Insert into DB
    const { error } = await supabase
      .from('products')
      .insert({
        sku: newProductData.sku,
        name: newProductData.name,
        image_url: newProductData.imageUrl,
        stock: newProductData.stock,
        cost_price: newProductData.costPrice,
        customs_status: newProductData.customsStatus
      });

    if (error) {
      console.error('Failed to add product:', error);
      alert(`添加失败: ${error.message}`);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    // Update DB
    const { error } = await supabase
      .from('products')
      .update({
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        image_url: updatedProduct.imageUrl,
        stock: updatedProduct.stock,
        cost_price: updatedProduct.costPrice,
        customs_status: updatedProduct.customsStatus
      })
      .eq('id', updatedProduct.id);

    if (error) {
      console.error('Failed to update product:', error);
      alert(`更新失败: ${error.message}`);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    setSearchQuery(decodedText);

    // Attempt to find exact match
    const match = products.find(p => p.sku === decodedText);
    if (match) {
      handleStockAction(match);
    } else {
      if (confirm(`未找到商品 SKU: ${decodedText}。是否立即添加新商品？`)) {
        setScannedSku(decodedText);
        setEditingProduct(null);
        setIsAddModalOpen(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - slides in from right */}
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />

      {/* Main Container */}
      <div className="flex flex-col min-h-screen">
        {/* Header / Navbar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                  <Warehouse size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">仓库管理系统 (云同步版)</h1>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="搜索 SKU 或名称..."
                    className="pl-10 pr-16 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="清除搜索"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setIsScannerOpen(true)}
                      className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
                      title="扫码识别"
                    >
                      <ScanBarcode size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-full sm:w-auto">
                  <DollarSign size={18} className="text-blue-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">汇率 (CNY:IDR)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => {
                        const newRate = Number(e.target.value);
                        setExchangeRate(newRate);
                        localStorage.setItem('wms_exchange_rate', newRate.toString());
                      }}
                      className="w-16 sm:w-20 bg-transparent focus:outline-none text-blue-700 font-bold text-center text-xs sm:text-sm"
                      title="可手动修改汇率"
                    />
                    <button
                      onClick={fetchExchangeRate}
                      disabled={isLoadingRate || updateStatus === 'success'}
                      className={`p-1 rounded transition-colors disabled:opacity-50 ${updateStatus === 'success'
                        ? 'text-green-600 bg-green-50'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100'
                        }`}
                      title={updateStatus === 'success' ? "更新成功" : "刷新实时汇率"}
                    >
                      {updateStatus === 'success' ? (
                        <Check size={14} className="animate-in zoom-in duration-300" />
                      ) : (
                        <RefreshCw size={14} className={isLoadingRate ? 'animate-spin' : ''} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddModalOpen(true);
                  }}
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
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Cloud className="w-12 h-12 mb-4 animate-pulse text-indigo-400" />
              <p>正在同步云端数据...</p>
            </div>
          ) : (
            currentPage === 'inventory' ? (
              <>
                <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                  <h2 className="text-lg font-semibold text-gray-700">商品列表 ({filteredProducts.length})</h2>
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-sm text-gray-500">
                      当前汇率: 1 CNY = <span className="font-semibold text-blue-600">{exchangeRate.toLocaleString('id-ID')}</span> IDR
                    </span>
                    {lastRateUpdate && (
                      <span className="text-xs text-gray-400">
                        更新时间: {new Date(lastRateUpdate).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <ProductList
                  products={filteredProducts}
                  exchangeRate={exchangeRate}
                  onStockAction={handleStockAction}
                  onEdit={handleEditProduct}
                />
              </>
            ) : (
              <TransactionRecords records={transactionRecords} products={products} />
            )
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Warehouse Management System (Supabase Enabled).
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
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
            setScannedSku('');
          }}
          onAdd={handleAddProduct}
          onUpdate={handleUpdateProduct}
          editingProduct={editingProduct}
          initialSku={scannedSku}
        />

        {isScannerOpen && (
          <Scanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setIsScannerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
