import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, CheckCircle2, ArrowRight } from "lucide-react";
import "./sale.css";

interface SaleCategory {
  id: number;
  name: string;
  image: string;
}

const categories: SaleCategory[] = [
  { id: 1, name: "Manufacturer", image: "🏭" },
  { id: 2, name: "Accessories", image: "⌚" },
  { id: 3, name: "Import", image: "🚢" },
  { id: 4, name: "Distributor", image: "🏬" },
  { id: 5, name: "Showroom", image: "🏪" },
  { id: 6, name: "Dealer", image: "👨‍💼" },
  { id: 7, name: "Retailer", image: "🛒" },
];

const SalesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
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
    const selectedNames = categories
      .filter(cat => selectedIds.includes(cat.id))
      .map(cat => cat.name);

    navigate("/progress/sub-category", { state: { categories: selectedNames, type: "sale" } });
  };

  return (
    <div className="sales-page">

      {/* Page Header */}
      <div className="header" style={{ color: 'black' }}>
        <h1>Select Sale Category</h1>
        <p>Choose a type of Sales to proceed</p>
      </div>

      {/* Search + Dropdown */}
      <div className="filter-row">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search sale category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className="dropdown"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span>All Types</span>
          <ChevronDown size={18} />
          {dropdownOpen && (
            <div className="dropdown-menu">
              {categories.map((cat) => (
                <div key={cat.id} className="dropdown-item">
                  {cat.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="card-grid">
        {filteredCategories.map((cat) => (
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
            <div className="card-image">{cat.image}</div>
            <h3>{cat.name}</h3>
            <p>Sales Category</p>
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
  );
};

export default SalesPage;