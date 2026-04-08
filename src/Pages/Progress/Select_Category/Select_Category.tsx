import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Select_Category.css";

interface Category {
    id: number;
    name: string;
    icon: string;
}

const categoryData: Category[] = [
    { id: 1, name: "Electronics", icon: "🖥️" },
    { id: 2, name: "Grocery", icon: "🛒" },
    { id: 3, name: "Fashion", icon: "👜" },
    { id: 4, name: "Restaurant", icon: "🍽️" },
    { id: 5, name: "Pharmacy", icon: "💊" },
    { id: 6, name: "Fitness", icon: "🏋️" },
    { id: 7, name: "Books", icon: "📚" },
    { id: 8, name: "Pets", icon: "🐾" },
    { id: 9, name: "Salon", icon: "💇" },
    { id: 10, name: "Home Decor", icon: "🛋️" },
];

const SelectCategory = () => {
    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const business = location.state?.business;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCategories = categoryData.filter((cat) => {
        const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
        const matchesDropdown = selectedCategory ? cat.id === selectedCategory.id : true;
        return matchesSearch && matchesDropdown;
    });

    const toggleCheckbox = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleSave = () => {
        if (selectedIds.length === 0) {
            alert("Please select at least one category.");
            return;
        }
        // You can pass the selected IDs via state if needed
        navigate("/progress/shop-list", { state: { selectedCategoryIds: selectedIds, business } });
    };

    const handleManage = () => {
        alert("Manage Clicked");
    };

    return (
        <div className="category-page">
            <div className="category-wrapper">
                <h1 className="title">Select Category</h1>

                {/* 🔝 Top Section */}
                <div className="filter-section">

                    {/* Search */}
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Dropdown */}
                    <div className="cat-dropdown-wrapper" ref={dropdownRef}>
                        <div
                            className="cat-dropdown-trigger"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            {selectedCategory
                                ? `${selectedCategory.icon} ${selectedCategory.name}`
                                : "All Categories"}
                            <ChevronDown size={16} />
                        </div>

                        {dropdownOpen && (
                            <div className="cat-dropdown-panel">
                                <ul>
                                    <li onClick={() => setSelectedCategory(null)}>
                                        🗂️ All Categories
                                    </li>
                                    {categoryData.map((cat) => (
                                        <li
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            {cat.icon} {cat.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Manage */}
                    <button className="global-manage-btn" onClick={handleManage}>
                        Manage
                    </button>

                    {/* Save */}
                    <button className="global-save-btn" onClick={handleSave}>
                        Save
                    </button>

                </div>

                {/* 🗂 Category Cards */}
                <div className="category-grid">
                    {filteredCategories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`category-card ${selectedIds.includes(cat.id) ? "selected" : ""}`}
                            onClick={() => toggleCheckbox(cat.id)}
                        >
                            <div className="card-checkbox" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(cat.id)}
                                    onChange={() => toggleCheckbox(cat.id)}
                                />
                            </div>

                            <div className="icon-box">{cat.icon}</div>
                            <h3>{cat.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SelectCategory;
