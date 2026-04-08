import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Brand_select.css";

interface Brand {
    id: number;
    name: string;
    logo: string;
}

const brands: Brand[] = [
    { id: 1, name: "Apple", logo: "https://cdn-icons-png.flaticon.com/512/0/747.png" },
    { id: 2, name: "Samsung", logo: "https://cdn-icons-png.flaticon.com/512/5969/5969078.png" },
    { id: 3, name: "Google", logo: "https://cdn-icons-png.flaticon.com/512/300/300221.png" },
    { id: 4, name: "OnePlus", logo: "https://cdn-icons-png.flaticon.com/512/5969/5969113.png" },
    { id: 5, name: "Xiaomi", logo: "https://cdn-icons-png.flaticon.com/512/5969/5969059.png" },
    { id: 6, name: "Oppo", logo: "https://cdn-icons-png.flaticon.com/512/888/888879.png" },
    { id: 7, name: "Vivo", logo: "https://cdn-icons-png.flaticon.com/512/888/888857.png" },
    { id: 8, name: "Huawei", logo: "https://cdn-icons-png.flaticon.com/512/888/888867.png" },
];

const BrandSelect: React.FC = () => {
    const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
    const navigate = useNavigate();

    const toggleBrand = (id: number) => {
        setSelectedBrands((prev) =>
            prev.includes(id)
                ? prev.filter((brandId) => brandId !== id)
                : [...prev, id]
        );
    };

    const handleSave = () => {
        if (selectedBrands.length === 0) {
            alert("Please select at least one brand.");
            return;
        }
        // Navigate to Service & Sales page after selection
        navigate("/progress/service-sales");
    };

    return (
        <div className="brand-container">
            <h1 className="title">Select Your Brand</h1>
            <p className="subtitle">Choose your preferred mobile brand</p>
            <div className="brand-grid">
                {brands.map((brand) => (
                    <div
                        key={brand.id}
                        className={`brand-card ${selectedBrands.includes(brand.id) ? "active" : ""
                            }`}
                        onClick={() => toggleBrand(brand.id)}
                    >
                        <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand.id)}
                            readOnly
                            className="checkbox"
                        />
                        <img src={brand.logo} alt={brand.name} />
                        <h3>{brand.name}</h3>
                    </div>
                ))}
            </div>
            <button className="save-btn" onClick={handleSave}>
                Save
            </button>
        </div>
    );
};

export default BrandSelect;
