import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBusinesses, saveBusinessSetup, getShopTypes, type BusinessSetupPayload } from "../../api/business";
import { selectBusiness } from "../../api/auth";
import { Briefcase, Store, ShoppingCart, Wrench, ArrowRight, ArrowLeft, Check, Globe, Package, Truck, Ship } from "lucide-react";
import "./Manage_login.css";

// Icons for shop operations (fallback mapping)
const SHOP_ICONS: Record<string, any> = {
    "local": Store,
    "online": Globe,
    "wholesale": Package,
    "import": Ship,
    "export": Truck,
};

const getShopIcon = (name: string) => {
    const lower = name.toLowerCase();
    for (const key of Object.keys(SHOP_ICONS)) {
        if (lower.includes(key)) return SHOP_ICONS[key];
    }
    return Store;
};

const ICON_COLORS = ["blue", "green", "purple", "orange", "rose"];

const ManageLogin = () => {
    const navigate = useNavigate();

    // Data
    const [businessList, setBusinessList] = useState<any[]>([]);
    const [shopOperations, setShopOperations] = useState<any[]>([]);

    // Step flow
    const [currentStep, setCurrentStep] = useState(1);

    // Selections
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
    const [selectedBusinessName, setSelectedBusinessName] = useState<string>("");
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [selectedShopName, setSelectedShopName] = useState<string>("");
    const [isSalesSelected, setIsSalesSelected] = useState(false);
    const [isServiceSelected, setIsServiceSelected] = useState(false);;

    // Loading & Toast
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Fetch businesses on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const busResponse = await getBusinesses();
                if (Array.isArray(busResponse)) {
                    setBusinessList(busResponse);
                } else if (busResponse?.data && Array.isArray(busResponse.data)) {
                    setBusinessList(busResponse.data);
                }
            } catch (error) {
                console.error("❌ Failed to fetch businesses:", error);
            }
        };
        fetchData();
    }, []);

    // ===================== STEP 1: Select Business =====================
    const handleBusinessSelect = (business: any) => {
        const id = String(business.id || business.business_id);
        const name = business.business_name || business.name || "Unnamed Business";
        setSelectedBusinessId(id);
        setSelectedBusinessName(name);
    };

    const handleBusinessContinue = async () => {
        if (!selectedBusinessId) return;

        setIsLoading(true);
        try {
            console.log(`🔌 [ManageLogin] Step 1: Selecting Business ID: ${selectedBusinessId}`);
            const response = await selectBusiness({ business_id: selectedBusinessId });

            // Store business_id
            localStorage.setItem("business_id", selectedBusinessId);

            // Replace login token with business token
            const businessToken = response.token || response?.data?.token;
            if (businessToken) {
                localStorage.setItem("token", businessToken);
                console.log("🎟️ [ManageLogin] Business token saved");
            }

            // Fetch shop types for step 2
            const opsResponse = await getShopTypes();
            if (Array.isArray(opsResponse)) {
                setShopOperations(opsResponse);
            } else if (opsResponse?.data && Array.isArray(opsResponse.data)) {
                setShopOperations(opsResponse.data);
            }

            showToast(`Business "${selectedBusinessName}" selected`, "success");
            setCurrentStep(2);
        } catch (error: any) {
            console.error("❌ [SelectBusiness] API Error:", error);
            showToast("Failed to select business: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ===================== STEP 2: Select Shop =====================
    const handleShopSelect = (shop: any) => {
        const id = String(shop.id || shop.operation_id);
        const name = shop.operation_name || shop.name || "Unnamed Shop";
        setSelectedShopId(id);
        setSelectedShopName(name);
    };

    const handleShopContinue = () => {
        if (!selectedShopId) return;
        showToast(`Shop "${selectedShopName}" selected`, "success");
        setCurrentStep(3);
    };

    // ===================== STEP 3: Select Mode & Save =====================
    const handleFinalSave = async () => {
        if (!isSalesSelected && !isServiceSelected) return;

        setIsLoading(true);
        try {
            const moduleItemIds = [
                ...(isSalesSelected ? [1] : []),
                ...(isServiceSelected ? [4] : [])
            ];

            const payload: BusinessSetupPayload = {
                shopTypeIds: [Number(selectedShopId) || 1],
                moduleItemIds: moduleItemIds.length > 0 ? moduleItemIds : [1],
                categoryGroupIds: [1], // Defaulting based on assumed flow since ManageLogin skips full setup
                categoryIds: [1],
                brandIds: [1]
            };

            console.log("🚀 [ManageLogin] Final Save Payload:", payload);
            await saveBusinessSetup(payload);

            showToast("Setup completed successfully!", "success");
            setTimeout(() => navigate("/analytics"), 1000);
        } catch (error: any) {
            console.error("❌ [ManageLogin] Setup failed:", error);
            showToast("Setup failed: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ===================== STEP INDICATOR HELPERS =====================
    const getStepClass = (step: number) => {
        if (step < currentStep) return "completed";
        if (step === currentStep) return "active";
        return "";
    };

    // ===================== RENDER =====================
    return (
        <div className="manage-container">
            <div className="manage-wrapper">

                {/* Step Progress Bar */}
                <div className="step-progress">
                    <div className={`step-indicator ${getStepClass(1)}`}>
                        <span className="step-num">{currentStep > 1 ? <Check size={14} /> : "1"}</span>
                        Business
                    </div>
                    <div className={`step-connector ${currentStep > 1 ? "completed" : ""}`} />
                    <div className={`step-indicator ${getStepClass(2)}`}>
                        <span className="step-num">{currentStep > 2 ? <Check size={14} /> : "2"}</span>
                        Shop
                    </div>
                    <div className={`step-connector ${currentStep > 2 ? "completed" : ""}`} />
                    <div className={`step-indicator ${getStepClass(3)}`}>
                        <span className="step-num">3</span>
                        Mode
                    </div>
                </div>

                {/* ======= STEP 1: Business Selection ======= */}
                {currentStep === 1 && (
                    <div className="step-panel" key="step1">
                        <div className="step-header">
                            <h2>Select Your Business</h2>
                            <p>Choose the business you want to configure</p>
                        </div>

                        <div className="selection-grid">
                            {businessList.map((biz, index) => {
                                const id = String(biz.id || biz.business_id);
                                const name = biz.business_name || biz.name || "Unnamed Business";
                                const desc = biz.description || biz.business_type || "Business";
                                return (
                                    <div
                                        key={id}
                                        className={`selection-card ${selectedBusinessId === id ? "selected" : ""}`}
                                        onClick={() => handleBusinessSelect(biz)}
                                    >
                                        <div className={`card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                            <Briefcase size={22} />
                                        </div>
                                        <div className="card-title">{name}</div>
                                        <div className="card-subtitle">{desc}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {businessList.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                Loading businesses...
                            </p>
                        )}

                        <div className="step-actions">
                            <div />
                            <div className="step-actions-right">
                                <button
                                    className="btn-step btn-primary"
                                    disabled={!selectedBusinessId || isLoading}
                                    onClick={handleBusinessContinue}
                                >
                                    {isLoading ? (
                                        <><div className="spinner" /> Connecting...</>
                                    ) : (
                                        <>Save & Continue <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 2: Shop Selection ======= */}
                {currentStep === 2 && (
                    <div className="step-panel" key="step2">
                        <div className="step-header">
                            <h2>Select Shop</h2>
                            <p>Choose the shop type for your business</p>
                        </div>

                        <div className="selected-badge">
                            <span className="badge-icon">🏢</span>
                            {selectedBusinessName}
                            <span className="badge-change" onClick={() => { setCurrentStep(1); setSelectedShopId(""); setSelectedShopName(""); setIsSalesSelected(false); setIsServiceSelected(false); }}>
                                Change
                            </span>
                        </div>

                        <div className="selection-grid">
                            {shopOperations.map((shop, index) => {
                                const id = String(shop.id || shop.operation_id);
                                const name = shop.operation_name || shop.name || "Unnamed Shop";
                                const location = shop.location || shop.description || "";
                                const IconComponent = getShopIcon(name);
                                return (
                                    <div
                                        key={id}
                                        className={`selection-card ${selectedShopId === id ? "selected" : ""}`}
                                        onClick={() => handleShopSelect(shop)}
                                    >
                                        <div className={`card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                            <IconComponent size={22} />
                                        </div>
                                        <div className="card-title">{name}</div>
                                        {location && <div className="card-subtitle">{location}</div>}
                                    </div>
                                );
                            })}
                        </div>

                        {shopOperations.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                Loading shops...
                            </p>
                        )}

                        <div className="step-actions">
                            <button className="btn-step btn-secondary" onClick={() => { setCurrentStep(1); setSelectedShopId(""); setSelectedShopName(""); setIsSalesSelected(false); setIsServiceSelected(false); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="step-actions-right">
                                <button
                                    className="btn-step btn-primary"
                                    disabled={!selectedShopId}
                                    onClick={handleShopContinue}
                                >
                                    Save & Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 3: Business Mode ======= */}
                {currentStep === 3 && (
                    <div className="step-panel" key="step3">
                        <div className="step-header">
                            <h2>Select Business Mode</h2>
                            <p>Choose how you want to operate this business</p>
                        </div>

                        <div className="selected-badge">
                            <span className="badge-icon">🏢</span>
                            {selectedBusinessName}
                            <span style={{ margin: "0 6px", color: "#cbd5e1" }}>→</span>
                            <span className="badge-icon">🏬</span>
                            {selectedShopName}
                            <span className="badge-change" onClick={() => { setCurrentStep(2); setIsSalesSelected(false); setIsServiceSelected(false); }}>
                                Change
                            </span>
                        </div>

                        <div className="mode-grid">
                            <div
                                className={`mode-card ${isSalesSelected ? "selected" : ""}`}
                                onClick={() => setIsSalesSelected(!isSalesSelected)}
                            >
                                <div className="mode-icon sales">
                                    <ShoppingCart size={28} />
                                </div>
                                <div className="mode-title">Sales</div>
                                <div className="mode-desc">Manage product sales, invoices, and customer transactions</div>
                            </div>

                            <div
                                className={`mode-card ${isServiceSelected ? "selected" : ""}`}
                                onClick={() => setIsServiceSelected(!isServiceSelected)}
                            >
                                <div className="mode-icon service">
                                    <Wrench size={28} />
                                </div>
                                <div className="mode-title">Service</div>
                                <div className="mode-desc">Handle repair services, maintenance, and service orders</div>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn-step btn-secondary" onClick={() => { setCurrentStep(2); setIsSalesSelected(false); setIsServiceSelected(false); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="step-actions-right">
                                <button
                                    className="btn-step btn-primary"
                                    disabled={(!isSalesSelected && !isServiceSelected) || isLoading}
                                    onClick={handleFinalSave}
                                >
                                    {isLoading ? (
                                        <><div className="spinner" /> Saving...</>
                                    ) : (
                                        <>Complete Setup <Check size={16} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === "success" ? "✅" : "❌"} {toast.message}
                </div>
            )}
        </div>
    );
};

export default ManageLogin;
