import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, ArrowLeft, PackagePlus, Package, Receipt, CreditCard, ShoppingCart, Wrench } from "lucide-react";
import { getBusinesses, getBusinessActivityConfig } from "../../../api/business";
import { selectBusiness } from "../../../api/auth";
import "./checking.css";

const Dashboard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<"business" | "mode" | "dashboard">("business");
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<{ id: number; name: string } | null>(null);
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const busData = await getBusinesses();
                if (Array.isArray(busData)) {
                    setBusinesses(busData);
                } else if (busData?.data && Array.isArray(busData.data)) {
                    setBusinesses(busData.data);
                }
            } catch (error) {
                console.error("Failed to fetch businesses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleBusinessSelect = async (business: any) => {
        const id = business.id || business.business_id;
        const name = business.name || business.business_name;
        setSelectedBusiness({ id, name });

        setLoading(true);
        try {
            // Select business to get token
            const response = await selectBusiness({ business_id: id });
            if (response.token || response?.data?.token) {
                localStorage.setItem("token", response.token || response?.data?.token);
                localStorage.setItem("business_id", String(id));
            }

            // Fetch configured activities for this specific business
            const activityData = await getBusinessActivityConfig();
            let itemList = [];
            if (Array.isArray(activityData)) {
                itemList = activityData;
            } else if (activityData?.data && Array.isArray(activityData.data)) {
                itemList = activityData.data;
            } else if (activityData?.data?.activities) {
                // In case the config returns an object with nested activities
                itemList = activityData.data.activities;
            }

            setActivities(itemList);
            setStep("mode");
        } catch (error) {
            console.error("Failed to select business or fetch activities config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModeSelect = (mode: string) => {
        setSelectedMode(mode);
        setStep("dashboard");
    };

    const goBack = () => {
        if (step === "mode") setStep("business");
        if (step === "dashboard") setStep("mode");
    };

    const getActivityIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("sale")) return <ShoppingCart size={48} />;
        if (lower.includes("service")) return <Wrench size={48} />;
        return <Package size={48} />;
    };

    const getActivityColor = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("sale")) return "#007bff";
        if (lower.includes("service")) return "#28a745";
        return "#6c757d";
    };

    if (step === "business") {
        return (
            <div className="selection-container">
                <div className="selection-header">
                    <h2>Select Business</h2>
                    <p>Select the business you want to access today</p>
                </div>
                {loading && <div className="loading-overlay">Loading...</div>}
                <div className="selection-grid">
                    {businesses.map((b) => (
                        <div key={b.id || b.business_id} className="selection-card" onClick={() => handleBusinessSelect(b)}>
                            <div className="selection-icon-wrapper">
                                <Building2 size={24} />
                            </div>
                            <div className="selection-info">
                                <h3>{b.name || b.business_name}</h3>
                                <span>{b.type || b.business_type || "Business"}</span>
                            </div>
                            <ChevronRight className="chevron" />
                        </div>
                    ))}
                    {businesses.length === 0 && !loading && <p>No businesses found.</p>}
                </div>
            </div>
        );
    }

    if (step === "mode") {
        return (
            <div className="selection-container">
                <div className="selection-header">
                    <button className="back-btn" onClick={goBack}><ArrowLeft size={20} /> Back</button>
                    <h2>Select Business Mode</h2>
                    <p>Choose your preferred mode for <strong>{selectedBusiness?.name}</strong></p>
                </div>
                <div className="mode-grid">
                    {activities.map((m) => {
                        const name = m.business_activity_name || m.name || "Activity";
                        const id = m.business_activity_id || m.id;
                        return (
                            <div key={id} className="mode-card">
                                <div className="mode-icon-api" style={{ color: getActivityColor(name) }}>
                                    {getActivityIcon(name)}
                                </div>
                                <h3>{name}</h3>
                                <p>{m.description || `Manage your ${name.toLowerCase()} operations`}</p>
                                <button
                                    className="select-btn"
                                    style={{ backgroundColor: getActivityColor(name) }}
                                    onClick={() => handleModeSelect(name)}
                                >
                                    Select
                                </button>
                            </div>
                        );
                    })}
                    {activities.length === 0 && <p>No activities found for this business.</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-top">
                <button className="back-btn" onClick={goBack}><ArrowLeft size={18} /> Change Details</button>
                <div className="current-selection-info">
                    <strong>{selectedBusiness?.name}</strong> • {selectedMode}
                </div>
            </div>

            <h2 className="dashboard-title">Dashboard</h2>

            <div className="card-grid">
                {/* Product Entry Card */}
                <div className="dashboard-card" onClick={() => navigate("/add-product")}>
                    <div className="card-icon product-entry">
                        <PackagePlus size={48} />
                    </div>
                    <h3>Product Entry</h3>
                    <p>Manage and add new products to your inventory.</p>
                </div>

                {/* Order Checking Card */}
                <div className="dashboard-card" onClick={() => navigate("/order-checking")}>
                    <div className="card-icon order-checking">
                        <Package size={48} />
                    </div>
                    <h3>Order Checking</h3>
                    <p>Verify and track placed orders easily.</p>
                </div>

                {/* Billing Card */}
                <div className="dashboard-card" onClick={() => navigate("/billing/create")}>
                    <div className="card-icon billing">
                        <Receipt size={48} />
                    </div>
                    <h3>Billing</h3>
                    <p>Generate invoices and manage billing.</p>
                </div>

                {/* Payment Card */}
                <div className="dashboard-card" onClick={() => navigate("/payment")}>
                    <div className="card-icon payment">
                        <CreditCard size={48} />
                    </div>
                    <h3>Payment</h3>
                    <p>Manage and process customer payments.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
