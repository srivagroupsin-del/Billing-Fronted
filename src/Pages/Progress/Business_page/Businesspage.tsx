import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, ChevronRight, Search } from "lucide-react";
import "./Businesspage.css";

import { selectBusiness } from "../../../api/auth";

interface Business {
    id: number;
    name: string;
    category: string;
    owner: string;
    location: string;
}

const businessData: Business[] = [
    { id: 1, name: "Tech World", category: "Electronics", owner: "Arun", location: "Chennai" },
    { id: 2, name: "Fresh Mart", category: "Grocery", owner: "Kumar", location: "Coimbatore" },
    { id: 3, name: "Style Hub", category: "Fashion", owner: "Rahul", location: "Madurai" },
    { id: 4, name: "Laptop Zone", category: "Electronics", owner: "Vijay", location: "Salem" },
];

const BusinessPage: React.FC<{ onSelect?: () => void }> = ({ onSelect }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const categories = useMemo(() => {
        return ["All Categories", ...new Set(businessData.map(b => b.category))];
    }, []);

    const [selectedCategory, setSelectedCategory] = useState("All Categories");

    const filteredBusinesses = useMemo(() => {
        return businessData.filter((business) =>
            business.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedCategory === "All Categories" || business.category === selectedCategory)
        );
    }, [searchTerm, selectedCategory]);

    const handleSelectBusiness = async (business: Business) => {
        try {
            console.log(`🔌 [SelectBusiness] Calling API for ID: ${business.id}`);
            const response = await selectBusiness({ business_id: business.id });

            // Store new token and business_id for app-wide usage
            if (response.token) {
                localStorage.setItem("token", response.token);
                console.log("🎟️ [SelectBusiness] New JWT token stored.");
            }

            localStorage.setItem("business_id", business.id.toString());
            localStorage.setItem("business_name", business.name);

            if (onSelect) onSelect();
            navigate("/progress/select-category", { state: { business } });
        } catch (error) {
            console.error("❌ [SelectBusiness] API Error:", error);
            alert("Failed to select business. Proceeding anyway (Mock)...");
            // Still navigate in mock mode for development convenience
            localStorage.setItem("business_id", business.id.toString());
            localStorage.setItem("business_name", business.name);
            navigate("/progress/select-category", { state: { business } });
        }
    };

    return (
        <div className="business-page">
            <div className="business-container glass">
                <header className="business-header">
                    <div className="header-content">
                        <h2 className="page-title">Select Business</h2>
                        <p className="page-subtitle">
                            Search and choose the business you want to manage
                        </p>
                    </div>
                </header>

                {/* 🔍 Search Section */}
                <div className="filter-section">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search business by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="dropdown-box">
                        <select
                            className="business-select-dropdown"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Business Cards */}
                <div className="card-container">
                    {filteredBusinesses.length > 0 ? (
                        filteredBusinesses.map((business) => (
                            <div
                                key={business.id}
                                className="business-card glass-hover"
                                onClick={() => handleSelectBusiness(business)}
                            >
                                <div className="card-top">
                                    <div className="business-icon">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="business-main-info">
                                        <h3>{business.name}</h3>
                                        <span className="category-text">
                                            {business.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-details">
                                    <div className="detail-item">
                                        <MapPin size={16} />
                                        <span>{business.location}</span>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <button
                                        className="select-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectBusiness(business);
                                        }}
                                    >
                                        Select Business <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data-container">
                            <p className="no-data">
                                No Businesses Found matching your search.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessPage;
