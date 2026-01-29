import { useState } from 'react';
import { ClipboardList, X, Menu } from 'lucide-react';

interface SidebarProps {
    onNavigate: (page: 'inventory' | 'records') => void;
    currentPage: 'inventory' | 'records';
}

export function Sidebar({ onNavigate, currentPage }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        {
            id: 'records',
            icon: ClipboardList,
            label: '出入库记录',
            page: 'records' as const,
        },
    ];

    return (
        <>
            {/* Toggle Button - Fixed on right side */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed right-4 top-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 hover:scale-105 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                title="打开菜单"
            >
                <Menu size={24} />
            </button>

            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Panel */}
            <aside
                className={`fixed right-0 top-0 h-full w-72 bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-700">
                    <h2 className="text-lg font-semibold text-white">菜单</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="p-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.page);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${currentPage === item.page
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                                }`}
                        >
                            <div
                                className={`p-2 rounded-lg ${currentPage === item.page
                                        ? 'bg-indigo-100'
                                        : 'bg-gray-100 group-hover:bg-indigo-100'
                                    }`}
                            >
                                <item.icon
                                    size={20}
                                    className={
                                        currentPage === item.page ? 'text-indigo-600' : 'text-gray-500'
                                    }
                                />
                            </div>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Footer hint */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">
                        点击菜单项切换页面
                    </p>
                </div>
            </aside>
        </>
    );
}
