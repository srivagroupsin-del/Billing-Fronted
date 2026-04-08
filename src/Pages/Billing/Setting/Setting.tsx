import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdStore, MdPerson, MdLocationOn, MdArrowBack, MdLogout, MdLayers } from "react-icons/md";
import { getBusinesses } from "../../../api/business"; // Import API
import "./Setting.css";

const ProfileCard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState("main");

    useEffect(() => {
        if (location.state && location.state.view) {
            setView(location.state.view);
        }
    }, [location.state]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/logged-out");
    };
    const [showStorePop, setShowStorePop] = useState(false);
    const [selectedStore, setSelectedStore] = useState("");
    const [showCustomerPop, setShowCustomerPop] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [showLocationPop, setShowLocationPop] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("");

    // State for user info
    const [userData, setUserData] = useState<any>(null);

    // State for dynamic data
    const [businessList, setBusinessList] = useState<any[]>([]);
    const [storeMap, setStoreMap] = useState<Record<string, string>>({});

    useEffect(() => {
        // Load user info from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }

        const syncSelection = () => {
            const storedBilling = localStorage.getItem('selectedBilling');
            if (storedBilling) {
                const selection = JSON.parse(storedBilling);
                if (selection.company) setSelectedCustomer(selection.company);
                if (selection.store) setSelectedStore(selection.store);
                if (selection.location) setSelectedLocation(selection.location);
            }
        };

        syncSelection();
        window.addEventListener('billingSelectionChanged', syncSelection);

        const fetchBusinesses = async () => {
            try {
                const data = await getBusinesses();
                if (data && data.length > 0) {
                    setBusinessList(data);

                    // Creates a map of id -> name for easier lookup
                    const map: Record<string, string> = {};
                    data.forEach((bus: any) => {
                        map[bus.id] = bus.business_name;
                    });
                    setStoreMap(map);

                    // Only set default if nothing is selected yet
                    const storedBilling = localStorage.getItem('selectedBilling');
                    if (!storedBilling && !selectedStore) {
                        setSelectedStore(String(data[0].id));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch businesses", error);
            }
        };

        fetchBusinesses();

        return () => {
            window.removeEventListener('billingSelectionChanged', syncSelection);
        };
    }, []);

    const storeList = [
        { id: "store1", name: "Online Store" },
        { id: "store2", name: "Shop" },
        { id: "store3", name: "Local Door Delivery" },
        { id: "store4", name: "Import" },
        { id: "store5", name: "Export" },
    ];

    const storeMapGlobal: Record<string, string> = {
        store1: "Online Store",
        store2: "Shop",
        store3: "Local Door Delivery",
        store4: "Import",
        store5: "Export",
    };

    const branchList = [
        "Gandhipuram",
        "Ukkadam",
        "Neelambur"
    ];





    const handleStoreChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedStore(e.target.value);
    };

    const handleCustomerChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedCustomer(e.target.value);
    };

    const handleLocationChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedLocation(e.target.value);
    };

    return (
        <>
            <div className="profile-card">
                <div className="profile-header">
                    <div className="avatar"></div>
                    <div className="profile-info">
                        <span className="email">{userData?.email || "admin@billing.com"}</span>
                        <p className="user-role">{userData?.name || "Administrator"}</p>
                    </div>
                </div>

                <hr />

                <div className="profile-menu">
                    {view === "main" ? (
                        <>
                            <p onClick={() => setView("store")}>
                                <MdStore className="menu-icon" /> Store
                            </p>
                            <p onClick={() => setView("customer")}>
                                <MdPerson className="menu-icon" /> Company
                            </p>
                            <p onClick={() => setView("Branch")}>
                                <MdLocationOn className="menu-icon" /> Branch
                            </p>
                            <p onClick={() => navigate('/product-setup')}>
                                <MdLayers className="menu-icon" /> Product Setup
                            </p>
                        </>
                    ) : view === "store" ? (
                        <div className="sub-menu-container">
                            <div className="menu-header">
                                <button className="back-link" onClick={() => setView("main")}>
                                    <MdArrowBack /> Back
                                </button>
                            </div>
                            <div className="selection-display">
                                <div className="display-info">
                                    <MdStore className="display-icon" />
                                    <span className="display-name">{storeMapGlobal[selectedStore] || "Select Store"}</span>
                                </div>
                                <button className="change-trigger-btn" onClick={() => setShowStorePop(true)}>
                                    Change
                                </button>
                            </div>
                        </div>
                    ) : view === "customer" ? (
                        <div className="sub-menu-container">
                            <div className="menu-header">
                                <button className="back-link" onClick={() => setView("main")}>
                                    <MdArrowBack /> Back
                                </button>
                            </div>
                            <div className="selection-display">
                                <div className="display-info">
                                    <MdPerson className="display-icon" />
                                    <span className="display-name">{storeMap[selectedCustomer] || "Select Company"}</span>
                                </div>
                                <button className="change-trigger-btn" onClick={() => setShowCustomerPop(true)}>
                                    Change
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sub-menu-container">
                            <div className="menu-header">
                                <button className="back-link" onClick={() => setView("main")}>
                                    <MdArrowBack /> Back
                                </button>
                            </div>
                            <div className="selection-display">
                                <div className="display-info">
                                    <MdLocationOn className="display-icon" />
                                    <span className="display-name">{selectedLocation || "Select Location"}</span>
                                </div>
                                <button className="change-trigger-btn" onClick={() => setShowLocationPop(true)}>
                                    Change
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <hr />

                <div className="profile-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <MdLogout style={{ marginRight: '8px' }} /> Logout
                    </button>
                </div>
            </div>

            {/* Store Pop */}
            {showStorePop && (
                <div className="popup-overlay" onClick={() => setShowStorePop(false)}>
                    <div className="popup-container" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-content">
                            <div className="popup-header">
                                <label className="popup-label">Store</label>
                                <button className="close-pop-btn" onClick={() => setShowStorePop(false)}>&times;</button>
                            </div>
                            <select
                                className="popup-select"
                                value={selectedStore}
                                onChange={handleStoreChange}
                            >
                                <option value="">-- Select Store --</option>
                                {storeList.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <div className="popup-actions">
                                <button className="apply-btn" onClick={() => setShowStorePop(false)}>Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Pop */}
            {showCustomerPop && (
                <div className="popup-overlay" onClick={() => setShowCustomerPop(false)}>
                    <div className="popup-container" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-content">
                            <div className="popup-header">
                                <label className="popup-label">Company</label>
                                <button className="close-pop-btn" onClick={() => setShowCustomerPop(false)}>&times;</button>
                            </div>
                            <select
                                className="popup-select"
                                value={selectedCustomer}
                                onChange={handleCustomerChange}
                            >
                                <option value="">-- Select Company --</option>
                                {businessList.map((bus) => (
                                    <option key={bus.id} value={bus.id}>
                                        {bus.business_name}
                                    </option>
                                ))}
                            </select>
                            <div className="popup-actions">
                                <button className="apply-btn" onClick={() => setShowCustomerPop(false)}>Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Pop */}
            {showLocationPop && (
                <div className="popup-overlay" onClick={() => setShowLocationPop(false)}>
                    <div className="popup-container" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-content">
                            <div className="popup-header">
                                <label className="popup-label">Branch</label>
                                <button className="close-pop-btn" onClick={() => setShowLocationPop(false)}>&times;</button>
                            </div>
                            <select
                                className="popup-select"
                                value={selectedLocation}
                                onChange={handleLocationChange}
                            >
                                <option value="">-- Select Location --</option>
                                {branchList.map((loc) => (
                                    <option key={loc} value={loc}>
                                        {loc}
                                    </option>
                                ))}
                            </select>
                            <div className="popup-actions">
                                <button className="apply-btn" onClick={() => setShowLocationPop(false)}>Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileCard;
