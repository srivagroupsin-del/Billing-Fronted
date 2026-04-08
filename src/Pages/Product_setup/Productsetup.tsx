import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchCategories } from "../../api/category.ts";
import { fetchBrands } from "../../api/brand.ts";
import { getProducts, addBranchProduct, getBranchProducts } from "../../api/product.ts";
import "./Productsetup.css";

interface Product {
    id: number;
    product_name?: string;
    name?: string;
    sku: string;
    category_id?: number;
    brand_id?: number;
    category?: string;
    brand?: string;
    mapped?: boolean;
}

const ProductSetupMapping: React.FC = () => {
    const navigate = useNavigate();
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);

    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [branchProducts, setBranchProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        category: "",
        brand: "",
        search: ""
    });

    const businessId = localStorage.getItem('selected_business_id');

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [catsData, productsData, bProdData] = await Promise.all([
                    fetchCategories().catch(() => []),
                    getProducts().catch(() => []),
                    businessId ? getBranchProducts({ business_id: businessId }).catch(() => []) : Promise.resolve([])
                ]);

                // Normalize categories
                setCategories(Array.isArray(catsData) ? catsData : []);

                // Normalize products
                const pList = Array.isArray(productsData) ? productsData :
                    (productsData?.data || productsData?.products || []);
                setProducts(pList);

                // Normalize branch products
                const bpList = Array.isArray(bProdData) ? bProdData :
                    (bProdData?.data || bProdData?.branch_products || []);
                setBranchProducts(bpList);
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [businessId]);

    useEffect(() => {
        if (filters.category) {
            fetchBrands(filters.category).then((data: any) => {
                const bData = data.data || data;
                setBrands(Array.isArray(bData) ? bData : []);
            }).catch(() => setBrands([]));
        } else {
            setBrands([]);
        }
    }, [filters.category]);

    const filteredProducts = products.filter(p => {
        const catId = p.category_id || (p as any).categoryId;
        const bndId = p.brand_id || (p as any).brandId;
        const name = p.product_name || p.name || "";
        const sku = p.sku || "";

        const matchesCategory = filters.category ? String(catId) === String(filters.category) : true;
        const matchesBrand = filters.brand ? String(bndId) === String(filters.brand) : true;
        const matchesSearch = filters.search ?
            name.toLowerCase().includes(filters.search.toLowerCase()) ||
            sku.toLowerCase().includes(filters.search.toLowerCase()) : true;

        return matchesCategory && matchesBrand && matchesSearch;
    });

    const isMapped = (productId: number) => {
        return branchProducts.some(bp => String(bp.product_id || bp.productId) === String(productId));
    };

    const toggleSelect = (id: number) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter((item) => item !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const handleConfirmMapping = async () => {
        setLoading(true);
        try {
            const mappingPromises = selectedProducts.map(productId =>
                addBranchProduct({
                    business_id: businessId,
                    product_id: productId,
                    status: 1
                })
            );
            await Promise.all(mappingPromises);

            // Refresh branch products
            const updatedBProds = await getBranchProducts({ business_id: businessId });
            setBranchProducts(Array.isArray(updatedBProds) ? updatedBProds : (updatedBProds?.data || []));

            setSelectedProducts([]);
            setShowConfirm(false);
            alert("Products mapped successfully!");
        } catch (err) {
            console.error("Mapping error:", err);
            alert("Failed to map products.");
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedProducts([]);
    };

    if (loading && products.length === 0) {
        return <div className="product-page">Loading product data...</div>;
    }

    return (
        <div className="product-page">
            <h2 className="page-title">Product Setup & Mapping</h2>

            <div className="filter-card">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value, brand: "" })}
                        >
                            <option value="">Select Category *</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.category_name || cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Brand</label>
                        <select
                            value={filters.brand}
                            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                            disabled={!filters.category}
                        >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.brand_name || brand.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group search-group">
                        <label>Search</label>
                        <div className="ps-search-input-wrapper">
                            <Search className="ps-search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search product"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        className="primary-btn create-btn"
                        onClick={() => navigate('/add-product')}
                    >
                        Create New Product
                    </button>
                </div>
            </div>

            <div className="table-card">
                <h3>List of Products</h3>
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>PRODUCT NAME</th>
                            <th>CATEGORY</th>
                            <th>BRAND</th>
                            <th>MAPPING STATUS</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => {
                            const mapped = isMapped(product.id);
                            return (
                                <tr key={product.id}>
                                    <td>
                                        {!mapped && (
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => toggleSelect(product.id)}
                                            />
                                        )}
                                    </td>
                                    <td>{product.product_name || product.name || "Unnamed Product"}</td>
                                    <td>
                                        {categories.find(c => String(c.id) === String(product.category_id || (product as any).categoryId))?.category_name || product.category || "-"}
                                    </td>
                                    <td>
                                        {product.brand || "-"}
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                mapped ? "ps-badge mapped" : "ps-badge not-mapped"
                                            }
                                        >
                                            {mapped ? "Mapped" : "Not Mapped"}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="view-btn">View</button>
                                        <button className="edit-btn" onClick={() => navigate('/products')}>Edit</button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No products found matching filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedProducts.length > 0 && (
                <div className="bottom-bar">
                    <button
                        className="map-btn"
                        onClick={() => setShowConfirm(true)}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : `✔ Map ${selectedProducts.length} Selected Products`}
                    </button>
                    <button className="clear-btn" onClick={clearSelection} disabled={loading}>
                        Clear Selection
                    </button>
                </div>
            )}

            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Confirm Mapping</h3>
                            <button onClick={() => setShowConfirm(false)}>✕</button>
                        </div>

                        <p style={{ marginTop: '10px' }}>Map the following products to this branch:</p>

                        <ul style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {products
                                .filter((p) => selectedProducts.includes(p.id))
                                .map((p) => (
                                    <li key={p.id} style={{ padding: '5px 0' }}>✔ {p.product_name || p.name}</li>
                                ))}
                        </ul>

                        <div className="modal-actions">
                            <button
                                className="primary-btn"
                                onClick={handleConfirmMapping}
                                disabled={loading}
                            >
                                {loading ? "Mapping..." : "Confirm Mapping"}
                            </button>
                            <button
                                className="secondary-btn"
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductSetupMapping;
