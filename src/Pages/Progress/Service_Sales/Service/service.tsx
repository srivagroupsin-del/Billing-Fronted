import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import "./service.css";

const ServicePage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const categories = [
        { id: "Authorization", name: "Authorization", icon: "https://cdn-icons-png.flaticon.com/512/3064/3064197.png" },
        { id: "Multi Chip Level", name: "Multi Chip Level", icon: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png" },
        { id: "Multi Brand", name: "Multi Brand", icon: "https://cdn-icons-png.flaticon.com/512/731/731985.png" }
    ];

    const handleCardClick = (id: string) => {
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
        navigate("/progress/sub-category", { state: { categories: selectedIds, type: "service" } });
    };

    return (
        <div className="service-container">
            <div className="content">
                <h1>Select Service Category</h1>
                <p>Choose a type of Service to proceed</p>

                <div className="card-grid">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`card ${selectedIds.includes(cat.id) ? "selected" : ""}`}
                            onClick={() => handleCardClick(cat.id)}
                            style={{ cursor: "pointer", position: "relative" }}
                        >
                            <div className="card-selection-indicator">
                                {selectedIds.includes(cat.id) && (
                                    <CheckCircle2 size={24} className="check-icon" />
                                )}
                            </div>
                            <img src={cat.icon} alt={cat.name} />
                            <h3>{cat.name}</h3>
                            <span>Service Category</span>
                        </div>
                    ))}
                </div>

                <div className="footer-action-container">
                    <button
                        className={`continue-btn ${selectedIds.length > 0 ? "active" : ""}`}
                        onClick={handleContinue}
                        disabled={selectedIds.length === 0}
                    >
                        Continue <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServicePage;