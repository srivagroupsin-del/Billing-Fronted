import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    // User, Building, MapPin, Store,
    Settings, LogOut, ChevronRight,
    Search, Check, Loader2,
    Mail, Shield, Briefcase, UserPlus, Users
} from 'lucide-react';
import { getSetupSummary } from '../../../api/business';
import { selectBusiness } from '../../../api/auth';
import './BusinessAdmin.css';

const BusinessAdmin = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<any>(null);
    const [activeBusinessName, setActiveBusinessName] = useState(localStorage.getItem('business_name') || 'Not Selected');
    const [activeBusinessId, setActiveBusinessId] = useState(localStorage.getItem('business_id') || '');

    // Modal states
    const [activeModal, setActiveModal] = useState<{ type: number; title: string } | null>(null);
    const [modalOptions] = useState<any[]>([]);
    const [isFetchingModal] = useState(false);
    const [modalSearch, setModalSearch] = useState("");
    const [isSwitchingBusiness, setIsSwitchingBusiness] = useState(false);
    const [setupSummary, setSetupSummary] = useState<any>(null);

    useEffect(() => {
        // Load user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUserData(JSON.parse(storedUser));
            } catch (e) {
                setUserData({ email: 'admin@billing.com', name: 'Administrator' });
            }
        } else {
            setUserData({ email: 'admin@billing.com', name: 'Administrator' });
        }

        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await getSetupSummary();
            if (res?.success && res.data) {
                setSetupSummary(res.data);
            }
        } catch (err) {
            console.warn("Failed to fetch setup summary", err);
        }
    };

    const handleBusinessSelect = async (business: any) => {
        const busId = String(business.id || business.business_id);
        const busName = business.business_name || business.name || 'Unnamed';

        if (busId === activeBusinessId) {
            setActiveModal(null);
            return;
        }

        setIsSwitchingBusiness(true);
        try {
            const response = await selectBusiness({ business_id: busId });
            const businessToken = response.token || response?.data?.token;
            if (businessToken) localStorage.setItem('token', businessToken);
            localStorage.setItem('business_id', busId);
            localStorage.setItem('business_name', busName);

            setActiveBusinessId(busId);
            setActiveBusinessName(busName);
            setActiveModal(null);
            window.location.reload();
        } catch (error: any) {
            console.error('Business switch failed:', error);
            alert('Failed to switch business');
        } finally {
            setIsSwitchingBusiness(false);
        }
    };

    const adminActions = [
        // {
        //     id: 'profile',
        //     label: 'Profile',
        //     description: 'Manage your personal account settings',
        //     icon: <User size={24} className="icon-blue" />,
        //     onClick: () => { } // navigate to settings if implemented
        // },
        // {
        //     id: 'business_setup',
        //     label: 'Business Setup',
        //     description: 'Configure core business rules and data',
        //     icon: <Settings size={24} className="icon-purple" />,
        //     onClick: () => navigate('/business-setup')
        // },
        // {
        //     id: 'switch_business',
        //     label: 'Switch Business',
        //     description: 'Change the currently active business',
        //     icon: <MapPin size={24} className="icon-orange" />,
        //     onClick: () => navigate('/business-select')
        // },
        // {
        //     id: 'store',
        //     label: 'Store',
        //     description: 'Manage store types and online presence',
        //     icon: <Store size={24} className="icon-green" />,
        //     onClick: () => handleLevelChange(6, "Select Shop Type")
        // },
        // {
        //     id: 'company',
        //     label: 'Company',
        //     description: 'Update company details and legal info',
        //     icon: <Building size={24} className="icon-indigo" />,
        //     onClick: () => handleLevelChange(1, "Select Business")
        // },
        // {
        //     id: 'branch',
        //     label: 'Branch',
        //     description: 'Configure physical branch locations',
        //     icon: <MapPin size={24} className="icon-rose" />,
        //     onClick: () => handleLevelChange(5, "Select Storage / Branch")
        // },
        {
            id: 'create_employee',
            label: 'Create Employee',
            description: 'Add new staff members to your team',
            icon: <UserPlus size={24} className="icon-cyan" />,
            onClick: () => navigate('/create-employee')
        },
        {
            id: 'manage_employee',
            label: 'Manage Employee',
            description: 'Edit permissions and staff details',
            icon: <Users size={24} className="icon-violet" />,
            onClick: () => navigate('/manage-employee')
        },
        {
            id: 'manage',
            label: 'Manage',
            description: 'Control overall application settings',
            icon: <Settings size={24} className="icon-amber" />,
            onClick: () => navigate('/manage')
        }
    ];

    return (
        <div className="bus-admin-container">
            <div className="bus-admin-header">
                <div className="admin-profile-section">
                    <div className="admin-avatar">
                        {userData?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="admin-info">
                        <h1>{userData?.name || 'Administrator'}</h1>
                        <p className="admin-email"><Mail size={14} /> {userData?.email || 'admin@billing.com'}</p>
                        <div className="admin-badges">
                            <span className="badge role-badge"><Shield size={12} /> Administrator</span>
                            <span className="badge bus-badge"><Briefcase size={12} /> {activeBusinessName}</span>
                        </div>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="logout-action-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            <div className="bus-admin-content">
                <div className="admin-grid">
                    {adminActions.map((action) => (
                        <div key={action.id} className="admin-card" onClick={action.onClick}>
                            <div className="card-icon-wrapper">
                                {action.icon}
                            </div>
                            <div className="card-details">
                                <h3>{action.label}</h3>
                                <p>{action.description}</p>
                            </div>
                            <ChevronRight size={20} className="card-arrow" />
                        </div>
                    ))}
                </div>

                {setupSummary && (
                    <div className="admin-stats-panel">
                        <h2>Current Configuration Summary</h2>
                        <div className="stats-list">
                            <div className="stat-item">
                                <span className="stat-label">Active Groups</span>
                                <span className="stat-value">{setupSummary.category_groups?.length || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Total Categories</span>
                                <span className="stat-value">{setupSummary.categories?.length || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Shop Types</span>
                                <span className="stat-value">{setupSummary.shop_types?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {activeModal && (
                <div className="popup-overlay" onClick={() => { if (!isSwitchingBusiness) setActiveModal(null); }}>
                    <div className="popup-container list-view" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-content">
                            <div className="popup-header">
                                <h3 className="popup-label">{activeModal.title}</h3>
                                <button className="close-pop-btn" onClick={() => { if (!isSwitchingBusiness) setActiveModal(null); }}>&times;</button>
                            </div>

                            <div className="popup-search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                />
                            </div>

                            <div className="popup-list-container scrollbar-custom">
                                {isFetchingModal ? (
                                    <div className="popup-loading">
                                        <Loader2 size={24} className="spin-icon" />
                                        <span>Loading items...</span>
                                    </div>
                                ) : isSwitchingBusiness ? (
                                    <div className="popup-loading">
                                        <Loader2 size={24} className="spin-icon" />
                                        <span>Switching business...</span>
                                    </div>
                                ) : modalOptions.length === 0 ? (
                                    <div className="popup-empty">No items available.</div>
                                ) : (
                                    modalOptions
                                        .filter((opt: any) => {
                                            const name = opt.business_name || opt.operation_name || opt.name || opt.branch_name || "";
                                            return name.toLowerCase().includes(modalSearch.toLowerCase());
                                        })
                                        .map((opt: any, idx: number) => {
                                            const id = opt.id || opt.business_id || opt.operation_id || opt.branch_id || idx;
                                            const name = opt.business_name || opt.operation_name || opt.name || opt.branch_name || "Unnamed Item";
                                            const isSelected = activeModal.type === 1 ? String(id) === activeBusinessId : false;

                                            return (
                                                <div key={id} className={`popup-list-item ${isSelected ? 'selected' : ''}`} onClick={() => {
                                                    if (activeModal.type === 1) {
                                                        handleBusinessSelect(opt);
                                                    } else {
                                                        // Logic for store/branch update could be added here
                                                        setActiveModal(null);
                                                    }
                                                }}>
                                                    <span className="item-txt">{name}</span>
                                                    {isSelected && <Check size={16} className="item-check" />}
                                                </div>
                                            )
                                        })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessAdmin;
