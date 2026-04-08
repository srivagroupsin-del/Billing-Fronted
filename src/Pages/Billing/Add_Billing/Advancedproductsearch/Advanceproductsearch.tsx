import { useState, useEffect, type ChangeEvent } from 'react';
import { getBranchProducts } from '../../../../api/product';
import { fetchBusinessCategoryGroups } from '../../../../api/category';
import { fetchCategoryBrandList } from '../../../../api/product';
import "./Advanceproductsearch.css";

interface AdvancedProductSearchProps {
    onClose: () => void;
    onSelectProduct?: (product: any) => void;
}

const AdvancedProductSearch = ({ onClose, onSelectProduct }: AdvancedProductSearchProps) => {
    const initialFilters = {
        categoryGroup: '',
        category: '',
        brand: '',
        search: '',
        hsn: '',
        gst: 'All',
        priceMin: '',
        priceMax: '',
        stockMin: '',
        stockMax: ''
    };

    const [filters, setFilters] = useState(initialFilters);
    const [products, setProducts] = useState<any[]>([]);
    const [categoryGroups, setCategoryGroups] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [allGroupData, setAllGroupData] = useState<any>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadCategoryGroups = async () => {
            try {
                // Try localStorage first (consistent with Product Entry flow)
                const idsStr = localStorage.getItem("selected_category_group_id");
                const namesStr = localStorage.getItem("selected_category_group_names");
                
                if (idsStr && namesStr) {
                    const ids = JSON.parse(idsStr);
                    const names = JSON.parse(namesStr);
                    const groups = ids.map((id: string, idx: number) => ({ 
                        id: String(id), 
                        name: names[idx] || `Group ${id}` 
                    }));
                    setCategoryGroups(groups);
                    console.log("📋 Loaded category groups from Storage:", groups);
                    
                    // Default to group 16 if it exists in the selected groups
                    if (groups.some((g: any) => String(g.id) === '16')) {
                        setFilters(prev => ({ ...prev, categoryGroup: '16' }));
                    }
                    return;
                }

                // Fallback to API if not in storage
                const res = await fetchBusinessCategoryGroups();
                let list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
                if (list.length === 0 && res?.data?.category_groups) list = res.data.category_groups;
                
                setCategoryGroups(list);
                console.log("🌐 Loaded category groups from API:", list);
            } catch (error) {
                console.error("Failed to load category groups", error);
                setCategoryGroups([]);
            }
        };
        loadCategoryGroups();
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const groupId = filters.categoryGroup || 16;
                console.log(`🌐 Loading group ${groupId} data for category/brand selection`);
                
                const res = await fetchCategoryBrandList(groupId);
                const data = res?.data || res;
                setAllGroupData(data);
                
                // Flexible Category Extraction
                let cats = data?.categories || data?.category || data?.list || [];
                if (!Array.isArray(cats) && data?.categories) cats = [data.categories]; // Single object case
                if (Array.isArray(data) && cats.length === 0) cats = data; // Root array case
                
                setCategories(Array.isArray(cats) ? cats : []);
                setBrands([]); // Reset brand selection when group changes
                
                console.log(`✅ Extracted ${Array.isArray(cats) ? cats.length : 0} categories for group ${groupId}`, cats);
            } catch (error) {
                console.error("❌ Failed to load group data", error);
                setCategories([]);
            }
        };
        loadInitialData();
    }, [filters.categoryGroup]);

    useEffect(() => {
        const syncBrands = () => {
            if (!filters.category || !Array.isArray(categories) || categories.length === 0 || !allGroupData) {
                setBrands([]);
                return;
            }

            console.log(`🔍 Syncing brands for category: ${filters.category}`);
            const brandMap = new Map();
            
            // 1. Recursive helper to find the category node and extract nested brands
            const findAndExtract = (nodes: any[], targetId: string): boolean => {
                if (!Array.isArray(nodes)) return false;
                for (const node of nodes) {
                    const nodeId = String(node.id || node.category_id || node.category_list_id);
                    if (nodeId === String(targetId)) {
                        extractFromNode(node);
                        return true;
                    }
                    const children = node.categories || node.primary_categories || node.secondary_categories || node.sub_categories || node.items;
                    if (Array.isArray(children) && findAndExtract(children, targetId)) {
                        return true;
                    }
                }
                return false;
            };

            const extractFromNode = (node: any) => {
                const nestedBrands = node.brands || node.brand_list || node.Brand || node.brand_names;
                if (Array.isArray(nestedBrands)) {
                    nestedBrands.forEach(b => addBrand(b));
                }
                // Check if node itself represents a brand mapping
                if (node.brand_name || node.brand) addBrand(node);
                
                // Recurse for deeper brands if any
                const children = node.categories || node.primary_categories || node.secondary_categories || node.sub_categories || node.items;
                if (Array.isArray(children)) children.forEach(extractFromNode);
            };

            const addBrand = (b: any) => {
                const bName = typeof b === 'string' ? b : (b.brand_name || b.name || b.brand || b.brand_label);
                const bId = typeof b === 'string' ? b : (b.id || b.brand_id || bName);
                if (bName) {
                    brandMap.set(String(bId).toLowerCase(), { id: bId, name: bName });
                }
            };

            findAndExtract(categories, filters.category);

            // 2. Search in top-level brands list if available (found in many response formats)
            const dataObj = allGroupData?.data || allGroupData;
            const topLevelBrands = dataObj?.brands || dataObj?.list || (Array.isArray(dataObj) ? dataObj : []);
            
            if (Array.isArray(topLevelBrands)) {
                topLevelBrands.forEach((b: any) => {
                    const linkedCatId = String(b.category_id || b.categoryId || b.cat_id || b.parent_id || b.category_list_id);
                    if (linkedCatId === String(filters.category)) {
                        addBrand(b);
                    }
                });
            }

            const finalBrands = Array.from(brandMap.values());
            console.log(`✅ Final brands found: ${finalBrands.length}`, finalBrands);
            setBrands(finalBrands);
        };
        syncBrands();
    }, [filters.category, categories, allGroupData]);

    const fetchProducts = async (currentFilters: any) => {
        try {
            console.log("Fetching products with:", currentFilters);
            const data = await getBranchProducts(currentFilters);
            setProducts(data || []);
            console.log("Found products:", data);
        } catch (error) {
            console.error("Error searching products:", error);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const next = { ...prev, [name]: value };
            
            // Reset dependent fields
            if (name === 'categoryGroup') {
                next.category = '';
                next.brand = '';
            }
            if (name === 'category') {
                next.brand = '';
            }
            
            return next;
        });
    };

    const handleClear = () => {
        setFilters(initialFilters);
    };

    const handleSearch = () => {
        fetchProducts(filters);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const handleApply = () => {
        if (onSelectProduct) {
            const selected = products.filter(p => selectedItems.has(String(p._id || p.id)));
            selected.forEach(p => onSelectProduct(p));
        }
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="header blue-bg row-flex">
                    <span>Advanced Product Search</span>
                    <span className="close-x" onClick={onClose}>&times;</span>
                </div>

                <div className="modal-body">
                    <div className="filter-grid">
                        <div className="field">
                            <label>Category Group</label>
                            <select
                                className="form-select"
                                name="categoryGroup"
                                value={filters.categoryGroup}
                                onChange={handleChange}
                            >
                                <option value="">-- Group --</option>
                                {Array.isArray(categoryGroups) && categoryGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.category_group_name || group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label>Category</label>
                            <select
                                className="form-select"
                                name="category"
                                value={filters.category}
                                onChange={handleChange}
                            >
                                <option value="">-- Category --</option>
                                {Array.isArray(categories) && categories.map((cat, idx) => (
                                    <option key={cat.id || idx} value={cat.id}>
                                        {cat.category_name || cat.name || cat.category_list_name || `Category ${cat.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label>Brand</label>
                            <select
                                className="form-select"
                                name="brand"
                                value={filters.brand}
                                onChange={handleChange}
                            >
                                <option value="">-- Brand --</option>
                                {Array.isArray(brands) && brands.map((b, idx) => (
                                    <option key={b.id || b.name || idx} value={b.id}>
                                        {b.brand_name || b.name || b.brand || `Brand ${b.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field full-width">
                            <label>Search (Product Name / ID)</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Type product name or ID..."
                                name="search"
                                value={filters.search}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="field">
                            <label>HSN</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="HSN"
                                name="hsn"
                                value={filters.hsn}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="field">
                            <label>GST</label>
                            <select
                                className="form-select"
                                name="gst"
                                value={filters.gst}
                                onChange={handleChange}
                            >
                                <option value="All">All</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>

                        <div className="field">
                            <label>Price Min</label>
                            <input
                                type="number"
                                className="form-control"
                                name="priceMin"
                                value={filters.priceMin}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="field">
                            <label>Price Max</label>
                            <input
                                type="number"
                                className="form-control"
                                name="priceMax"
                                value={filters.priceMax}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="field">
                            <label>Stock Min</label>
                            <input
                                type="number"
                                className="form-control"
                                name="stockMin"
                                value={filters.stockMin}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="field">
                            <label>Stock Max</label>
                            <input
                                type="number"
                                className="form-control"
                                name="stockMax"
                                value={filters.stockMax}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="search-actions" style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button
                                className="btn-blue"
                                style={{ background: '#0d6efd', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px' }}
                                onClick={handleSearch}
                            >
                                Search
                            </button>
                            <button
                                className="btn-white"
                                style={{ background: 'white', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px' }}
                                onClick={handleClear}
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="product-results" style={{ marginTop: '20px' }}>
                        {products.length > 0 ? (
                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                 <thead>
                                    <tr style={{ background: '#f8f9fa' }}>
                                        <th style={{ padding: '8px', border: '1px solid #dee2e6', width: '40px' }}>
                                            <input 
                                                type="checkbox" 
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedItems(new Set(products.map(p => String(p._id || p.id))));
                                                    } else {
                                                        setSelectedItems(new Set());
                                                    }
                                                }}
                                                checked={selectedItems.size > 0 && selectedItems.size === products.length}
                                            />
                                        </th>
                                        <th style={{ padding: '8px', border: '1px solid #dee2e6' }}>SKU</th>
                                        <th style={{ padding: '8px', border: '1px solid #dee2e6' }}>Product</th>
                                        <th style={{ padding: '8px', border: '1px solid #dee2e6' }}>Price</th>
                                        <th style={{ padding: '8px', border: '1px solid #dee2e6' }}>Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((prod) => {
                                        const pId = String(prod._id || prod.id);
                                        return (
                                            <tr key={pId}>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedItems.has(pId)} 
                                                        onChange={() => toggleSelection(pId)} 
                                                    />
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{prod.sku || 'N/A'}</td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{prod.name || prod.product_name}</td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>₹{prod.price || prod.selling_price || 0}</td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{prod.stock || prod.quantity || 0}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data">No products found. Try adjusting filters.</p>
                        )}
                    </div>

                    <p className="tip-text">
                        Select products by checking the box on each card. Selections sync with the added-products list.
                    </p>

                    <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

                     <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button className="btn-secondary" onClick={onClose} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                        <button 
                            className="btn-success" 
                            style={{ background: '#198754', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedItems.size === 0 ? 0.6 : 1 }}
                            disabled={selectedItems.size === 0}
                            onClick={handleApply}
                        >
                            Apply Selection ({selectedItems.size})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedProductSearch;
