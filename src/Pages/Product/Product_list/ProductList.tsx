import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import { listProductAllocations, deleteProductAllocation } from "../../../api/product_allocation.ts";
import { showAlert } from "../../../Components/Notification/CenterAlert.tsx";
import { showConfirm } from "../../../Components/Notification/ConfirmModal";
import "./ProductList.css";

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const loadData = async () => {
        setFetching(true);
        try {
            const res = await listProductAllocations().catch(() => null);

            if (res?.success || res?.status) {
                const rawData = res.data || [];
                const flattened: any[] = [];

                console.log("📥 Raw Allocation Data:", rawData);
                rawData.forEach((group: any) => {
                    const categoriesObj = group.Categories || {};
                    ['primary', 'secondary'].forEach(type => {
                        const typeCats = categoriesObj[type];
                        if (typeCats && typeof typeCats === 'object') {
                            Object.values(typeCats).forEach((cat: any) => {
                                const brandsObj = cat.Brand || {};
                                Object.values(brandsObj).forEach((brand: any) => {
                                    const productsArr = brand.Products;
                                    if (Array.isArray(productsArr)) {
                                        productsArr.forEach((prod: any) => {
                                            flattened.push({
                                                ...prod,
                                                // Map properties to expected flat structure
                                                product_name: prod.name,
                                                brand_name: brand.name,
                                                category_name: cat.name,
                                                category_group_name: group.CategoryGrpname,
                                                min_qty: prod.Qty?.min ?? 0,
                                                max_qty: prod.Qty?.max ?? 0,
                                                // Meta IDs
                                                product_id: prod.id,
                                                brand_id: brand.id,
                                                category_id: cat.id,
                                                category_group_id: group.CategoryGroupId,
                                                stock_type: type.charAt(0).toUpperCase() + type.slice(1)
                                            });
                                        });
                                    }
                                });
                            });
                        }
                    });
                });
                console.log("📋 Flattened Products for UI:", flattened);
                setProducts(flattened);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (item: any) => {
        const id = item.id || item.product_id;
        console.log("🗑️ Attempting to delete product:", item);

        const confirmed = await showConfirm(`Are you sure you want to delete "${resolveProductName(item)}"?`);
        if (!confirmed) return;

        try {
            const res = await deleteProductAllocation(id);
            console.log("📥 Delete response:", res);

            if (res.status || res.success || res.message?.toLowerCase().includes("success")) {
                showAlert(res.message || "Product deleted successfully", 'success');

                // Optimistically remove from state to ensure UI updates even if list fetch is slow
                setProducts(prev => prev.filter(p => (p.id || p.product_id) !== id));

                // Still refresh from server to stay in sync
                await loadData();
            } else {
                showAlert(res.message || "Failed to delete product.", 'error');
            }
        } catch (err: any) {
            console.error("❌ Failed to delete product:", err);
            showAlert(err.message || "Failed to delete product.", 'error');
        }
    };

    // Helper to resolve brand name from all available sources
    const resolveBrandName = (item: any): string => {
        const directBrandName = item.brand_name || item.brandName || item.BrandName || item.brand_label || item.brand?.name || item.brand?.brand_name;
        return directBrandName || "-";
    };

    // Helper to resolve product name from all available sources
    const resolveProductName = (item: any): string => {
        const directProdName = item.product_name || item.name || item.productName || item.ProductName || item.product?.name || item.product?.product_name;
        return directProdName || "-";
    };

    // Helper to resolve category name from all available sources
    const resolveCategoryName = (item: any): string => {
        const directCatName = item.category_name || item.categoryName || item.CategoryName || item.category_list_name || item.category?.name || item.category?.category_name;
        return directCatName || "-";
    };

    // Reset to page 1 when search or limit changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, entriesPerPage]);

    const filteredProducts = products.filter(product => {
        const pName = resolveProductName(product).toLowerCase();
        const bName = resolveBrandName(product).toLowerCase();
        const cName = resolveCategoryName(product).toLowerCase();
        const term = searchTerm.toLowerCase();
        return pName.includes(term) || bName.includes(term) || cName.includes(term);
    });

    const totalEntries = filteredProducts.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + entriesPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="product-list-container">
            <div className="list-card">
                <div className="list-header">
                    <h2 className="list-title">Product List</h2>
                </div>

                <div className="search-section">
                    <div className="search-group">
                        <label>PRODUCT SEARCH</label>
                        <input
                            type="text"
                            placeholder="Type product name or model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="show-group">
                        <label>SHOW</label>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                        </select>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>S.NO</th>
                                <th>PRODUCT NAME</th>
                                <th>MIN QTY</th>
                                <th>MAX QTY</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fetching ? (
                                <tr><td colSpan={5} className="no-data">Fetching products...</td></tr>
                            ) : paginatedProducts.length > 0 ? (
                                paginatedProducts.map((product: any, index: number) => (
                                    <tr key={`${product.category_group_id}-${product.category_id}-${product.brand_id}-${product.id}`}>
                                        <td>{startIndex + index + 1}</td>
                                        <td className="product-name-cell">{resolveProductName(product)}</td>
                                        <td>{product.min_sale_qty || product.min_qty || "0"}</td>
                                        <td>{product.max_sale_qty || product.max_qty || "0"}</td>
                                        <td className="action-cell">
                                            <div className="action-btns">
                                                <button className="edit-btn" onClick={() => navigate('/add-product', { state: { editProduct: product } })} title="Edit">
                                                    <FaEdit />
                                                </button>
                                                <button className="delete-btn" onClick={() => handleDelete(product)} title="Delete">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="no-data">No products found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="pagination-footer">
                    <div className="pagination-info">
                        Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="pagination-controls">
                        <div className="go-to-page">
                            <span>Go to Page:</span>
                            <input
                                type="number"
                                value={currentPage}
                                onChange={(e) => handlePageChange(Number(e.target.value))}
                                min={1}
                                max={totalPages}
                            />
                        </div>
                        <div className="page-buttons">
                            <button
                                className="page-nav-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                &laquo;
                            </button>

                            {/* Simple Page Numbers with Ellipsis */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((p, i, arr) => (
                                    <span key={p} style={{ display: 'flex', alignItems: 'center' }}>
                                        {i > 0 && p - arr[i - 1] > 1 && <span className="pagination-ellipsis">...</span>}
                                        <button
                                            className={`page-num-btn ${currentPage === p ? 'active' : ''}`}
                                            onClick={() => handlePageChange(p)}
                                        >
                                            {p}
                                        </button>
                                    </span>
                                ))
                            }

                            <button
                                className="page-nav-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                &raquo;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
