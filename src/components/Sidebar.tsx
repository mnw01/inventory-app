import { useState } from 'react';
import { ClipboardList, ChevronRight } from 'lucide-react';

interface SidebarProps {
    onNavigate: (page: 'inventory' | 'records') => void;
    currentPage: 'inventory' | 'records';
}

export function Sidebar({ onNavigate, currentPage }: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

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
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full bg-white shadow-lg z-40 transition-all duration-300 ease-in-out ${isExpanded ? 'w-48' : 'w-14'
                    }`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => {
                    setIsExpanded(false);
                    setShowMenu(false);
                }}
            >
                {/* Logo/Brand area */}
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <div
                        className={`bg-indigo-600 p-2 rounded-lg text-white cursor-pointer transition-transform hover:scale-105 ${isExpanded ? '' : ''
                            }`}
                        onClick={() => {
                            onNavigate('inventory');
                            setShowMenu(false);
                        }}
                    >
                        <ClipboardList size={20} />
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="mt-4 px-2">
                    {menuItems.map((item) => (
                        <div key={item.id} className="relative">
                            <button
                                onClick={() => {
                                    setShowMenu(!showMenu);
                                    onNavigate(item.page);
                                }}
                                className={`w-full flex items-center gap-3 px-2 py-3 rounded-lg transition-all duration-200 group ${currentPage === item.page
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                                    }`}
                            >
                                <item.icon
                                    size={22}
                                    className={`flex-shrink-0 ${currentPage === item.page ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'
                                        }`}
                                />
                                <span
                                    className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                                        }`}
                                >
                                    {item.label}
                                </span>
                                {isExpanded && (
                                    <ChevronRight
                                        size={16}
                                        className={`ml-auto transition-transform duration-200 ${showMenu ? 'rotate-90' : ''
                                            }`}
                                    />
                                )}
                            </button>
                        </div>
                    ))}
                </nav>

                {/* Expand/Collapse indicator */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div
                        className={`p-1 rounded-full bg-gray-100 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                            }`}
                    >
                        <ChevronRight size={16} />
                    </div>
                </div>
            </aside>

            {/* Overlay when expanded on mobile */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 md:hidden"
                    onClick={() => {
                        setIsExpanded(false);
                        setShowMenu(false);
                    }}
                />
            )}
        </>
    );
}
