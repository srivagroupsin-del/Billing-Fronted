import { useState } from "react";
import { Search, ChevronDown, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./MobilePhones.css";

interface MobilePhone {
    id: number;
    name: string;
    icon: string;
}

const mobilePhones: MobilePhone[] = [
    { id: 1, name: "New Phone", icon: "📱" },
    { id: 2, name: "Service", icon: "📞" },
    { id: 3, name: "Refurbished Phone", icon: "♻️" },
    { id: 4, name: "Accessories", icon: "🎮" },
];

const MobilePhones = () => {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const navigate = useNavigate();

    const filteredPhones = mobilePhones.filter((phone) =>
        phone.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCardClick = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (selectedIds.length === 0) {
            alert("Please select at least one category.");
            return;
        }

        const selectedNames = mobilePhones
            .filter(p => selectedIds.includes(p.id))
            .map(p => p.name);

        // Save selected categories
        localStorage.setItem("selected_mobile_types", JSON.stringify(selectedNames));

        // Navigate to Checking
        navigate("/progress/checking");
    };

    return (
        <div className="mobile-page">
            <div className="mobile-container">
                <h1 className="page-title">Select Mobile Category</h1>
                <p className="page-subtitle">
                    Choose a type of <strong>Mobile Phone</strong> to proceed to your dashboard
                </p>

                {/* Search + Dropdown */}
                <div className="filter-row">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search mobile type..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="dropdown-box">
                        <span>All Types</span>
                        <ChevronDown size={18} />
                    </div>
                </div>

                {/* Mobile Grid */}
                <div className="mobile-grid">
                    {filteredPhones.map((phone) => (
                        <div
                            key={phone.id}
                            className={`mobile-card ${selectedIds.includes(phone.id) ? "selected" : ""}`}
                            onClick={() => handleCardClick(phone.id)}
                        >
                            <div className="card-selection-indicator">
                                {selectedIds.includes(phone.id) && (
                                    <CheckCircle2 size={24} className="check-icon" />
                                )}
                            </div>
                            <div className="mobile-icon-box">{phone.icon}</div>
                            <h3>{phone.name}</h3>
                            <p className="mobile-type">Mobile Phone Category</p>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="footer-action-container">
                    <button
                        className={`continue-dashboard-btn ${selectedIds.length > 0 ? "active" : ""}`}
                        onClick={handleContinue}
                        disabled={selectedIds.length === 0}
                    >
                        Continue to Dashboard <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobilePhones;