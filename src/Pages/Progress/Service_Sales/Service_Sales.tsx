import React from "react";
import { useNavigate } from "react-router-dom";
import "./Service_Sales.css";

const ServiceSalesCards: React.FC = () => {
    const navigate = useNavigate();

    const handleService = () => {
        navigate("/progress/service");
    };

    const handleSale = () => {
        navigate("/progress/sale");
    };

    return (
        <div className="service-sales-page">
            <h1 className="title">Choose Service Type</h1>
            <p className="subtitle">Select the primary focus for your business operations</p>

            <div className="card-container">
                {/* Service Card */}
                <div className="card service-card" onClick={handleService}>
                    <div className="card-header service-header">
                        <div className="icon">🔧</div>
                    </div>
                    <div className="card-body">
                        <h2>Repair & Maintenance</h2>
                        <p>Professional repair and maintenance services for your customers.</p>
                        <button className="btn service-btn">Select Service</button>
                    </div>
                </div>

                {/* Sales Card */}
                <div className="card sales-card" onClick={handleSale}>
                    <div className="card-header sales-header">
                        <div className="icon">🏷️</div>
                    </div>
                    <div className="card-body">
                        <h2>Direct Sales</h2>
                        <p>Retail and wholesale product sales with inventory management.</p>
                        <button className="btn sales-btn">Select Sales</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceSalesCards;
