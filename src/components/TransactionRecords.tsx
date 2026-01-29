import { useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Search, Calendar, Filter, Package } from 'lucide-react';
import { TransactionRecord, Product } from '../types';

interface TransactionRecordsProps {
    records: TransactionRecord[];
    products: Product[];
}

export function TransactionRecords({ records, products }: TransactionRecordsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: '',
    });

    // Get product info by ID
    const getProduct = (productId: string) => {
        return products.find((p) => p.id === productId);
    };

    // Filter and sort records
    const filteredRecords = useMemo(() => {
        return records
            .filter((record) => {
                const product = getProduct(record.productId);
                const matchesSearch =
                    !searchQuery ||
                    product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product?.sku.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesType = typeFilter === 'all' || record.type === typeFilter;

                const recordDate = new Date(record.date);
                const matchesStartDate = !dateRange.start || recordDate >= new Date(dateRange.start);
                const matchesEndDate = !dateRange.end || recordDate <= new Date(dateRange.end + 'T23:59:59');

                return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records, searchQuery, typeFilter, dateRange, products]);

    // Calculate statistics
    const stats = useMemo(() => {
        const inCount = filteredRecords.filter((r) => r.type === 'in').reduce((sum, r) => sum + r.quantity, 0);
        const outCount = filteredRecords.filter((r) => r.type === 'out').reduce((sum, r) => sum + r.quantity, 0);
        return { inCount, outCount, total: filteredRecords.length };
    }, [filteredRecords]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <Package size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">出入库记录</h1>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Filter size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">筛选结果</p>
                            <p className="text-xl font-bold text-gray-900">{stats.total} 条</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <ArrowDownCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">入库总量</p>
                            <p className="text-xl font-bold text-green-600">+{stats.inCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border border-red-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-50 p-2 rounded-lg">
                            <ArrowUpCircle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">出库总量</p>
                            <p className="text-xl font-bold text-red-600">-{stats.outCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="搜索商品名称或 SKU..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${typeFilter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            全部
                        </button>
                        <button
                            onClick={() => setTypeFilter('in')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${typeFilter === 'in'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <ArrowDownCircle size={16} />
                            入库
                        </button>
                        <button
                            onClick={() => setTypeFilter('out')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${typeFilter === 'out'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <ArrowUpCircle size={16} />
                            出库
                        </button>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={dateRange.start}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-gray-400">至</span>
                        <input
                            type="date"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={dateRange.end}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Records List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredRecords.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">暂无出入库记录</p>
                        {records.length > 0 && (
                            <p className="text-sm text-gray-400 mt-2">尝试调整筛选条件</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        时间
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        类型
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        商品
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        数量
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecords.map((record) => {
                                    const product = getProduct(record.productId);
                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(record.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {record.type === 'in' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <ArrowDownCircle size={14} />
                                                        入库
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        <ArrowUpCircle size={14} />
                                                        出库
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product?.imageUrl && (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                        {product?.name || '未知商品'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {product?.sku || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span
                                                    className={`text-lg font-bold ${record.type === 'in' ? 'text-green-600' : 'text-red-600'
                                                        }`}
                                                >
                                                    {record.type === 'in' ? '+' : '-'}{record.quantity}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
