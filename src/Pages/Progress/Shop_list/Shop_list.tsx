import { useNavigate, useLocation } from "react-router-dom";
import "./Shop_list.css";

const SelectBusiness: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const business = location.state?.business;

    const handleSelect = (type: string) => {
        // You can pass the business and type via state
        const selectedCategoryIds = location.state?.selectedCategoryIds;
        navigate("/progress/brand", { state: { business, selectedCategoryIds, businessMode: type } });
    };

    return (
        <div className="select-container">
            <h1 className="title">Select Your Option</h1>
            <p className="subtitle">Choose your preferred business mode</p>

            <div className="card-wrapper">
                {/* Local Shop */}
                <div className="card">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png"
                        alt="Local Shop"
                    />
                    <h2>Local Shop</h2>
                    <p>Manage your physical store</p>
                    <button
                        className="btn green"
                        onClick={() => handleSelect("Local Shop")}
                    >
                        Select
                    </button>
                </div>

                {/* Online Store */}
                <div className="card">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/891/891462.png"
                        alt="Online Store"
                    />
                    <h2>Online Store</h2>
                    <p>Run your e-commerce website</p>
                    <button
                        className="btn blue"
                        onClick={() => handleSelect("Online Store")}
                    >
                        Select
                    </button>
                </div>

                {/* Import */}
                <div className="card">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/679/679720.png"
                        alt="Import"
                    />
                    <h2>Import</h2>
                    <p>Bring goods into your country</p>
                    <button
                        className="btn orange"
                        onClick={() => handleSelect("Import")}
                    >
                        Select
                    </button>
                </div>

                {/* Export */}
                <div className="card">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/854/854878.png"
                        alt="Export"
                    />
                    <h2>Export</h2>
                    <p>Send products overseas</p>
                    <button
                        className="btn purple"
                        onClick={() => handleSelect("Export")}
                    >
                        Select
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectBusiness;
