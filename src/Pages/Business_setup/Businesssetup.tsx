import React, { useState, useMemo, useEffect, useRef } from "react";
import { X, Edit, Trash2, Loader2, RefreshCw, Search, ChevronDown, Check, Building } from "lucide-react";
import { saveBusinessSetup, getSetupSummary, getBusinesses, type BusinessSetupPayload } from "../../api/business";
import { selectBusiness } from "../../api/auth";
import "./Businesssetup.css";

interface Product {
    id: number;
    name: string;
    category: string;
    brand: string;
    qty: number;
    status: boolean;
    price: number;
    description?: string;
}

const BusinessSetup: React.FC = () => {
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Setup data from API
    const [setupData, setSetupData] = useState<any>(null);

    // Business selection
    const [businessList, setBusinessList] = useState<any[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>(localStorage.getItem("business_id") || "");
    const [selectedBusinessName, setSelectedBusinessName] = useState<string>(localStorage.getItem("business_name") || "Select Business");
    const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
    const [businessSearch, setBusinessSearch] = useState("");
    const [isSwitching, setIsSwitching] = useState(false);
    const businessDropdownRef = useRef<HTMLDivElement>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const [filters, setFilters] = useState({
        group: "",
        category: "",
        brand: "",
        product: "",
    });

    const [formData, setFormData] = useState<Product>({
        id: 0,
        name: "",
        category: "",
        brand: "",
        qty: 0,
        price: 0,
        status: true,
        description: "",
    });

    const [products, setProducts] = useState<Product[]>([]);

    // Interactive Explorer State
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [activeCatId, setActiveCatId] = useState<string | null>(null);

    // Fetch setup data from GET /api/setup/setup on mount
    const fetchSetupData = async () => {
        setIsFetching(true);
        // Clear previous state to ensure clean view on switch
        setProducts([]);
        setSetupData(null);
        try {
            console.log("📡 [BusinessSetup] Fetching setup data...");
            const res = await getSetupSummary();
            console.log("📦 [BusinessSetup] Setup API Response:", res);

            if (res?.success && res.data) {
                setSetupData(res.data);

                // Map categories into the products table for display
                const mappedProducts: Product[] = [];

                if (res.data.categories && Array.isArray(res.data.categories)) {
                    res.data.categories.forEach((cat: any, index: number) => {
                        mappedProducts.push({
                            id: cat.id || cat.category_id || index + 1,
                            name: cat.name || cat.category_name || "Unnamed",
                            category: cat.group_name || cat.category_group_name || cat.category_group || "General",
                            brand: cat.brand_name || cat.brand || "-",
                            qty: cat.qty || cat.quantity || 0,
                            status: cat.status !== undefined ? cat.status : true,
                            price: cat.price || 0,
                            description: cat.description || "",
                        });
                    });
                }

                // If no categories, try using brands as display items
                if (mappedProducts.length === 0 && res.data.brands && Array.isArray(res.data.brands)) {
                    res.data.brands.forEach((brand: any, index: number) => {
                        mappedProducts.push({
                            id: brand.id || brand.brand_id || index + 1,
                            name: brand.name || brand.brand_name || "Unnamed",
                            category: brand.category_name || brand.group_name || "General",
                            brand: brand.name || brand.brand_name || "-",
                            qty: brand.qty || brand.quantity || 0,
                            status: brand.status !== undefined ? brand.status : true,
                            price: brand.price || 0,
                            description: brand.description || "",
                        });
                    });
                }

                setProducts(mappedProducts);
                console.log("✅ [BusinessSetup] Populated", mappedProducts.length, "items from API");
            } else {
                console.warn("⚠️ [BusinessSetup] No data returned from setup API");
            }
        } catch (error) {
            console.error("❌ [BusinessSetup] Failed to fetch setup data:", error);
            showToast("Failed to load setup data", "error");
        } finally {
            setIsFetching(false);
        }
    };

    // Parent-child relationship mapping
    const groupedData = useMemo(() => {
        if (!setupData) return [];

        const groups = setupData.category_groups || setupData.categoryGroups || [];
        const categories = setupData.categories || setupData.categoryList || [];

        return groups.map((group: any) => {
            const groupId = group.id || group.category_group_id;
            const groupName = group.name || group.category_group_name || group.group_name || "Unknown Group";
            
            // Find categories that belong to this group
            const childCategories = categories.filter((cat: any) => 
                String(cat.group_id) === String(groupId) || 
                String(cat.category_group_id) === String(groupId)
            );

            return {
                id: groupId,
                name: groupName,
                categories: childCategories.map((c: any) => ({
                    id: c.id || c.category_id,
                    name: c.name || c.category_name || "Unnamed Category",
                    status: c.status !== undefined ? c.status : true
                }))
            };
        });
    }, [setupData]);

    // Filter and drill-down data for explorer
    const explorerCategories = useMemo(() => {
        if (!activeGroupId) return [];
        const group = groupedData.find((g: any) => String(g.id) === String(activeGroupId));
        return group ? group.categories : [];
    }, [activeGroupId, groupedData]);

    const explorerProducts = useMemo(() => {
        if (!activeCatId) return [];
        return (setupData?.categories || []).filter((p: any) => 
            String(p.category_list_id || p.category_id || p.id) === String(activeCatId)
        );
    }, [activeCatId, setupData]);
    
    // Clear selection on business switch
    useEffect(() => {
        setActiveGroupId(null);
        setActiveCatId(null);
    }, [selectedBusinessId]);

    // Re-fetch setup data whenever the selected business changes
    useEffect(() => {
        if (selectedBusinessId) {
            fetchSetupData();
        }
    }, [selectedBusinessId]);

    // Fetch all businesses
    const fetchBusinessList = async () => {
        try {
            const res = await getBusinesses();
            const list = Array.isArray(res) ? res : (res?.data || []);
            setBusinessList(list);
            console.log("🏢 [BusinessSetup] Business list fetched:", list.length, "items");
        } catch (error) {
            console.error("❌ [BusinessSetup] Failed to fetch businesses:", error);
        }
    };

    // Fetch all businesses once on mount
    useEffect(() => {
        fetchBusinessList();
    }, []);

    // Switch business
    const handleBusinessSwitch = async (business: any) => {
        const busId = String(business.id || business.business_id);
        const busName = business.business_name || business.name || "Unnamed";

        if (busId === selectedBusinessId) {
            setShowBusinessDropdown(false);
            return;
        }

        setIsSwitching(true);
        setShowBusinessDropdown(false);
        try {
            console.log(`🔄 [BusinessSetup] Switching to business: ${busName} (ID: ${busId})`);
            const response = await selectBusiness({ business_id: busId });

            // Update token and localStorage
            const businessToken = response.token || response?.data?.token;
            if (businessToken) {
                localStorage.setItem("token", businessToken);
            }
            localStorage.setItem("business_id", busId);
            localStorage.setItem("business_name", busName);

            setSelectedBusinessId(busId);
            setSelectedBusinessName(busName);

            showToast(`Switched to "${busName}"`, "success");

            // Re-fetch setup data for the new business
            await fetchSetupData();
        } catch (error: any) {
            console.error("❌ [BusinessSetup] Business switch failed:", error);
            showToast("Switch failed: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsSwitching(false);
        }
    };

    // Close business dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
                setShowBusinessDropdown(false);
            }
        };
        if (showBusinessDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showBusinessDropdown]);

    const filteredBusinesses = useMemo(() => {
        return businessList.filter(b => {
            const name = (b.business_name || b.name || "").toLowerCase();
            return name.includes(businessSearch.toLowerCase());
        });
    }, [businessList, businessSearch]);

    // Global options (unfiltered) for the Add Product drawer
    const globalCategoryOptions = useMemo(() => {
        const groups = setupData?.category_groups || setupData?.categoryGroups || [];
        if (groups.length > 0) {
            return groups.map((cg: any) => cg.category_group_name || cg.name || cg.group_name || "Unnamed Group");
        }
        return Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    }, [setupData, products]);

    const globalBrandOptions = useMemo(() => {
        const brands = setupData?.brands || setupData?.brandList || [];
        if (brands.length > 0) {
            return brands.map((b: any) => b.brand_name || b.name || "Unnamed Brand");
        }
        return Array.from(new Set(products.map(p => p.brand).filter(b => b && b !== "-")));
    }, [setupData, products]);

    // Derive options for dependent filters derived from setupData and current filter state
    const explorerGroupOptions = useMemo(() => {
        return groupedData.map((g: any) => g.name);
    }, [groupedData]);

    const explorerCategoryOptions = useMemo(() => {
        if (!filters.group) return [];
        const group = groupedData.find((g: any) => g.name === filters.group);
        return group ? group.categories.map((c: any) => c.name) : [];
    }, [filters.group, groupedData]);

    const explorerBrandOptions = useMemo(() => {
        if (!filters.category) return [];
        // Extract brands from categories that match the name
        const cats = (setupData?.categories || []).filter((c: any) => (c.category_name || c.name) === filters.category);
        const brands = cats.map((c: any) => c.brand_name || c.brand).filter(Boolean);
        return Array.from(new Set(brands));
    }, [filters.category, setupData]);

    const explorerProductOptions = useMemo(() => {
        let list = products;
        if (filters.group) list = list.filter(p => p.category === filters.group);
        if (filters.category) list = list.filter(p => (p.name === filters.category || p.category === filters.category)); 
        if (filters.brand) list = list.filter(p => p.brand === filters.brand);
        return list;
    }, [filters, products]);


    /* ---------------- FILTER LOGIC ---------------- */

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            return (
                (filters.group ? p.category === filters.group : true) &&
                (filters.brand ? p.brand === filters.brand : true) &&
                (filters.product ? p.name === filters.product : true)
            );
        });
    }, [filters, products]);

    /* ---------------- CRUD FUNCTIONS ---------------- */

    const handleSave = async () => {
        // Update local state
        if (editingId) {
            setProducts((prev) =>
                prev.map((p) => (p.id === editingId ? formData : p))
            );
        } else {
            setProducts([...products, { ...formData, id: Date.now() }]);
        }

        // Build payload for the API from current selections
        setIsLoading(true);
        try {
            // Construct payload from currently loaded setup data (most reliable after switch)
            // or fallback to localStorage if no data yet (for first-time setup UI)
            
            const getIdsFromData = (list: any[], keyId: string) => {
                if (!list || !Array.isArray(list)) return [];
                return list.map(item => Number(item[keyId] || item.id)).filter(id => !isNaN(id));
            };

            let payload: BusinessSetupPayload;

            if (setupData) {
                payload = {
                    shopTypeIds: getIdsFromData(setupData.shop_types, "operation_id"),
                    moduleItemIds: [1, 2, 3], // Generic modules
                    categoryGroupIds: getIdsFromData(setupData.category_groups, "category_group_id"),
                    categoryIds: getIdsFromData(setupData.categories, "category_id"),
                    brandIds: getIdsFromData(setupData.brands, "brand_id"),
                };
            } else {
                // Fallback to localStorage if no setupData exists
                const storedShopIds = localStorage.getItem("selected_shop_ids");
                const storedCategoryGroupIds = localStorage.getItem("selected_category_group_id");
                const storedCategoryIds = localStorage.getItem("selected_category_ids");
                const storedBrandIds = localStorage.getItem("selected_brand_ids");

                payload = {
                    shopTypeIds: storedShopIds ? JSON.parse(storedShopIds).map(Number) : [],
                    moduleItemIds: [1, 2, 3],
                    categoryGroupIds: storedCategoryGroupIds ? JSON.parse(storedCategoryGroupIds).map(Number) : [],
                    categoryIds: storedCategoryIds ? JSON.parse(storedCategoryIds).map(Number) : [],
                    brandIds: storedBrandIds ? JSON.parse(storedBrandIds).map(Number) : [],
                };
            }

            console.log("💾 [BusinessSetup] Saving current configuration:", payload);
            await saveBusinessSetup(payload);
            showToast("Business configuration saved!", "success");

            // Re-fetch to get fresh state from API
            await fetchSetupData();
        } catch (error: any) {
            console.error("❌ [BusinessSetup] Save failed:", error);
            showToast("Save failed: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsLoading(false);
        }

        setShowDrawer(false);
        setEditingId(null);
        resetForm();
    };

    const handleEdit = (product: Product) => {
        setFormData(product || {
            id: 0,
            name: "",
            category: "",
            brand: "",
            qty: 0,
            price: 0,
            status: true,
            description: ""
        });
        setEditingId(product.id);
        setShowDrawer(true);
    };

    const handleDelete = (id: number) => {
        setProducts(products.filter((p) => p.id !== id));
    };

    const toggleStatus = (id: number) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, status: !p.status } : p
            )
        );
    };

    const resetForm = () => {
        setFormData({
            id: 0,
            name: "",
            category: "",
            brand: "",
            qty: 0,
            price: 0,
            status: true,
            description: "",
        });
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="business-setup-page">
            {/* Toast Notification */}
            {toast && (
                <div className={`bs-toast bs-toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}

            {/* Loading Overlay */}
            {(isLoading || isFetching || isSwitching) && (
                <div className="bs-loading-overlay">
                    <Loader2 className="bs-spinner" size={32} />
                    <span>{isSwitching ? "Switching business..." : isLoading ? "Saving setup..." : "Loading setup data..."}</span>
                </div>
            )}

            <div className="bs-header-row">
                <h2 className="page-title">Business Setup</h2>
                <div className="bs-header-actions">
                    {/* Business Switcher */}
                    <div className="bs-business-selector" ref={businessDropdownRef}>
                        <button
                            className="bs-business-trigger"
                            onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                        >
                            <Building size={18} />
                            <span className="bs-business-name">{selectedBusinessName}</span>
                            <ChevronDown size={16} className={`bs-chevron ${showBusinessDropdown ? "bs-chevron-open" : ""}`} />
                        </button>

                        {showBusinessDropdown && (
                            <div className="bs-business-dropdown">
                                <div className="bs-business-dropdown-header">Switch Business</div>
                                <div className="bs-business-search">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={businessSearch}
                                        onChange={(e) => setBusinessSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="bs-business-list">
                                    {filteredBusinesses.length === 0 ? (
                                        <div className="bs-business-empty">No businesses found</div>
                                    ) : (
                                        filteredBusinesses.map((b, idx) => {
                                            const id = String(b.id || b.business_id);
                                            const name = b.business_name || b.name || "Unnamed";
                                            const isActive = id === selectedBusinessId;
                                            return (
                                                <div
                                                    key={id || idx}
                                                    className={`bs-business-item ${isActive ? "bs-business-item-active" : ""}`}
                                                    onClick={() => handleBusinessSwitch(b)}
                                                >
                                                    <span>{name}</span>
                                                    {isActive && <Check size={16} className="bs-business-check" />}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="secondary-btn bs-refresh-btn" onClick={fetchSetupData} disabled={isFetching}>
                        <RefreshCw size={16} className={isFetching ? "bs-spinner" : ""} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Setup Summary Section */}
            {!isFetching && setupData && (
                <div className="bs-setup-container">
                    <div className="bs-summary-cards">
                        {setupData.shop_types?.length > 0 && (
                            <div className="bs-summary-card">
                                <div className="bs-summary-card-icon">🏬</div>
                                <div className="bs-summary-card-content">
                                    <span className="bs-summary-card-label">Shop Types</span>
                                    <span className="bs-summary-card-value">
                                        {(setupData.shop_types || setupData.shopTypes || []).map((s: any) => s.operation_name || s.name || s.shop_type).join(", ")}
                                    </span>
                                </div>
                                <span className="bs-summary-card-count">{setupData.shop_types.length}</span>
                            </div>
                        )}
                        <div className="bs-summary-card">
                            <div className="bs-summary-card-icon">📂</div>
                            <div className="bs-summary-card-content">
                                <span className="bs-summary-card-label">Groups</span>
                                <span className="bs-summary-card-value">{groupedData.length} active groups</span>
                            </div>
                            <span className="bs-summary-card-count">{groupedData.length}</span>
                        </div>
                        <div className="bs-summary-card">
                            <div className="bs-summary-card-icon">🛒</div>
                            <div className="bs-summary-card-content">
                                <span className="bs-summary-card-label">Categories</span>
                                <span className="bs-summary-card-value">{products.length} categories</span>
                            </div>
                            <span className="bs-summary-card-count">{products.length}</span>
                        </div>
                    </div>

                    {/* Interactive Setup Explorer */}
                    <div className="bs-hierarchy-section">
                        <div className="bs-section-header">
                            Setup Explorer
                            {activeGroupId && (
                                <button className="bs-reset-btn" onClick={() => { setActiveGroupId(null); setActiveCatId(null); }}>
                                    Clear Filter
                                </button>
                            )}
                        </div>
                        
                        <div className="bs-explorer-layout">
                            {/* Column 1: Category Groups */}
                            <div className="bs-explorer-col">
                                <label className="bs-col-label">Category Groups</label>
                                <div className="bs-explorer-list">
                                    {groupedData.length === 0 ? (
                                        <div className="bs-empty-text">No groups found</div>
                                    ) : (
                                        groupedData.map((group: any) => (
                                            <div 
                                                key={group.id} 
                                                className={`bs-explorer-item ${activeGroupId === String(group.id) ? 'active' : ''}`}
                                                onClick={() => {
                                                    setActiveGroupId(activeGroupId === String(group.id) ? null : String(group.id));
                                                    setActiveCatId(null);
                                                }}
                                            >
                                                <span className="bs-item-name">{group.name}</span>
                                                <div className="bs-item-badge">{group.categories.length}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Categories */}
                            <div className={`bs-explorer-col ${!activeGroupId ? 'disabled' : ''}`}>
                                <label className="bs-col-label">Categories</label>
                                <div className="bs-explorer-list">
                                    {!activeGroupId ? (
                                        <div className="bs-placeholder">Select a group first</div>
                                    ) : explorerCategories.length === 0 ? (
                                        <div className="bs-empty-text">No categories under this group</div>
                                    ) : (
                                        explorerCategories.map((cat: any) => (
                                            <div 
                                                key={cat.id} 
                                                className={`bs-explorer-item ${activeCatId === String(cat.id) ? 'active' : ''}`}
                                                onClick={() => setActiveCatId(activeCatId === String(cat.id) ? null : String(cat.id))}
                                            >
                                                <span className="bs-item-name">{cat.name}</span>
                                                {!cat.status && <span className="bs-item-status">Inactive</span>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Summary / Detail */}
                            <div className={`bs-explorer-col ${!activeCatId ? 'disabled' : ''}`}>
                                <label className="bs-col-label">Product Details</label>
                                <div className="bs-explorer-content">
                                    {!activeCatId ? (
                                        <div className="bs-placeholder">Select a category to view items</div>
                                    ) : explorerProducts.length === 0 ? (
                                        <div className="bs-empty-text">No products configuration found</div>
                                    ) : (
                                        <div className="bs-detail-grid">
                                            {explorerProducts.map((p: any) => (
                                                <div key={p.id} className="bs-detail-card">
                                                    <div className="bs-detail-name">{p.category_name || p.name}</div>
                                                    <div className="bs-detail-row">
                                                        <span>Price</span>
                                                        <strong>₹{p.price || 0}</strong>
                                                    </div>
                                                    <div className="bs-detail-row">
                                                        <span>Quantity</span>
                                                        <strong>{p.qty || 0}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isFetching && !setupData && (
                <div className="bs-no-data-card">
                    <Building size={48} className="empty-icon" />
                    <h3>No Setup Data Found</h3>
                    <p>It looks like this business hasn't been configured yet. Click "Refresh" or select another business.</p>
                </div>
            )}

            {/* Filters */}
            <div className="filter-card">
                <div className="filter-row">
                    <div className="form-group">
                        <label>Category Group</label>
                        <select
                            value={filters.group}
                            onChange={(e) =>
                                setFilters({ ...filters, group: e.target.value, category: "", brand: "", product: "" })
                            }
                        >
                            <option value="">Select Group</option>
                            {explorerGroupOptions.map((group: string, i: number) => (
                                <option key={i} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={filters.category}
                            disabled={!filters.group}
                            onChange={(e) =>
                                setFilters({ ...filters, category: e.target.value, brand: "", product: "" })
                            }
                        >
                            <option value="">{filters.group ? "Select Category" : "Select Group first"}</option>
                            {explorerCategoryOptions.map((cat: string, i: number) => (
                                <option key={i} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Brand</label>
                        <select
                            value={filters.brand}
                            disabled={!filters.category}
                            onChange={(e) =>
                                setFilters({ ...filters, brand: e.target.value, product: "" })
                            }
                        >
                            <option value="">{filters.category ? "Select Brand" : "Select Category first"}</option>
                            {explorerBrandOptions.map((brand: any, i: number) => (
                                <option key={i} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Product</label>
                        <select
                            value={filters.product}
                            onChange={(e) =>
                                setFilters({ ...filters, product: e.target.value })
                            }
                        >
                            <option value="">Select Product</option>
                            {explorerProductOptions.map((p) => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="filter-buttons">
                    <button
                        className="primary-btn"
                        onClick={() => {
                            resetForm();
                            setShowDrawer(true);
                        }}
                    >
                        Add Product
                    </button>

                    <button
                        className="secondary-btn"
                        onClick={() =>
                            setFilters({ group: "", category: "", brand: "", product: "" })
                        }
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.qty}</td>
                                <td>${product.price}</td>
                                <td>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={product.status}
                                            onChange={() => toggleStatus(product.id)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="edit-icon-btn"
                                            onClick={() => handleEdit(product)}
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="delete-icon-btn"
                                            onClick={() => handleDelete(product.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center" }}>
                                    No Data Found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer */}
            {showDrawer && (
                <div className="drawer">
                    <div className="drawer-header">
                        <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
                        <button className="close-btn" onClick={() => setShowDrawer(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="drawer-body">
                        <div className="form-group">
                            <label>Product Name</label>
                            <input
                                type="text"
                                placeholder="Enter product name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({ ...formData, category: e.target.value })
                                }
                            >
                                <option value="">Select Category</option>
                                {globalCategoryOptions.map((cat: string, i: number) => (
                                    <option key={i} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Brand</label>
                            <select
                                value={formData.brand}
                                onChange={(e) =>
                                    setFormData({ ...formData, brand: e.target.value })
                                }
                            >
                                <option value="">Select Brand</option>
                                {globalBrandOptions.map((brand: string, i: number) => (
                                    <option key={i} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                placeholder="Enter product description"
                                rows={4}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formData.qty}
                                onChange={(e) =>
                                    setFormData({ ...formData, qty: Number(e.target.value) })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Price</label>
                            <div className="price-input-wrapper">
                                <span className="currency-prefix">$</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.price || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, price: Number(e.target.value) })
                                    }
                                />
                            </div>
                        </div>

                        <div className="status-row">
                            <label>Status</label>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={formData.status}
                                    onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.checked })
                                    }
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="drawer-footer">
                        <button className="primary-btn" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                            className="secondary-btn"
                            onClick={() => setShowDrawer(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessSetup;
