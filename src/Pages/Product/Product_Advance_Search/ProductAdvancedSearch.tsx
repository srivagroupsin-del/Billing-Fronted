import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { fetchGroupCategoryBrandList, fetchCategoryBrandList, fetchBrandsByCategoryId, fetchProductsByCategoryAndBrand, fetchProductsByBrandId } from "../../../api/product.ts";
import "./ProductAdvancedSearch.css";

// Interface for Product Data
interface Product {
    id: number;
    sku: string;
    name: string;
    modelName: string;
    category: string;
    brand: string;
    barcode: string;
    alternativeName?: string;
}

// Mock Product Data (Inventory) - Kept for reference or as fallback
const INVENTORY_DATA: Product[] = [
    { id: 1, sku: "E001", name: "Samsung Galaxy S24", modelName: "SM-S921", category: "Electronics", brand: "Samsung", barcode: "8901111111111", alternativeName: "Galaxy S24" },
    { id: 2, sku: "E002", name: "iPhone 15 Pro", modelName: "A3102", category: "Electronics", brand: "Apple", barcode: "8902222222222", alternativeName: "iPhone15Pro" },
    { id: 3, sku: "E003", name: "Sony WH-1000XM5", modelName: "WH1000XM5/B", category: "Electronics", brand: "Sony", barcode: "8903333333333", alternativeName: "Sony Headset" },
];

const ProductAdvancedSearch = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");
    const [alternativeName, setAlternativeName] = useState("");
    const [price, setPrice] = useState("");
    const [categoryGroup, setCategoryGroup] = useState("");
    const [categoryList, setCategoryList] = useState("");
    const [stockType, setStockType] = useState("Primary");
    const [brand, setBrand] = useState("");
    const [product, setProduct] = useState("");
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Results will be empty initially

    // API Data states
    const [categoryGroupsList, setCategoryGroupsList] = useState<{ id: string, name: string }[]>([]);
    const [setupCategories, setSetupCategories] = useState<{ id: number, name: string, type?: string }[]>([]);
    const [mappingData, setMappingData] = useState<any[]>([]);
    const [apiHierarchy, setApiHierarchy] = useState<any[]>([]);
    const [brandsList, setBrandsList] = useState<{ id: string | number, name: string }[]>([]);
    const [productsList, setProductsList] = useState<{ id: string | number, name: string }[]>([]);
    const [loadingMapping, setLoadingMapping] = useState(false);

    // Initial load for Category Groups and Categories from localStorage
    useEffect(() => {
        // Category Groups
        const groupIds = localStorage.getItem("selected_category_group_id");
        const groupNames = localStorage.getItem("selected_category_group_names");
        if (groupIds && groupNames) {
            try {
                const ids = JSON.parse(groupIds);
                const names = JSON.parse(groupNames);
                const groups = ids.map((id: string, idx: number) => ({ id: String(id), name: names[idx] || `Group ${id}` }));
                setCategoryGroupsList(groups);
                if (groups.length > 0) setCategoryGroup(groups[0].id);
            } catch (e) { console.error("Error parsing Groups", e); }
        }

        // Categories (Primary/Secondary)
        const savedIds = localStorage.getItem("selected_category_ids");
        const savedNames = localStorage.getItem("selected_category_names");
        const savedTypes = localStorage.getItem("selected_category_types");
        if (savedIds && savedNames) {
            try {
                const ids = JSON.parse(savedIds);
                const names = JSON.parse(savedNames);
                const types = savedTypes ? JSON.parse(savedTypes) : [];
                const combined = ids.map((id: number, index: number) => ({
                    id,
                    name: names[index] || `Category ${id}`,
                    type: types[index] ? (types[index].charAt(0).toUpperCase() + types[index].slice(1)) : "Primary"
                }));
                setSetupCategories(combined);
            } catch (e) { console.error("Error parsing Categories", e); }
        }
    }, []);

    // Load Category-Brand mapping based on Group
    useEffect(() => {
        const loadMapping = async () => {
            if (!categoryGroup) return;
            setLoadingMapping(true);
            try {
                const [productResponse, brandResponse] = await Promise.all([
                    fetchGroupCategoryBrandList(categoryGroup),
                    fetchCategoryBrandList(categoryGroup)
                ]);

                const extractData = (res: any) => res?.data ? (Array.isArray(res.data) ? res.data : (res.data.category_groups || res.data.categories || res.data.list || [])) : [];
                const rawProducts = extractData(productResponse);
                const rawBrands = extractData(brandResponse);
                setApiHierarchy([...rawProducts, ...rawBrands]);

                const flattened: any[] = [];
                const processItems = (items: any[], parentData: any = {}, isPrimary: boolean = true) => {
                    if (!Array.isArray(items)) return;
                    items.forEach(item => {
                        const currentData = { ...parentData };
                        currentData.isPrimary = item.type === 'Secondary' ? false : (item.type === 'Primary' ? true : isPrimary);
                        const groupTitle = item.category_group_name || item.group_name;
                        const itemName = item.name || item.category_name || item.category_list_name;
                        const brandNameProp = item.brand_name || item.brand;
                        const isBrand = !!brandNameProp && !item.secondary_categories && !item.primary_categories;
                        if (groupTitle) {
                            currentData.category_group_name = groupTitle;
                            currentData.category_group_id = item.category_group_id || item.id;
                        }
                        if (itemName && !isBrand) {
                            currentData.category_list_name = itemName;
                            currentData.category_list_id = item.id || item.category_id;
                            flattened.push({ ...currentData });
                        }
                        if (isBrand) {
                            flattened.push({ ...currentData, brand_name: brandNameProp, brand_id: item.brand_id || item.id });
                        }
                        if (item.brands && Array.isArray(item.brands)) {
                            item.brands.forEach((b: any) => {
                                const bName = typeof b === 'string' ? b : (b.name || b.brand_name || b.brand);
                                if (bName) flattened.push({ ...currentData, brand_name: bName, brand_id: b.id || b.brand_id });
                            });
                        }
                        const pSub = item.primary_categories || item.categories;
                        const sSub = item.secondary_categories || item.sub_categories || item.items;
                        if (pSub && Array.isArray(pSub)) processItems(pSub, currentData, true);
                        if (sSub && Array.isArray(sSub)) processItems(sSub, currentData, false);
                    });
                };
                processItems([...rawProducts, ...rawBrands], { category_group_id: categoryGroup });
                setMappingData(flattened);
            } catch (err) { console.error("Error loadMapping", err); }
            finally { setLoadingMapping(false); }
        };
        loadMapping();
    }, [categoryGroup]);

    // Update Brands based on Category
    useEffect(() => {
        const loadBrands = async () => {
            if (!categoryList) { setBrandsList([]); return; }
            if (!isNaN(Number(categoryList))) {
                try {
                    const res = await fetchBrandsByCategoryId(categoryList);
                    if (res?.data || Array.isArray(res)) {
                        const list = Array.isArray(res) ? res : (res.data.brands || res.data.list || (Array.isArray(res.data) ? res.data : []));
                        setBrandsList(list.map((b: any) => ({ id: String(b.id || b.brand_id), name: b.name || b.brand_name || "" })).filter((b: any) => b.name));
                        return;
                    }
                } catch (e) { console.error("Error fetchBrands", e); }
            }
            // Fallback to hierarchy extraction
            const uniqueBrands = new Map();
            const extractBrands = (cat: any) => {
                if (cat.brands) cat.brands.forEach((b: any) => {
                    const name = typeof b === 'string' ? b : b.name || b.brand_name;
                    if (name) uniqueBrands.set(name.toLowerCase(), { id: b.id || b.brand_id, name });
                });
                ['primary_categories', 'categories', 'secondary_categories', 'sub_categories', 'items'].forEach(k => {
                    if (cat[k] && Array.isArray(cat[k])) cat[k].forEach(extractBrands);
                });
            };
            const findCat = (nodes: any[], target: string): any[] => {
                let found: any[] = [];
                for (const n of nodes) {
                    if (String(n.id || n.category_id) === target) found.push(n);
                    ['primary_categories', 'categories', 'secondary_categories', 'sub_categories', 'items'].forEach(k => {
                        if (n[k]) found = found.concat(findCat(n[k], target));
                    });
                }
                return found;
            };
            findCat(apiHierarchy, categoryList).forEach(extractBrands);
            setBrandsList(Array.from(uniqueBrands.values()));
        };
        loadBrands();
    }, [categoryList, apiHierarchy]);

    // Update Products based on Brand
    useEffect(() => {
        const loadProducts = async () => {
            if (!brand) { setProductsList([]); return; }
            if (!isNaN(Number(brand)) && !isNaN(Number(categoryList))) {
                try {
                    const res = await fetchProductsByCategoryAndBrand(categoryList, brand);
                    const list = res?.data ? (res.data.products || (Array.isArray(res.data) ? res.data : [])) : (Array.isArray(res) ? res : []);
                    setProductsList(list.map((p: any) => ({ id: String(p.id || p.product_id), name: p.name || p.product_name || "" })).filter((p: any) => p.name));
                    return;
                } catch (e) { console.error("Error fetchProducts", e); }
            }
            if (!isNaN(Number(brand))) {
                try {
                    const res = await fetchProductsByBrandId(brand);
                    const list = res?.data ? (res.data.products || (Array.isArray(res.data) ? res.data : [])) : (Array.isArray(res) ? res : []);
                    setProductsList(list.map((p: any) => ({ id: String(p.id || p.product_id), name: p.name || p.product_name || "" })).filter((p: any) => p.name));
                } catch (e) { console.error("Error fetchByBrand", e); }
            }
        };
        loadProducts();
    }, [brand, categoryList]);

    // 🔎 Manual search logic
    const handleSearch = () => {
        // Here you would normally filter real search results from an API
        // For now, we'll keep the logic that filters mock data or alerts the user
        const results = INVENTORY_DATA.filter((product) => {
            return (
                (searchText === "" || product.name.toLowerCase().includes(searchText.toLowerCase())) &&
                (barcodeInput === "" || product.barcode.includes(barcodeInput))
            );
        });
        setFilteredProducts(results);
        if (results.length === 0) {
            alert("No products found for the selected filters (Connecting to Real API Search results soon)");
        }
    };

    const handleReset = () => {
        setSearchText("");
        setBarcodeInput("");
        setAlternativeName("");
        setPrice("");
        setCategoryList("");
        setStockType("Primary");
        setBrand("");
        setProduct("");
        setFilteredProducts([]);
    };

    const handleBarcodeScan = () => {
        alert("Barcode scanner activated (Integrate real scanner here)");
    };

    return (
        <div className="product-container">
            <div className="product-card">
                <div className="product-header">
                    <h2 className="product-title">Advanced Search</h2>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Back
                    </button>
                </div>

                {/* 🔍 FILTER SECTION */}
                <div className="form-grid">

                    {/* 1) Category Group Name */}
                    <div className="form-group">
                        <label>Category Group Name</label>
                        <select 
                            value={categoryGroup} 
                            onChange={(e) => {
                                setCategoryGroup(e.target.value);
                                setCategoryList("");
                                setBrand("");
                                setProduct("");
                            }}
                        >
                            <option value="">Select Group</option>
                            {categoryGroupsList.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2) Category List with Primary/Secondary */}
                    <div className="form-group">
                        <div className="form-group-header">
                            <label>Category List</label>
                            <div className="category-type-switch">
                                <button
                                    type="button"
                                    className={`type-switch-btn ${stockType === 'Primary' ? 'active' : ''}`}
                                    onClick={() => {
                                        setStockType('Primary');
                                        setCategoryList("");
                                        setBrand("");
                                        setProduct("");
                                    }}
                                >
                                    Primary
                                </button>
                                <button
                                    type="button"
                                    className={`type-switch-btn ${stockType === 'Secondary' ? 'active' : ''}`}
                                    onClick={() => {
                                        setStockType('Secondary');
                                        setCategoryList("");
                                        setBrand("");
                                        setProduct("");
                                    }}
                                >
                                    Secondary
                                </button>
                            </div>
                        </div>
                        <select 
                            value={categoryList} 
                            onChange={(e) => {
                                setCategoryList(e.target.value);
                                setBrand("");
                                setProduct("");
                            }}
                            disabled={!categoryGroup}
                        >
                            <option value="">{loadingMapping ? "Loading..." : "Select Category"}</option>
                            {setupCategories
                                .filter(cat => String(cat.type).toLowerCase() === stockType.toLowerCase())
                                .filter(cat => {
                                    if (mappingData.length === 0) return true;
                                    const groupMappings = mappingData.filter(m => String(m.category_group_id) === String(categoryGroup));
                                    if (groupMappings.length === 0) return true;
                                    return groupMappings.some(m => 
                                        String(m.category_list_id) === String(cat.id) || 
                                        m.category_list_name?.toLowerCase().trim() === cat.name.toLowerCase().trim()
                                    );
                                })
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))
                            }
                        </select>
                    </div>

                    {/* 3) Brand */}
                    <div className="form-group">
                        <label>Brand</label>
                        <select 
                            value={brand} 
                            onChange={(e) => {
                                setBrand(e.target.value);
                                setProduct("");
                            }}
                            disabled={!categoryList}
                        >
                            <option value="">{!categoryList ? "Select category first" : "Select Brand"}</option>
                            {brandsList.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 4) Product */}
                    <div className="form-group">
                        <label>Product</label>
                        <select 
                            value={product} 
                            onChange={(e) => setProduct(e.target.value)}
                            disabled={!brand}
                        >
                            <option value="">{!brand ? "Select brand first" : "Select Product"}</option>
                            {productsList.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 5) Alternative Name */}
                    <div className="form-group">
                        <label>Alternative Name</label>
                        <input
                            type="text"
                            placeholder="Enter Alternative Name..."
                            value={alternativeName}
                            onChange={(e) => setAlternativeName(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* 6) Price */}
                    <div className="form-group">
                        <label>Price</label>
                        <input
                            type="text"
                            placeholder="Enter Price..."
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* 7) Product Search Bar */}
                    <div className="form-group">
                        <label>Search Product</label>
                        <input
                            type="text"
                            placeholder="Type name, SKU, or model..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* 8) Barcode */}
                    <div className="form-group">
                        <label>Barcode</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="text"
                                placeholder="Scan or Enter Barcode..."
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                className="form-input"
                            />
                            <button
                                type="button"
                                className="scan-btn"
                                onClick={handleBarcodeScan}
                            >
                                📷 Scan
                            </button>
                        </div>
                    </div>

                </div>

                <div className="form-actions">
                    <button className="save-btn" onClick={handleSearch}>Search Products</button>
                    <button className="reset-btn" onClick={handleReset}>Reset Filters</button>
                </div>

                {/* 📋 RESULTS SECTION */}
                <div className="results-section">
                    <div className="section-header">
                        <h3 className="section-subtitle">
                            Search Results <span className="results-count">({filteredProducts.length} items found)</span>
                        </h3>
                    </div>

                    <div className="table-responsive">
                        {filteredProducts.length > 0 ? (
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Product Name</th>
                                        <th>Model</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Barcode</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td style={{ fontWeight: "600", color: "#007bff" }}>{product.sku}</td>
                                            <td>{product.name}</td>
                                            <td>{product.modelName}</td>
                                            <td>{product.category}</td>
                                            <td>{product.brand}</td>
                                            <td>{product.barcode}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-results">
                                <span className="no-results-icon">🔍</span>
                                <p>No products found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductAdvancedSearch;