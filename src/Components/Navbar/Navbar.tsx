import { useState, useEffect, useRef } from 'react';
import { Search, Moon, Menu as MenuIcon, Building, Store, MapPin, X, ChevronDown, LogOut, User, ShoppingCart, Check, Loader2, ArrowRight, Layers, Activity } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getBusinesses, getShopTypes, getBusinessCategoryGroups, getSetupSummary } from '../../api/business.ts';
import { fetchGroupCategoryBrandList } from '../../api/product.ts';
import { selectBusiness } from '../../api/auth';
import NotificationMenu from '../Notification/notification';
import './Navbar.css';



const Navbar = ({ toggleSidebar, isSidebarOpen, onLogout, onModuleSelect }: {
  toggleSidebar: () => void,
  isSidebarOpen: boolean,
  onLogout?: () => void,
  onModuleSelect?: (id: string) => void
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [mobileView, setMobileView] = useState<'main' | 'product' | 'billing' | 'settings' | string>('main');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Unified nav items matching the Sidebar exactly
  const navModules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
    },
    {
      id: 'business_setup',
      label: 'Business setup',
      path: '/new-user-setup',
      subItems: [
        // { label: 'Manage Login', path: '/manage-login' },
        { label: 'New User setup', path: '/new-user-setup' },
      ]
    },
    // {
    //   id: 'Add Category',
    //   label: 'Inventory',
    //   path: '/add-category',
    //   subItems: [
    //     { label: 'Add Category', path: '/add-category' },
    //     { label: 'Sales', path: '/sales-entry' },
    //     { label: 'Storage', path: '/storage' },
    //   ]
    // },
    {
      id: 'inventory',
      label: 'Product',
      path: '/add-product',
      subItems: [
        { label: 'Storage', path: '/storage' },
        { label: 'Add Product', path: '/add-product' },
        { label: 'Product List', path: '/products' },
        { label: 'Stock Entry', path: '/stock-entry' },
        { label: 'Stock List', path: '/stock-list' },
        { label: 'Add Supplier', path: '/add-supplier' },
      ]
    },
    {
      id: 'billing',
      label: 'Billing',
      path: '/billing/create',
      subItems: [
        { label: 'Generate Bill', path: '/billing/create' },
        { label: 'Invoices', path: '/invoice' },
        // { label: 'Payment Settings', path: '/billing/add-cc' },
      ]
    },
    // {
    //   id: 'management',
    //   label: 'Management',
    //   path: '/business-admin',
    //   subItems: [
    //     { label: 'Business Admin', path: '/business-admin' },
    //     { label: 'Product Setup', path: '/product-setup' },
    //     { label: 'Business Profile', path: '/business-setup' },
    //     { label: 'Business Create', path: '/business-create' },
    //   ]
    // }
  ];

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Modal State for Selection
  const [activeNames, setActiveNames] = useState({
    business: localStorage.getItem('business_name') || 'Select Company',
    shop: 'Select Store',
    categoryGroup: 'Select Group',
    categories: '',
    branch: 'Select Branch',
    mode: 'Select Mode',
    modules: 'Select Modules',
    brands: 'None'
  });

  const [activeModal, setActiveModal] = useState<{ type: number, title: string } | null>(null);
  const [isFetchingModal, setIsFetchingModal] = useState(false);
  const [modalOptions, setModalOptions] = useState<any[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [summaryView, setSummaryView] = useState<number>(0); // 0: Primary, 1: Business List
  const [availableBusinesses, setAvailableBusinesses] = useState<any[]>([]);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Business list & selection
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(localStorage.getItem('business_id') || '');
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>(localStorage.getItem('business_name') || 'Select Company');
  const [isSwitchingBusiness, setIsSwitchingBusiness] = useState(false);

  // Fetch businesses list on mount
  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const busData = await getBusinesses();
        const list = Array.isArray(busData) ? busData : (busData?.data || []);
        setAvailableBusinesses(list);
      } catch (err) { console.warn("Failed to fetch businesses for toggle", err); }
    };
    fetchAvailable();

    const checkBusinesses = async () => {
      const storedId = localStorage.getItem('business_id');
      if (storedId) {
        setSelectedBusinessId(storedId);
        setSelectedBusinessName(localStorage.getItem('business_name') || 'Select Company');
        return;
      }

      try {
        const busData = await getBusinesses();
        const list = Array.isArray(busData) ? busData : (busData?.data || []);

        if (list.length > 0) {
          const firstBus = list[0];
          const firstId = String(firstBus.id || firstBus.business_id);
          const firstName = firstBus.business_name || firstBus.name || 'Unnamed';

          console.log(`🏢 [Navbar] Auto-selecting first business: ${firstName}`);
          const response = await selectBusiness({ business_id: firstId });
          const businessToken = response.token || response?.data?.token || response?.token;

          if (businessToken) localStorage.setItem('token', businessToken);
          localStorage.setItem('business_id', firstId);
          localStorage.setItem('business_name', firstName);
          setSelectedBusinessId(firstId);
          setSelectedBusinessName(firstName);
        }
      } catch (err) {
        console.error('❌ [Navbar] Auto-select failed:', err);
      }
    };
    checkBusinesses();
  }, []);

  // Handle Business Selection from Modal
  const handleBusinessSelect = async (business: any) => {
    const busId = String(business.id || business.business_id);
    const busName = business.business_name || business.name || 'Unnamed';

    if (busId === selectedBusinessId) {
      setActiveModal(null);
      return;
    }

    setIsSwitchingBusiness(true);
    try {
      console.log(`🔄 [Navbar] Switching to business: ${busName} (ID: ${busId})`);
      const response = await selectBusiness({ business_id: busId });
      const businessToken = response.token || response?.data?.token;
      if (businessToken) localStorage.setItem('token', businessToken);
      localStorage.setItem('business_id', busId);
      localStorage.setItem('business_name', busName);

      // Clear specific setup items to avoid stale summary until re-fetched
      localStorage.removeItem('selected_category_group_name');
      localStorage.removeItem('selected_category_names');
      localStorage.removeItem('shop_name');

      setSelectedBusinessId(busId);
      setSelectedBusinessName(busName);
      setActiveModal(null);
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Business switch failed:', error);
      alert('Failed: ' + (error.message || 'Error'));
    } finally {
      setIsSwitchingBusiness(false);
    }
  };

  // Sync data from API/localStorage for display
  const fetchActiveSummary = async () => {
    try {
      const res = await getSetupSummary();
      if (res?.success && res.data) {
        updateActiveNames(res.data);
      } else {
        updateActiveNames(null);
      }
    } catch (error) {
      console.warn("⚠️ [Navbar] Failed to fetch setup summary:", error);
      updateActiveNames(null);
    }
  };

  const updateActiveNames = (summaryData: any = null) => {
    // 1. Categories Display (Aggressive extraction)
    const apiCats = summaryData?.categories ||
      summaryData?.categoryList ||
      summaryData?.category_list ||
      summaryData?.category_ids ||
      summaryData?.categoryIds || [];

    let categoryDisplay = '';
    if (Array.isArray(apiCats) && apiCats.length > 0) {
      const names = apiCats
        .map((c: any) => {
          if (typeof c === 'string' || typeof c === 'number') return String(c);
          return c.category_name || c.category_list_name || c.name || c.item_name || c.label || c.title || c.category || "";
        })
        .filter((name: string) => name && !name.toLowerCase().includes("unnamed") && name !== "[object Object]");
      if (names.length > 0) {
        categoryDisplay = names.join(", ");
      }
    }

    if (!categoryDisplay) {
      const stored = localStorage.getItem('selected_category_names');
      let names: string[] = [];
      try { names = stored ? JSON.parse(stored) : []; } catch { names = []; }
      categoryDisplay = Array.isArray(names) ? names.filter((n: string) => n && !n.toLowerCase().includes("unnamed")).join(", ") : '';
    }

    // 2. Shop Display
    const apiShops = summaryData?.shop_types || summaryData?.shopTypes || summaryData?.shop_type_list || [];
    let shopDisplay = 'Select Store';
    if (Array.isArray(apiShops) && apiShops.length > 0) {
      const names = apiShops
        .map((s: any) => s.operation_name || s.name || s.shop_type_name || "")
        .filter((name: string) => name && !name.toLowerCase().includes("unnamed"));
      shopDisplay = names.length > 0 ? names.join(", ") : (localStorage.getItem('shop_name') || 'Select Store');
    } else {
      shopDisplay = localStorage.getItem('shop_name') || 'Select Store';
    }

    // 3. Category Group Display
    const apiGroups = summaryData?.category_groups ||
      summaryData?.categoryGroups ||
      summaryData?.category_group_list ||
      summaryData?.category_group || [];

    let groupDisplay = '';
    if (Array.isArray(apiGroups) && apiGroups.length > 0) {
      const names = apiGroups
        .map((g: any) => typeof g === 'string' ? g : (g.category_group_name || g.name || g.group_name || g.title || ""))
        .filter((name: string) => name && !name.toLowerCase().includes("unnamed") && name !== "[object Object]");
      if (names.length > 0) {
        groupDisplay = names.join(", ");
      }
    }

    if (!groupDisplay) {
      // Check both singular and plural localStorage keys
      const storedSingle = localStorage.getItem('selected_category_group_name');
      const storedPlural = localStorage.getItem('selected_category_group_names');

      let names: string[] = [];
      if (storedPlural) {
        try { names = JSON.parse(storedPlural); } catch { names = []; }
      } else if (storedSingle) {
        names = [storedSingle];
      }

      groupDisplay = Array.isArray(names) ? names.filter((n: string) => n && !n.toLowerCase().includes("unnamed")).join(", ") : '';
    }

    // 4. Modules Display
    const apiModules = summaryData?.module_items || summaryData?.moduleItems || [];
    let moduleDisplay = 'Select Modules';
    if (apiModules.length > 0) {
      moduleDisplay = apiModules.map((m: any) => m.name || m.module_name || "").filter(Boolean).join(", ");
    }

    // 5. Brands Summary
    const apiBrands = summaryData?.brands || [];
    let brandDisplay = 'None';
    if (apiBrands.length > 0) {
      brandDisplay = `${apiBrands.length} Brands Enabled`;
    }

    // 6. Mode Display Formatting
    const rawMode = localStorage.getItem('business_mode') || 'Select Mode';
    let formattedMode = rawMode;
    try {
      if (rawMode.startsWith('[')) {
        const parsed = JSON.parse(rawMode);
        formattedMode = Array.isArray(parsed) ? parsed.join(", ") : rawMode;
      }
    } catch { }

    setActiveNames({
      business: selectedBusinessName,
      shop: shopDisplay,
      categoryGroup: groupDisplay || 'Select Group',
      categories: categoryDisplay || 'None Selected',
      branch: localStorage.getItem('branch_name') || 'Select Branch',
      mode: formattedMode,
      modules: moduleDisplay,
      brands: brandDisplay
    });
  };

  useEffect(() => {
    fetchActiveSummary();
  }, [selectedBusinessId]);

  useEffect(() => {
    if (showCompanyMenu) fetchActiveSummary();
  }, [showCompanyMenu]);

  const handleLevelChange = async (step: number, title: string) => {
    setShowCompanyMenu(false);
    setActiveModal({ type: step, title });
    setIsFetchingModal(true);
    setModalSearch("");

    try {
      let options: any[] = [];
      if (step === 1) {
        const res = await getBusinesses();
        options = Array.isArray(res) ? res : (res.data || []);
      } else if (step === 6) {
        const res = await getShopTypes();
        options = Array.isArray(res) ? res : (res.data || []);
      } else if (step === 2) {
        const res = await getBusinessCategoryGroups();
        options = res?.data?.category_groups || (Array.isArray(res) ? res : []);
      } else if (step === 3) {
        const groupId = localStorage.getItem('selected_category_group_id');
        if (groupId) {
          const res = await fetchGroupCategoryBrandList(Number(groupId));
          options = Array.isArray(res) ? res : (res.data || []);
        }
      } else if (step === 5) {
        const res = await getShopTypes();
        options = Array.isArray(res) ? res : (res.data || []);
      }
      setModalOptions(options);
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setIsFetchingModal(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCompanyMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showCompanyMenu || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCompanyMenu, showProfileMenu]);

  // Reset mobile view & sync module
  useEffect(() => {
    const updateModule = () => {
      setMobileView('main');
      const currentModule = navModules.find(mod => {
        if (location.pathname === mod.path) return true;
        return mod.subItems?.some(sub => location.pathname.startsWith(sub.path));
      });
      if (currentModule && onModuleSelect) {
        onModuleSelect(currentModule.id);
      }
    };
    updateModule();
  }, [location.pathname, navModules, onModuleSelect]);

  // Handle Search Expansion
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const handleNavClick = (e: React.MouseEvent, mod: any) => {
    // On mobile, if it has subitems, toggle subview instead of navigating immediately
    if (window.innerWidth <= 1024 && mod.subItems) {
      e.preventDefault();
      setMobileView(mod.id);
    }
  };

  return (
    <nav className="navbar glass">
      {/* Mobile Menu Toggle */}
      <div className="nav-left">
        {!isSidebarOpen && (
          <button className="icon-btn" onClick={toggleSidebar} title="Open Sidebar">
            <MenuIcon size={24} />
          </button>
        )}
      </div>

      {/* Center Navigation - Now with Mobile Sliding View */}
      <div className="nav-center">
        <div className={`nav-slider ${mobileView !== 'main' ? 'show-sub' : ''}`}>
          {/* Main Modules Panel */}
          <div className="nav-panel main-panel">
            {navModules.map((mod) => (
              <div key={mod.id} className="nav-item-dropdown-wrapper">
                <NavLink
                  to={mod.path}
                  className={({ isActive }) => {
                    const isSubItemActive = mod.subItems?.some((sub: any) => location.pathname === sub.path);
                    return `nav-link ${isActive || isSubItemActive ? 'active' : ''}`;
                  }}
                  onClick={(e) => handleNavClick(e, mod)}
                >
                  {mod.label} {mod.subItems && <ChevronDown size={14} className="desktop-only" />}
                </NavLink>

                {/* Desktop Hover Dropdown */}
                {mod.subItems && (
                  <div className="nav-dropdown-menu glass desktop-only">
                    {mod.subItems.map((sub: any, sIdx: number) => (
                      <NavLink key={sIdx} to={sub.path}>{sub.label}</NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sub Items Panel (Mobile Only) */}
          <div className="nav-panel sub-panel">
            <div className="sub-items-horizontal">
              {navModules.find((m: any) => m.id === mobileView)?.subItems?.map((sub: any, sIdx: number) => (
                <NavLink key={sIdx} to={sub.path} className="sub-link-mobile">
                  {sub.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="nav-actions">
        {location.pathname !== '/billing/add-cc' && (
          <>
            <div
              className="company-dropdown-wrapper"
              ref={dropdownRef}
              onMouseEnter={() => setShowCompanyMenu(true)}
              onMouseLeave={() => setShowCompanyMenu(false)}
            >
              <button
                className={`icon-btn company-trigger-btn ${showCompanyMenu ? 'active' : ''}`}
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                title="Active Selection"
              >
                <Building size={20} />
                <span className="company-trigger-name">{selectedBusinessName}</span>
                <ChevronDown size={14} className={`company-trigger-chevron ${showCompanyMenu ? 'open' : ''}`} />
              </button>

              {showCompanyMenu && (
                <div className="company-menu-container">
                  <div className="company-menu active-selection-dropdown">
                    <div className="menu-header active-summary-custom-header">
                      <span>{summaryView === 0 ? 'ACTIVE SELECTION SUMMARY' : 'SWITCH BUSINESS SETUP'}</span>
                    </div>

                    <div className="selection-grid-mini">
                      {summaryView === 0 ? (
                        <>
                          <div className="selection-row-mini selection-card-custom">
                            <div className="row-icon bin"><Building size={16} /></div>
                            <div className="row-content">
                              <span className="row-label">BUSINESS</span>
                              <span className="row-value">{activeNames.business || "Not Selected"}</span>
                            </div>
                          </div>

                          <div className="selection-row-mini selection-card-custom">
                            <div className="row-icon sto"><Store size={16} /></div>
                            <div className="row-content">
                              <span className="row-label">SHOP TYPE</span>
                              <span className="row-value">{activeNames.shop || "Select Store"}</span>
                            </div>
                          </div>

                          <div className="selection-row-mini selection-card-custom">
                            <div className="row-icon cat"><Layers size={16} /></div>
                            <div className="row-content">
                              <span className="row-label">CATEGORY GROUP</span>
                              <span className="row-value">{activeNames.categoryGroup || "None Selected"}</span>
                            </div>
                          </div>

                          {/* <div className="selection-row-mini selection-card-custom">
                            <div className="row-icon cart"><ShoppingCart size={16} /></div>
                            <div className="row-content">
                              <span className="row-label">CATEGORY LIST</span>
                              <span className="row-value">{activeNames.categories || "None Selected"}</span>
                            </div>
                          </div> */}

                          <div className="selection-row-mini selection-card-custom">
                            <div className="row-icon loc"><MapPin size={16} /></div>
                            <div className="row-content">
                              <span className="row-label">STORAGE / BRANCH</span>
                              <span className="row-value">{activeNames.branch || "Not Selected"}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="quick-business-list scrollbar-custom" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {availableBusinesses.filter(b => String(b.id || b.business_id) !== selectedBusinessId).length === 0 ? (
                            <div className="selection-row-mini" style={{ opacity: 0.6 }}>No other businesses available</div>
                          ) : (
                            availableBusinesses
                              .filter(b => String(b.id || b.business_id) !== selectedBusinessId)
                              .map((b, idx) => (
                                <div key={idx} className="selection-row-mini hoverable" onClick={() => handleBusinessSelect(b)}>
                                  <div className="row-icon bin" style={{ background: '#f5f3ff', color: '#7c3aed' }}><Store size={16} /></div>
                                  <div className="row-content">
                                    <span className="row-label">Quick Switch</span>
                                    <span className="row-value">{b.business_name || b.name}</span>
                                  </div>
                                  <ArrowRight size={14} style={{ opacity: 0.4 }} />
                                </div>
                              ))
                          )}
                        </div>
                      )}

                      {summaryView === 0 ? (
                        <button className="swipe-change-static-btn" onClick={() => setSummaryView(1)}>
                          <div className="swipe-icon-circle">
                            <ArrowRight size={18} />
                          </div>
                          <span className="swipe-btn-text">SWIPE TO CHANGE</span>
                        </button>
                      ) : (
                        <button className="swipe-change-static-btn" onClick={() => setSummaryView(0)}>
                          <div className="swipe-icon-circle">
                            <ArrowRight size={18} />
                          </div>
                          <span className="swipe-btn-text">SWIPE TO RETURN</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* <div className="menu-footer">
                      <button className="footer-action primary" onClick={() => { setShowCompanyMenu(false); navigate('/billing/add-cc'); }}>
                        <Plus size={14} /> Add New
                      </button>
                      <button className="footer-action danger">
                        <Trash size={14} /> Delete
                      </button>
                    </div> */}
                </div>
              )}

              {/* Shared Selection Modal for Navbar */}
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
                          <div className="popup-loading">Loading items...</div>
                        ) : isSwitchingBusiness ? (
                          <div className="popup-loading">
                            <Loader2 size={20} className="nav-spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                            Switching business...
                          </div>
                        ) : modalOptions.length === 0 ? (
                          <div className="popup-empty">No items available.</div>
                        ) : (
                          modalOptions
                            .filter((opt: any) => {
                              const name = opt.business_name || opt.operation_name || opt.category_group_name || opt.category_name || opt.name || opt.branch_name || "";
                              return name.toLowerCase().includes(modalSearch.toLowerCase());
                            })
                            .map((opt: any, idx: number) => {
                              const id = opt.id || opt.business_id || opt.operation_id || opt.category_group_id || opt.category_id || opt.branch_id || idx;
                              const name = opt.business_name || opt.operation_name || opt.category_group_name || opt.category_name || opt.name || opt.branch_name || "Unnamed Item";

                              // Step-specific Selection Highlighting
                              let isSelected = false;
                              if (activeModal.type === 1) { // Business
                                isSelected = String(id) === selectedBusinessId;
                              } else if (activeModal.type === 6) { // Shop Type
                                // Handle multi-select for shops
                                const storedNames = JSON.parse(localStorage.getItem('shop_names') || '[]');
                                let isCurrentlySelected = false;

                                if (Array.isArray(storedNames)) {
                                  isCurrentlySelected = storedNames.includes(name);
                                } else {
                                  const rawName = localStorage.getItem('shop_name') || "";
                                  isCurrentlySelected = name === rawName || rawName.split(", ").includes(name);
                                }

                                if (!isCurrentlySelected) {
                                  const storedIds = JSON.parse(localStorage.getItem('selected_shop_ids') || '[]');
                                  isCurrentlySelected = storedIds.includes(String(id)) || storedIds.includes(Number(id));
                                }

                                isSelected = isCurrentlySelected;
                              } else if (activeModal.type === 2) { // Category Group (Multi-select)
                                const storedNames = JSON.parse(localStorage.getItem('selected_category_group_names') || '[]');
                                isSelected = storedNames.includes(name);

                                // Alternative Check by ID
                                if (!isSelected) {
                                  const storedIds = JSON.parse(localStorage.getItem('selected_category_group_id') || '[]');
                                  isSelected = storedIds.includes(String(id));
                                }
                              } else if (activeModal.type === 3) { // Categories (Multi-select)
                                const storedCatIds = JSON.parse(localStorage.getItem('selected_category_ids') || '[]');
                                isSelected = storedCatIds.includes(Number(id)) || storedCatIds.includes(String(id));
                              } else if (activeModal.type === 5) { // Branch
                                isSelected = name === activeNames.branch;
                              }

                              return { opt, id, name, isSelected };
                            })
                            // Sort: Selected items first
                            .sort((a, b) => (b.isSelected ? 1 : 0) - (a.isSelected ? 1 : 0))
                            .map(({ opt, id, name, isSelected }) => (
                              <div key={id} className={`popup-list-item ${isSelected ? 'selected' : ''}`} onClick={() => {
                                if (activeModal.type === 1) {
                                  // Direct business switch
                                  handleBusinessSelect(opt);
                                } else {
                                  // For other types, navigate to setup
                                  setActiveModal(null);
                                  navigate('/new-user-setup', { state: { resumeStep: activeModal.type } });
                                }
                              }}>
                                <span className="item-txt">{name}</span>
                                {isSelected && <Check size={16} className="item-check" />}
                              </div>
                            ))
                        )}
                      </div>

                      <div className="popup-footer">
                        <button
                          className="popup-setup-btn"
                          onClick={() => {
                            if (isSwitchingBusiness) return;
                            setActiveModal(null);
                            // If it's a legacy setup step, navigate to setup flow
                            if (activeModal.type !== 1) {
                              navigate('/new-user-setup', { state: { resumeStep: activeModal.type } });
                            }
                          }}
                          disabled={isSwitchingBusiness}
                        >
                          {isSwitchingBusiness ? 'Switching...' : 'Update in Setup'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`search-bar-container ${isSearchExpanded ? 'expanded' : ''}`}>
              <button className="icon-btn search-trigger" onClick={toggleSearch}>
                {isSearchExpanded ? <X size={18} /> : <Search size={18} />}
              </button>
              <div className="search-input-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, invoices..."
                  onBlur={() => { if (!searchInputRef.current?.value) setIsSearchExpanded(false); }}
                />
              </div>
            </div>
          </>
        )}

        {/* Global Selection Details Modal */}
        {showFullDetails && (
          <div className="popup-overlay full-details-overlay" onClick={() => setShowFullDetails(false)}>
            <div className="popup-container full-selection-details" onClick={e => e.stopPropagation()}>
              <div className="popup-header">
                <h3 className="popup-label">Overall Selection Summary</h3>
                <button className="close-pop-btn" onClick={() => setShowFullDetails(false)}>&times;</button>
              </div>
              <div className="full-details-scroll scrollbar-custom">
                <div className="full-details-grid">
                  <div className="full-detail-card">
                    <div className="detail-header-card"><Building size={16} /> <span>Business</span></div>
                    <div className="detail-body-card">{activeNames.business}</div>
                  </div>
                  <div className="full-detail-card">
                    <div className="detail-header-card"><Store size={16} /> <span>Shop Type</span></div>
                    <div className="detail-body-card">{activeNames.shop}</div>
                  </div>
                  <div className="full-detail-card">
                    <div className="detail-header-card"><Layers size={16} /> <span>Category Group</span></div>
                    <div className="detail-body-card">{activeNames.categoryGroup}</div>
                  </div>
                  <div className="full-detail-card">
                    <div className="detail-header-card"><ShoppingCart size={16} /> <span>Category List</span></div>
                    <div className="detail-body-card">{activeNames.categories}</div>
                  </div>
                  <div className="full-detail-card">
                    <div className="detail-header-card"><MapPin size={16} /> <span>Storage / Branch</span></div>
                    <div className="detail-body-card">{activeNames.branch}</div>
                  </div>
                  <div className="full-detail-card">
                    <div className="detail-header-card"><Activity size={16} /> <span>Business Mode</span></div>
                    <div className="detail-body-card">{activeNames.mode}</div>
                  </div>
                  <div className="full-detail-card">
                    <div className="detail-header-card"><Check size={16} /> <span>Modules</span></div>
                    <div className="detail-body-card">{activeNames.modules}</div>
                  </div>
                  <div className="full-detail-card">
                    <div className="detail-header-card"><Activity size={16} /> <span>Brands</span></div>
                    <div className="detail-body-card">{activeNames.brands}</div>
                  </div>
                </div>
              </div>
              <div className="popup-footer">
                <button className="popup-setup-btn secondary" onClick={() => setShowFullDetails(false)}>Close</button>
                <button className="popup-setup-btn" onClick={() => { setShowFullDetails(false); navigate('/new-user-setup'); }}>
                  Modify Setup
                </button>
              </div>
            </div>
          </div>
        )}

        <NotificationMenu />
        <button className="icon-btn">
          <Moon size={20} />
        </button>
        <div className="user-profile" ref={profileMenuRef}>
          <div className="avatar" onClick={() => setShowProfileMenu(!showProfileMenu)}>JD</div>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-header-info">
                <div className="info-avatar">JD</div>
                <div className="info-text">
                  <span className="info-email">admin@billing.com</span>
                  <span className="info-role">Administrator</span>
                </div>
              </div>
              <div className="profile-menu-items">
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); navigate('/business-admin'); }}>
                  <User size={18} />
                  <span>Profile</span>
                </div>
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); navigate('/business-setup'); }}>
                  <Building size={18} />
                  <span>Business Setup</span>
                </div>
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); navigate('/business-select'); }}>
                  <MapPin size={18} />
                  <span>Switch Business</span>
                </div>
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); handleLevelChange(6, "Select Shop Type"); }}>
                  <Store size={18} />
                  <span>Store</span>
                </div>
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); handleLevelChange(1, "Select Business"); }}>
                  <Building size={18} />
                  <span>Company</span>
                </div>
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); handleLevelChange(5, "Select Storage / Branch"); }}>
                  <MapPin size={18} />
                  <span>Branch</span>
                </div>
              </div>
              <div className="profile-footer-action">
                <button className="profile-logout-btn" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </nav >
  );
};

export default Navbar;
