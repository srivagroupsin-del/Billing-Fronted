import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Plus, Eye } from "lucide-react";
import { createPortal } from "react-dom";
import { getStocks, deleteStock, getStockById } from "../../../api/stock";
import { showAlert } from "../../../Components/Notification/CenterAlert";
import { showConfirm } from "../../../Components/Notification/ConfirmModal";
import "./productstock.css";

interface StockItem {
    id: number;
    supplier: string;
    supplier_name?: string;
    category: string;
    brand: string;
    product: string;
    product_name?: string;
    qty: string;
    total_qty?: string | number;
    variant_qty?: string | number;
    quantity?: string | number;
    stock?: string | number;
    stock_qty?: string | number;
    minStock: string;
    min_qty?: string | number;
    min_sale_qty?: string | number;
    min_purchase_qty?: string | number;
    maxStock: string;
    max_qty?: string | number;
    max_sale_qty?: string | number;
    max_purchase_qty?: string | number;
    available_qty?: string | number;
    total_stock?: string | number;
    variants: any[];
    date: string;
}

const StockList: React.FC = () => {
    const navigate = useNavigate();
    const [stockList, setStockList] = useState<StockItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const isFetched = React.useRef(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log("🚀 Fetching Stocks from API...");
            const res = await getStocks();
            console.log("📥 Stocks API Response:", res);
            
            if (res && (res.success || res.status)) {
                // Support both { data: [...] } and { data: { stocks: [...] } }
                const data = res.data?.stocks || res.data || [];
                setStockList(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch stocks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFetched.current) return;
        isFetched.current = true;
        fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm("Are you sure you want to delete this stock entry?");
        if (confirmed) {
            try {
                const res = await deleteStock(id);
                if (res.status || res.success) {
                    showAlert("Stock entry deleted successfully", "success");
                    // Refresh the list from the server to ensure consistency
                    fetchData();
                    
                    // Also update local storage if it's being used
                    const savedStock = localStorage.getItem("stock_data");
                    if (savedStock) {
                        const stockListLocal = JSON.parse(savedStock);
                        const updatedList = stockListLocal.filter((item: any) => item.id !== id);
                        localStorage.setItem("stock_data", JSON.stringify(updatedList));
                    }
                } else {
                    showAlert(res.message || "Failed to delete stock entry", "error");
                }
            } catch (error) {
                console.error("Error deleting stock:", error);
                showAlert("An error occurred while deleting the stock entry", "error");
            }
        }
    };

    const handleEdit = async (item: StockItem) => {
        try {
            // Resolve the correct ID for the detail API
            const resolvedId = item.id || (item as any).stock_id || (item as any).actual_id;
            if (!resolvedId) {
                console.warn("⚠️ No ID found for stock item. Using raw item for edit.");
                navigate("/stock-entry", { state: { editItem: item } });
                return;
            }

            console.log(`🔍 Fetching details for Stock ID: ${resolvedId}...`);
            const res = await getStockById(resolvedId);
            if (res && (res.success || res.status)) {
                let detailItem = res.data || res;
                // If the detail API returns an array (common pattern), take the first item
                if (Array.isArray(detailItem)) {
                    detailItem = detailItem[0];
                }
                navigate("/stock-entry", { state: { editItem: detailItem } });
            } else {
                // Fallback to list item if detail fetch fails
                navigate("/stock-entry", { state: { editItem: item } });
            }
        } catch (error) {
            console.error("Failed to fetch full stock details:", error);
            // Fallback to list item
            navigate("/stock-entry", { state: { editItem: item } });
        }
    };

    const handleViewLocation = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    // Resolve product name: prioritized saved name -> raw value
    const resolveProductName = (item: any): string => {
        return item.product_name || item.product?.product_name || item.product?.name || (typeof item.product === 'string' ? item.product : "") || "Unknown Product";
    };

    // Resolve supplier name: prioritized saved name -> raw value
    const resolveSupplierName = (item: any): string => {
        return item.supplier_name || item.supplier?.supplier_name || item.supplier?.name || (typeof item.supplier === 'string' ? item.supplier : "") || "Unknown Supplier";
    };

    const resolveDate = (item: any): string => {
        if (item.date) return item.date;
        if (item.created_at) return new Date(item.created_at).toLocaleDateString();
        if (item.updated_at) return new Date(item.updated_at).toLocaleDateString();
        return "-";
    };

    // Filter logic
    const filteredList = stockList.filter(item => {
        const pName = resolveProductName(item).toLowerCase();
        const sName = resolveSupplierName(item).toLowerCase();
        const search = searchTerm.toLowerCase();
        return pName.includes(search) || sName.includes(search);
    });

    const totalEntries = filteredList.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredList.slice(indexOfFirstEntry, indexOfLastEntry);

    if (loading) return <div className="stock-container"><div className="loading">Loading stock entries...</div></div>;

    return (
        <div className="stock-container">
            <div className="stock-table-card">
                <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <h2 style={{ margin: 0 }}>Stock List</h2>
                </div>

                <div className="table-controls top">
                    <div className="search-control">
                        <label>PRODUCT SEARCH</label>
                        <input
                            type="text"
                            placeholder="Type product name or model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="entries-control">
                        <label>SHOW</label>
                        <select value={entriesPerPage} onChange={(e) => {
                            setEntriesPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                        </select>
                    </div>
                </div>

                <div className="table-wrapper">
                    {currentEntries.length > 0 ? (
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Date</th>
                                    <th>Supplier</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Variants</th>
                                    <th>Storage Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEntries.map((item, idx) => (
                                    <tr key={item.id || idx}>
                                        <td style={{ color: "#666", fontWeight: "600", fontSize: "0.85rem" }}>{indexOfFirstEntry + idx + 1}</td>
                                        <td style={{ color: "#888", fontSize: "0.85rem" }}>{resolveDate(item)}</td>
                                        <td>{resolveSupplierName(item)}</td>
                                        <td style={{ fontWeight: "600", color: "#333" }}>{resolveProductName(item)}</td>
                                        <td>
                                            <span className="qty-badge">
                                                {(() => {
                                                    // 1. Direct fields
                                                    const directQty = item.variant_qty || item.total_qty || item.qty || item.quantity || item.stock || item.stock_qty || item.available_qty || item.total_stock;
                                                    if (directQty && directQty !== "0" && directQty !== 0) return directQty;

                                                    // 2. Nested in product
                                                    if (typeof item.product === 'object' && item.product !== null) {
                                                        const prodQty = (item.product as any).qty || (item.product as any).quantity || (item.product as any).stock;
                                                        if (prodQty && prodQty !== "0" && prodQty !== 0) return prodQty;
                                                    }

                                                    // 3. Sum of variants
                                                    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
                                                        const sum = item.variants.reduce((acc, v) => acc + (Number(v.qty) || Number(v.quantity) || 0), 0);
                                                        if (sum > 0) return sum;
                                                    }

                                                    return "0";
                                                })()}
                                            </span>
                                        </td>
                                         <td>
                                            {item.variants && item.variants.length > 0 ? (
                                                <div className="variant-tags">
                                                    {item.variants.map((v: any, i: number) => {
                                                        const name = v.variant_name || v.name || v.variantType || v.variant_type?.name || (typeof v === 'string' ? v : "Variant");
                                                        return <span key={i} className="variant-tag">{name}</span>;
                                                    })}
                                                </div>
                                            ) : "-"}
                                        </td>
                                         <td>
                                            <button className="view-btn" onClick={() => handleViewLocation(item)} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '5px',
                                                padding: '6px 12px',
                                                backgroundColor: '#f3f4f6',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                color: '#374151',
                                                fontSize: '0.8rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}>
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="edit-icon-btn" title="Edit" onClick={() => handleEdit(item)}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="delete-icon-btn" title="Delete" onClick={() => handleDelete(item.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <Plus size={48} style={{ opacity: 0.2, marginBottom: "15px" }} />
                            <p>No stock entries found matching your search.</p>
                        </div>
                    )}
                </div>

                {filteredList.length > 0 && (
                    <div className="table-controls bottom">
                        <div className="showing-info">
                            Showing {totalEntries === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries
                        </div>
                        <div className="pagination">
                            <div className="go-to-page">
                                <label>Go to Page:</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val >= 1 && val <= totalPages) setCurrentPage(val);
                                    }}
                                />
                            </div>
                            <button
                                className="page-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                &laquo;
                            </button>
                            <button className="page-btn active-page">{currentPage}</button>
                            <button
                                className="page-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                &raquo;
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && createPortal(
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div className="modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '1px solid #f3f4f6',
                            paddingBottom: '15px'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Storage Location Details</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#9ca3af'
                            }}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ color: '#374151' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Product</label>
                                <div style={{ fontWeight: 500 }}>{resolveProductName(selectedItem)}</div>
                            </div>
                            
                            <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Location Path</label>
                                {(() => {
                                    const loc = selectedItem?.storage_location || selectedItem?.location;
                                    if (!loc) return <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No location information available</div>;
                                    
                                    // 1. Check for explicit full_path (e.g. "d → e5")
                                    const fullPath = loc.full_path || (typeof loc === 'string' && loc.includes('→') ? loc : null);
                                    
                                    if (fullPath) {
                                        const pathLevels = String(fullPath).split(/[→>]/).map(s => s.trim());
                                        return (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                                {pathLevels.map((level, i) => (
                                                    <React.Fragment key={i}>
                                                        <span style={{ 
                                                            padding: '4px 10px', 
                                                            backgroundColor: 'white', 
                                                            border: '1px solid #e5e7eb', 
                                                            borderRadius: '6px',
                                                            fontSize: '0.85rem'
                                                        }}>{level}</span>
                                                        {i < pathLevels.length - 1 && <span style={{ color: '#9ca3af' }}>&rarr;</span>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        );
                                    }

                                    // 2. Fallback to nested structure
                                    const levels = [];
                                    if (loc.warehouse) levels.push(loc.warehouse.name || loc.warehouse);
                                    if (loc.room) levels.push(loc.room.name || loc.room);
                                    if (loc.shelf) levels.push(loc.shelf.name || loc.shelf);
                                    if (loc.position) levels.push(loc.position.name || loc.position);
                                    
                                    if (levels.length > 0) {
                                        return (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                                {levels.map((level, i) => (
                                                    <React.Fragment key={i}>
                                                        <span style={{ 
                                                            padding: '4px 10px', 
                                                            backgroundColor: 'white', 
                                                            border: '1px solid #e5e7eb', 
                                                            borderRadius: '6px',
                                                            fontSize: '0.85rem'
                                                        }}>{level}</span>
                                                        {i < levels.length - 1 && <span style={{ color: '#9ca3af' }}>&rarr;</span>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        );
                                    }
                                    
                                    return <div style={{ fontWeight: 600, color: '#2563eb' }}>{loc.name || loc.location_name || loc}</div>;
                                })()}
                            </div>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsModalOpen(false)} style={{
                                padding: '10px 20px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}>Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StockList;

