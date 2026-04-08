import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import AddBilling from '../../Pages/Billing/Add_Billing/AddBilling/Addbilling';

const Layout = ({ children, onLogout }: { children: React.ReactNode, onLogout?: () => void }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.openAddBilling) {
            setShowBillingModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const isSelectionPage = location.pathname === '/';

    return (
        <div className="layout">
            {!isSelectionPage && (
                <Sidebar
                    isOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    onOpenAddBilling={() => setShowBillingModal(true)}
                    onLogout={onLogout}
                    selectedModuleId={selectedModule}
                />
            )}

            <div className="content-wrapper" style={{
                marginLeft: isSelectionPage ? '0' : 'var(--sidebar-width)',
                width: isSelectionPage ? '100%' : 'calc(100% - var(--sidebar-width))'
            }}>
                <Navbar
                    toggleSidebar={toggleSidebar}
                    isSidebarOpen={sidebarOpen}
                    onLogout={onLogout}
                    onModuleSelect={(id) => setSelectedModule(id)}
                />

                <main className="main-content">
                    {children}
                </main>
            </div>

            {showBillingModal && (
                <AddBilling onClose={() => setShowBillingModal(false)} />
            )}

            <style>{`
                :root {
                    --navbar-height: 60px;
                    --sidebar-width-open: 240px;
                    --sidebar-width-closed: 70px;
                }

                .layout {
                    min-height: 100vh;
                    background: var(--bg-dark);
                    display: flex;
                    flex-direction: column;
                    --sidebar-width: ${sidebarOpen ? 'var(--sidebar-width-open)' : 'var(--sidebar-width-closed)'};
                    overflow-x: hidden;
                }
                
                .content-wrapper {
                    transition: all 0.3s ease;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    box-sizing: border-box;
                }

                .main-content {
                    padding: 2rem;
                    width: 100%;
                    flex: 1;
                    box-sizing: border-box;
                    overflow-x: hidden;
                }

                @media (max-width: 1024px) {
                    .layout {
                        --sidebar-width: 0px;
                    }
                    .content-wrapper {
                        margin-left: 0 !important;
                        width: 100% !important;
                    }
                    .main-content {
                        padding: 1.5rem;
                    }
                }

                @media (max-width: 768px) {
                    .main-content {
                        padding: 1rem;
                    }
                }

                @media (max-width: 480px) {
                    .main-content {
                        padding: 0.75rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Layout;
