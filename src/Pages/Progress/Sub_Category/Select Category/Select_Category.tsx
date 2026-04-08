import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Select_Category.css";

interface Category {
  id: number;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: 1, name: "Mobile Phones", icon: "📱" },
  { id: 2, name: "Laptops", icon: "💻" },
  { id: 3, name: "Tablets", icon: "📲" },
  { id: 4, name: "Cameras", icon: "📷" },
  { id: 5, name: "Accessories", icon: "🎧" },
  { id: 6, name: "Gaming", icon: "🎮" },
  { id: 7, name: "Audio", icon: "🔊" },
  { id: 8, name: "Wearables", icon: "⌚" },
];

const SelectCategory = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "Mobile Phones") {
      navigate("/select-brand");
    }
  };

  return (
    <div className="category-page">
      <div className="category-container">
        <h1 className="page-title">Select Category</h1>
        <p className="page-subtitle">
          Choose a category for <strong>Tech World (Electronics)</strong>
        </p>

        {/* Search + Dropdown */}
        <div className="filter-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search category by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dropdown-box">
            <span>All Categories</span>
            <ChevronDown size={18} />
          </div>
        </div>

        {/* Category Grid */}
        <div className="category-grid">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="category-card"
              onClick={() => handleCategoryClick(cat.name)}
            >
              <div className="icon-box">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p className="category-type">Electronics</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default SelectCategory;
