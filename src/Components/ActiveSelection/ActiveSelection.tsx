import { useState, useEffect } from 'react';
import { Building, Store, MapPin, Layers, ShoppingCart, Activity, Check, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSetupSummary, getBusinesses, getShopTypes, getBusinessCategoryGroups } from '../../api/business';
import { fetchGroupCategoryBrandList } from '../../api/product';
import './ActiveSelection.css';

interface ActiveSelectionProps {
    hideChangeOptions?: boolean;
}

const ActiveSelection = ({ hideChangeOptions = false }: ActiveSelectionProps) => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<number | null>(null);
    const [modalTitle, setModalTitle] = useState("");
    const [allOptions, setAllOptions] = useState<any[]>([]);
    const [isFetchingOptions, setIsFetchingOptions] = useState(false);
    const [selectedIds, setSelectedIds] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Initial values from localStorage for immediate display (fallback)
    const initialBusiness = localStorage.getItem('business_name') || 'Select Company';
    const initialShop = localStorage.getItem('shop_name') || 'Select Store';
    const initialGroup = localStorage.getItem('selected_category_group_name') || 'Select Group';
    const initialCategoriesRaw = localStorage.getItem('selected_category_names');
    const initialCategories = initialCategoriesRaw ? JSON.parse(initialCategoriesRaw) : [];
    const initialBranch = localStorage.getItem('branch_name') || 'Select Branch';

    useEffect(() => {
        const fetchSummary = async () => {
            const businessToken = localStorage.getItem('token');
            if (!businessToken || businessToken === 'undefined' || businessToken === 'null') {
                setIsLoading(false);
                return;
            }

            try {
                const res = await getSetupSummary();
                if (res?.success && res.data) {
                    setSummary(res.data);
                } else if (res && !res.success && res.data) {
                    setSummary(res.data);
                }
            } catch (error) {
                console.error("⚠️ [ActiveSelection] Failed to fetch setup summary:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const businessName = summary?.business?.business_name || summary?.business?.name || summary?.business_name || initialBusiness;

    const shopNames = (() => {
        const shops = summary?.shop_types || summary?.shopTypes || summary?.shop_type_list || [];
        if (Array.isArray(shops) && shops.length > 0) {
            return shops.map((s: any) => s.shop_type || s.operation_name || s.name || s.shop_type_name || 'Unknown').join(", ");
        }
        return initialShop;
    })();

    const categoryGroupName = (() => {
        const groups = summary?.category_groups || summary?.categoryGroups || summary?.category_group_list || [];
        if (Array.isArray(groups) && groups.length > 0) {
            return groups.map((g: any) => g.category_group_name || g.name || g.group_name || 'Unknown').join(", ");
        }
        // Fallback to local storage variants
        const storedPlural = localStorage.getItem('selected_category_group_names');
        if (storedPlural) {
            try { return JSON.parse(storedPlural).join(", "); } catch { }
        }
        return initialGroup;
    })();

    const categoryDisplay = (() => {
        const categories = summary?.categories || summary?.categoryList || summary?.category_list || [];
        if (Array.isArray(categories) && categories.length > 0) {
            return categories.length > 1 ? `${categories.length} Items Selected` : 
                   ((categories[0].category_name || categories[0].name) || `${categories.length} Item`);
        }
        return initialCategories.length > 0 ? `${initialCategories.length} Items Selected` : 'None Selected';
    })();

    const branchName = (() => {
        const branches = summary?.branches || summary?.storage_types || summary?.storageTypes || [];
        if (branches.length > 0) {
            return branches.map((b: any) => b.branch_name || b.name || b.storage_type_name || 'Unknown').join(", ");
        }
        return initialBranch;
    })();

    const businessModes = (() => {
        const modes = summary?.business_modes || summary?.businessModes || summary?.modules || [];
        if (modes.length > 0) {
            return modes.map((m: any) => m.mode_name || m.name || m.module_name || 'Unknown').join(", ");
        }
        try {
            const initialMode = localStorage.getItem('business_mode') || 'Select Mode';
            const parsed = JSON.parse(initialMode);
            if (Array.isArray(parsed)) return parsed.join(", ");
            return initialMode;
        } catch { 
            return 'Select Mode';
        }
    })();

    const handleLevelChange = async (step: number, title: string) => {
        setModalType(step);
        setModalTitle(title);
        setShowModal(true);
        setIsFetchingOptions(true);
        setSearchQuery("");

        try {
            let options: any[] = [];
            let currentSelected: any[] = [];

            if (step === 1) { // Business
                const res = await getBusinesses();
                options = Array.isArray(res) ? res : (res.data || []);
                currentSelected = [summary?.business?.id || summary?.business?.business_id].filter(Boolean);
            } else if (step === 6) { // Shop Type
                const res = await getShopTypes();
                options = Array.isArray(res) ? res : (res.data || []);
                currentSelected = (summary?.shop_types || []).map((s: any) => String(s.id || s.operation_id));
            } else if (step === 2) { // Category Group
                const res = await getBusinessCategoryGroups();
                options = res?.data?.category_groups || (Array.isArray(res) ? res : []);
                currentSelected = (summary?.category_groups || []).map((g: any) => String(g.id || g.category_group_id));
            } else if (step === 3) { // Categories
                // We might need to fetch for multiple groups
                const groups = summary?.category_groups || [];
                let allCats: any[] = [];
                for (const g of groups) {
                    const res = await fetchGroupCategoryBrandList(g.id || g.category_group_id);
                    const cats = Array.isArray(res) ? res : (res.data || []);
                    allCats = [...allCats, ...cats];
                }
                options = allCats;
                currentSelected = (summary?.categories || []).map((c: any) => Number(c.id || c.category_id));
            } else if (step === 5) { // Branch
                options = summary?.branches?.length ? summary.branches : (summary?.storage_types || []);
                currentSelected = options.map((b: any) => String(b.id || b.branch_id));
            }

            setAllOptions(options);
            setSelectedIds(currentSelected);
        } catch (error) {
            console.error("Failed to fetch options for modal:", error);
        } finally {
            setIsFetchingOptions(false);
        }
    };

    return (
        <div className="active-selection-card glass">
            <div className="selection-header">
                <span className="selection-title">ACTIVE SELECTION SUMMARY</span>
            </div>

            <div className="selection-grid-modern">
                <div className="selection-item-compact">
                    <div className="item-icon-wrapper company"><Building size={16} /></div>
                    <div className="item-info">
                        <label>Business</label>
                        <span className="item-name">{isLoading ? '...' : businessName}</span>
                    </div>
                    {!hideChangeOptions && (
                        <button className="change-link" onClick={() => handleLevelChange(1, "Select Business")}>Change</button>
                    )}
                </div>

                <div className="selection-item-compact">
                    <div className="item-icon-wrapper store"><Store size={16} /></div>
                    <div className="item-info">
                        <label>Shop Type</label>
                        <span className="item-name" title={shopNames}>{isLoading ? '...' : shopNames}</span>
                    </div>
                    {!hideChangeOptions && (
                        <button className="change-link" onClick={() => handleLevelChange(6, "Select Shop Type")}>Change</button>
                    )}
                </div>

                <div className="selection-item-compact">
                    <div className="item-icon-wrapper group"><Layers size={16} /></div>
                    <div className="item-info">
                        <label>Category Group</label>
                        <span className="item-name" title={categoryGroupName}>{isLoading ? '...' : categoryGroupName}</span>
                    </div>
                    {!hideChangeOptions && (
                        <button className="change-link" onClick={() => handleLevelChange(2, "Select Category Group")}>Change</button>
                    )}
                </div>

                <div className="selection-item-compact">
                    <div className="item-icon-wrapper list"><ShoppingCart size={16} /></div>
                    <div className="item-info">
                        <label>Category List</label>
                        <span className="item-name">{isLoading ? '...' : categoryDisplay}</span>
                    </div>
                    {!hideChangeOptions && (
                        <button className="change-link" onClick={() => handleLevelChange(3, "Select Categories")}>Change</button>
                    )}
                </div>

                <div className="selection-item-compact">
                    <div className="item-icon-wrapper branch"><MapPin size={16} /></div>
                    <div className="item-info">
                        <label>Storage / Branch</label>
                        <span className="item-name">{isLoading ? '...' : branchName}</span>
                    </div>
                    {!hideChangeOptions && (
                        <button className="change-link" onClick={() => handleLevelChange(5, "Select Storage / Branch")}>Change</button>
                    )}
                </div>

                <div className="selection-item-compact">
                    <div className="item-icon-wrapper mode"><Activity size={16} /></div>
                    <div className="item-info">
                        <label>Business Mode</label>
                        <span className="item-name" style={{ textTransform: 'capitalize' }}>{isLoading ? '...' : businessModes}</span>
                    </div>
                    {!hideChangeOptions && (
                        <button className="change-link" onClick={() => navigate('/new-user-setup', { state: { resumeStep: 7 } })}>Change</button>
                    )}
                </div>
            </div>

            {/* Selection Modal */}
            {showModal && (
                <div className="selection-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="selection-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalTitle}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        
                        <div className="modal-search">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="modal-list scrollbar-custom">
                            {isFetchingOptions ? (
                                <div className="modal-loading">Loading items...</div>
                            ) : allOptions.length === 0 ? (
                                <div className="modal-empty">No items available.</div>
                            ) : (
                                allOptions
                                    .filter(opt => {
                                        const name = opt.business_name || opt.operation_name || opt.category_group_name || opt.category_name || opt.name || opt.branch_name || "";
                                        return name.toLowerCase().includes(searchQuery.toLowerCase());
                                    })
                                    .map((opt, idx) => {
                                        const id = opt.id || opt.business_id || opt.operation_id || opt.category_group_id || opt.category_id || opt.branch_id || idx;
                                        const name = opt.business_name || opt.operation_name || opt.category_group_name || opt.category_name || opt.name || opt.branch_name || "Unnamed Item";
                                        const isSelected = selectedIds.includes(String(id)) || selectedIds.includes(Number(id));
                                        
                                        return (
                                            <div key={id} className={`modal-item ${isSelected ? 'selected' : ''}`}>
                                                <div className="item-main">
                                                    <span className="item-bullet" />
                                                    <span className="item-text">{name}</span>
                                                </div>
                                                {isSelected && <Check size={16} className="check-icon" />}
                                            </div>
                                        );
                                    })
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-setup" onClick={() => navigate('/new-user-setup', { state: { resumeStep: modalType } })}>
                                Edit in Setup Page
                            </button>
                            <button className="btn-close" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActiveSelection;
