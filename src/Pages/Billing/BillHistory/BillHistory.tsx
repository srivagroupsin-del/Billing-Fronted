import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaSearch, FaEye, FaDownload } from 'react-icons/fa';
import { fetchSalesBills, fetchSalesBillDetails } from '../../../api/sales';
import './BillHistory.css';

const BillHistory = () => {
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const isFetched = useRef(false);

    useEffect(() => {
        if (isFetched.current) return;
        isFetched.current = true;
        
        const loadBills = async () => {
            try {
                const res = await fetchSalesBills();
                let rawBills = [];
                if (res && (res.success || res.status)) {
                    rawBills = res.data?.bills || res.data || [];
                } else if (Array.isArray(res)) {
                    rawBills = res;
                }
                setBills(rawBills);
            } catch (error) {
                console.error("Error fetching bills:", error);
                setBills([]);
            } finally {
                setLoading(false);
            }
        };
        loadBills();
    }, []);

    // Search and Filter Logic
    const filteredBills = bills.filter(bill => {
        const searchStr = searchValue.toLowerCase();
        const billNo = (bill.bill_number || bill.bill_no || bill.id || '').toString().toLowerCase();
        return (
            billNo.includes(searchStr) ||
            (bill.status || '').toLowerCase().includes(searchStr) ||
            (bill.payment_method || '').toLowerCase().includes(searchStr) ||
            (bill.final_amount || '').toString().includes(searchStr)
        );
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredBills.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredBills.length);
    const currentData = filteredBills.slice(startIndex, startIndex + rowsPerPage);

    // Reset to page 1 when search or limit changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, rowsPerPage]);


    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { backgroundColor: '#dcfce7', color: '#166534' };
            case 'CANCELLED': return { backgroundColor: '#fee2e2', color: '#991b1b' };
            case 'PARTIAL_RETURN': return { backgroundColor: '#fef3c7', color: '#92400e' };
            case 'RETURNED': return { backgroundColor: '#dbeafe', color: '#1e40af' };
            default: return { backgroundColor: '#f1f5f9', color: '#475569' };
        }
    };

    return (
        <div className="bill-history-container">
            <div className="bill-history-header">
                <h2>Bill History</h2>
                <button
                    className="btn-new-bill"
                    onClick={() => navigate('/billing/create')}
                >
                    + New Bill
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Loading bills...</div>
            ) : bills.length === 0 ? (
                <div className="empty-state-card">
                    <p>No bills found. Create your first bill to get started.</p>
                    <button
                        className="btn-new-bill"
                        onClick={() => navigate('/billing/create')}
                    >
                        Create Bill
                    </button>
                </div>
            ) : (
                <>
                    <div className="table-controls-row">
                        <div className="show-entries">
                            Show 
                            <select 
                                value={rowsPerPage} 
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                            </select> 
                            entries
                        </div>
                        <div className="search-box-wrapper">
                            <FaSearch className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search Bills..." 
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bills-table-wrapper">
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Bill No</th>
                                    <th>Date</th>
                                    <th>Tax</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBills.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                            No matching bills found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentData.map((bill, index) => {
                                        const actualIndex = startIndex + index;
                                        return (
                                            <tr key={bill.id}>
                                                <td style={{ color: '#64748b', fontWeight: 600 }}>{actualIndex + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{bill.bill_number || bill.bill_no || bill.id || `#${bill.id}`}</td>
                                                <td>{bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '-'}</td>
                                                <td>₹{Number(bill.tax || 0).toFixed(2)}</td>
                                                <td style={{ fontWeight: 700, color: '#0f766e' }}>₹{Number(bill.final_amount || bill.total || 0).toFixed(2)}</td>
                                                <td>{bill.payment_method || bill.payment_mode || '-'}</td>
                                                <td>
                                                    <span
                                                        className="status-badge"
                                                        style={getStatusStyle(bill.status || 'COMPLETED')}
                                                    >
                                                        {bill.status || 'COMPLETED'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="view-btn"
                                                        style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '6px', 
                                                            padding: '6px 12px', 
                                                            backgroundColor: '#eff6ff', 
                                                            color: '#1d4ed8', 
                                                            border: '1px solid #dbeafe', 
                                                            borderRadius: '6px', 
                                                            fontSize: '13px', 
                                                            fontWeight: 600, 
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onClick={async () => {
                                                            setSelectedBill(bill);
                                                            setShowDetailModal(true);
                                                            try {
                                                                const detailRes = await fetchSalesBillDetails(bill.id);
                                                                if (detailRes && (detailRes.data || detailRes.success)) {
                                                                    const rawData = detailRes.data || detailRes;
                                                                    // If nested as { bill: ..., items: ... }, merge everything.
                                                                    if (rawData.bill && typeof rawData.bill === 'object') {
                                                                        setSelectedBill((prev: any) => ({ ...prev, ...rawData, ...rawData.bill }));
                                                                    } else {
                                                                        setSelectedBill((prev: any) => ({ ...prev, ...rawData }));
                                                                    }
                                                                } else if (detailRes && !detailRes.error) {
                                                                    setSelectedBill((prev: any) => ({ ...prev, ...detailRes }));
                                                                }
                                                            } catch (err) {
                                                                console.error("Failed to fetch detailed bill items", err);
                                                            }
                                                        }}
                                                        title="View Bill Details"
                                                    >
                                                        <FaEye size={14} /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container">
                        <div className="pagination-info">
                            Showing {filteredBills.length === 0 ? 0 : startIndex + 1} to {endIndex} of {filteredBills.length} entries
                        </div>
                        <div className="pagination-controls">
                            <div className="go-to-page">
                                Go to Page
                                <input 
                                    type="text" 
                                    value={currentPage}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val)) {
                                            const page = val === "" ? 1 : Math.max(1, Math.min(totalPages, Number(val)));
                                            setCurrentPage(page);
                                        }
                                    }}
                                />
                            </div>
                            <div className="pagination-buttons">
                                <button 
                                    className="page-btn" 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <FaChevronLeft size={12} />
                                </button>
                                <button className="page-btn active">
                                    {currentPage}
                                </button>
                                <button 
                                    className="page-btn" 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <FaChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}


            {showDetailModal && selectedBill && (
                <div className="bill-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="bill-modal-content" style={{ position: 'relative', backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <button 
                            className="close-x" 
                            onClick={() => setShowDetailModal(false)} 
                            style={{ 
                                position: 'absolute', 
                                top: '10px', 
                                right: '10px', 
                                background: 'white', 
                                border: 'none', 
                                fontSize: '24px', 
                                lineHeight: 1,
                                cursor: 'pointer', 
                                color: '#94a3b8',
                                padding: '5px',
                                borderRadius: '50%',
                                zIndex: 100,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f1f5f9';
                                e.currentTarget.style.color = '#475569';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            &times;
                        </button>
                        <div className="bill-modal-header" style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="info-icon" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>i</div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Bill Detail</h2>
                            </div>
                        </div>
                        
                        <div className="bill-modal-body" style={{ padding: '20px' }}>
                            <div className="bill-info-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Bill Number</label>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{selectedBill.bill_number || selectedBill.bill_no || selectedBill.id || `#${selectedBill.id}`}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Billing Date</label>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{selectedBill.created_at ? new Date(selectedBill.created_at).toLocaleString('en-IN') : '-'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Customer Name</label>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{selectedBill.customer_name || selectedBill.customer?.name || selectedBill.customer?.customer_name || 'Walk-in Customer'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</label>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{selectedBill.payment_method || selectedBill.payment_mode || 'CASH'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Delivery Status</label>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                        <span className="status-badge" style={{ ...getStatusStyle(selectedBill.status || 'COMPLETED'), padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                                            {selectedBill.status || 'COMPLETED'}
                                        </span>
                                    </div>
                                </div>

                            </div>

                            <div className="items-table-section">
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '12px', borderLeft: '4px solid #0f766e', paddingLeft: '10px' }}>Invoice Items</h3>
                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Product</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Price</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Qty</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedBill.items || selectedBill.bill_items || selectedBill.sale_bill_items || selectedBill.sale_items || selectedBill.sales_items || selectedBill.SaleItems || selectedBill.products || selectedBill.SaleBills || selectedBill.details || selectedBill.bill_item || selectedBill.items_list || []).map((item: any, idx: number) => {
                                                const price = Number(item.sellingPrice || item.price || item.selling_price || item.unit_price || item.rate || 0);
                                                const qty = Number(item.quantity || item.qty || 1);
                                                const total = Number(item.total || item.total_amount || item.total_price || item.subtotal || (price * qty));
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px', color: '#1e293b' }}>{item.product?.product_name || item.product_name || item.product?.name || item.name || "Product"}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{qty}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>₹{total.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="totals-section" style={{ marginTop: '20px', marginLeft: 'auto', maxWidth: '300px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', color: '#64748b' }}>
                                    <span>Subtotal:</span>
                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{Number(selectedBill.total_amount || selectedBill.subtotal || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', color: '#64748b' }}>
                                    <span>Tax Amount:</span>
                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{Number(selectedBill.tax || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: '10px', borderTop: '2px solid #f1f5f9' }}>
                                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>Grand Total:</span>
                                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#0f766e' }}>₹{Number(selectedBill.final_amount || selectedBill.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bill-modal-footer" style={{ padding: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowDetailModal(false)} style={{ padding: '10px 24px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Close</button>
                            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                                <FaDownload size={14} /> Download PDF
                            </button>
                            <button onClick={() => window.print()} style={{ padding: '10px 24px', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Print Bill</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillHistory;
