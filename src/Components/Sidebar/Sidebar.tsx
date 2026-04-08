import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Menu as MenuIcon, Receipt,
    LogOut, ChevronRight, Plus, List, CreditCard, FileText, Building, MoreVertical
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    onOpenAddBilling?: () => void;
    onLogout?: () => void;
    selectedModuleId: string | null;
}

const Sidebar = ({ isOpen, toggleSidebar, onLogout, selectedModuleId }: SidebarProps) => {
    // Unified navigation items
    const allNavSections = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            items: [
                { label: 'Overview', icon: <LayoutDashboard size={20} />, path: '/' },
            ]
        },
        {
            id: 'business_setup',
            title: 'Business Setup',
            items: [
                // { label: 'Manage Login', icon: <Building size={20} />, path: '/manage-login' },
                { label: 'New User setup', icon: <Plus size={20} />, path: '/new-user-setup' },
            ]
        },
        {
            id: 'inventory',
            title: 'Products',
            items: [
                { label: 'Storage', icon: <Building size={20} />, path: '/storage' },
                { label: 'Add Product', icon: <Plus size={20} />, path: '/add-product' },
                { label: 'Product List', icon: <List size={20} />, path: '/products' },
                { label: 'Stock Entry', icon: <Plus size={20} />, path: '/stock-entry' },
                { label: 'Stock List', icon: <List size={20} />, path: '/stock-list' },
                { label: 'Add Supplier', icon: <Building size={20} />, path: '/add-supplier' },
            ]
        },
        {
            id: 'billing',
            title: 'Billing',
            items: [
                { label: 'Generate Bill', icon: <Receipt size={20} />, path: '/billing/create' },
                { label: 'Invoices', icon: <FileText size={20} />, path: '/invoice' },
                { label: 'Payment Settings', icon: <CreditCard size={20} />, path: '/billing/add-cc' },
            ]
        },
    ];

    // Filter sections: Always show Dashboard, plus the selected module
    const navSections = allNavSections.filter(section =>
        section.id === 'dashboard' || (selectedModuleId && section.id === selectedModuleId)
    );

    return (
        <aside
            className={`sidebar glass ${isOpen ? 'open' : 'collapsed'}`}
            onDoubleClick={toggleSidebar}
        >
            <div className="sidebar-logo">
                <div className="logo-main">
                    <Receipt className="text-primary" size={isOpen ? 32 : 28} />
                    {isOpen && <span>BillFlow</span>}
                </div>
                {isOpen && (
                    <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Collapse Sidebar">
                        <MoreVertical size={20} />
                    </button>
                )}
            </div>

            <div className="sidebar-scroll-content">
                {navSections.length > 0 ? (
                    navSections.map((section, sIdx) => (
                        <div key={sIdx} className="nav-section">
                            {isOpen && (
                                <div className="sidebar-header">
                                    <span className="section-label">{section.title}</span>
                                </div>
                            )}
                            <nav className="sidebar-nav">
                                {section.items.map((item: any, idx: number) => (
                                    <NavLink
                                        key={idx}
                                        to={item.path}
                                        className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}
                                        title={!isOpen ? item.label : ""}
                                    >
                                        <div className="nav-item-content">
                                            {item.icon}
                                            {isOpen && <span>{item.label}</span>}
                                        </div>
                                        {isOpen && item.subItems && <ChevronRight size={16} />}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    ))
                ) : (
                    <div className="empty-sidebar-state">
                        <div className="empty-icon">
                            <div className="empty-icon-wrapper">
                                <MenuIcon size={isOpen ? 40 : 24} />
                            </div>
                        </div>
                        {isOpen && <p>Select a module from the top navigation to view options</p>}
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <div className="nav-item" onClick={onLogout}>
                    <LogOut size={20} />
                    {isOpen && <span>Logout</span>}
                </div>
            </div>

            <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 1rem 0.75rem;
          z-index: 1100;
          overflow-x: hidden;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--bg-card);
          border-right: 1px solid var(--border);
        }

        .sidebar.collapsed {
            padding: 1rem 0.5rem;
            align-items: center;
        }

        @media (max-width: 1024px) {
            .sidebar {
                transform: translateX(-100%);
                width: 280px !important;
                transition: transform 0.3s ease;
            }
            .sidebar.open {
                transform: translateX(0);
                box-shadow: 20px 0 50px rgba(0,0,0,0.2);
            }
        }
        
        .sidebar-logo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding: 0 0.5rem;
            height: 40px;
            overflow: hidden;
        }

        .logo-main {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
            white-space: nowrap;
        }

        .sidebar-toggle-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s ease;
        }

        .sidebar-toggle-btn:hover {
            background: rgba(0, 0, 0, 0.05);
            color: var(--primary);
        }

        .sidebar-header {
            padding: 0 0.5rem 1rem;
            margin-bottom: 0.5rem;
            margin-top: 1rem;
        }

        .section-label {
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            opacity: 0.7;
            white-space: nowrap;
        }

        .sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            width: 100%;
        }

        .nav-item {
            display: flex;
            align-items: center;
            justify-content: ${isOpen ? 'space-between' : 'center'};
            padding: 0.75rem 0.85rem;
            border-radius: 10px;
            color: var(--text-muted);
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
            white-space: nowrap;
            overflow: hidden;
        }

        .nav-item-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .nav-item:hover {
            background: rgba(99, 102, 241, 0.08);
            color: var(--primary);
        }

        .nav-item.active {
            background: var(--primary);
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .sidebar-footer {
            margin-top: auto;
            border-top: 1px solid var(--border);
            padding-top: 1rem;
            width: 100%;
        }

        .sidebar-scroll-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .sidebar-scroll-content::-webkit-scrollbar {
            width: 4px;
        }

        .sidebar-scroll-content::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
        }

        .empty-sidebar-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 1rem;
            text-align: center;
            color: var(--text-muted);
            opacity: 0.6;
        }

        .empty-icon {
            margin-bottom: 1rem;
            color: var(--primary);
            opacity: 0.4;
        }

        .empty-sidebar-state p {
            font-size: 0.8rem;
            line-height: 1.4;
        }
      `}</style>
        </aside>
    );
};

export default Sidebar;
