import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateBill } from '../../../../api/sales';
import { FaMoneyBillAlt, FaCreditCard, FaMobileAlt, FaGlobe } from 'react-icons/fa';
import { showAlert } from '../../../../Components/Notification/CenterAlert';
import { showAlertModal } from '../../../../Components/Notification/ConfirmModal';
import './Payment.css';

interface BillingItem {
    productId: number;
    stockId: number | string;
    variantId: number;
    variantType: string;
    quantity: number;
    shelfId: number;
    stockTypeId: number;
    productName: string;
    sellingPrice: number;
    tax: number;
    discount: number;
    total: number;
    availableQty: number;
    warranty?: string;
}

interface CheckoutPageProps {
    selectedCustomer: any;
    billingItems: BillingItem[];
    additionalCharges?: {
        shipping: { amount: number; tax: number; };
        packaging: { amount: number; tax: number; };
    };
    grandTotal?: number;
}

const CheckoutPage = ({ selectedCustomer, billingItems, additionalCharges, grandTotal: propGrandTotal }: CheckoutPageProps) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'ONLINE'>('CASH');
    
    const subtotal = billingItems.reduce((sum, item) => sum + item.total, 0);
    const shippingTotal = additionalCharges ? (additionalCharges.shipping.amount + (additionalCharges.shipping.amount * (additionalCharges.shipping.tax / 100))) : 0;
    const packagingTotal = additionalCharges ? (additionalCharges.packaging.amount + (additionalCharges.packaging.amount * (additionalCharges.packaging.tax / 100))) : 0;
    
    const grandTotal = propGrandTotal !== undefined ? propGrandTotal : (subtotal + shippingTotal + packagingTotal);

    const handlePayNow = async () => {
        if (billingItems.length === 0) {
            showAlert("No items to bill.", "error");
            return;
        }

        // Validate quantities
        for (const item of billingItems) {
            if (item.quantity <= 0) {
                showAlert(`Invalid quantity for ${item.productName}`, "error");
                return;
            }
            if (item.quantity > item.availableQty) {
                showAlert(`Quantity for ${item.productName} exceeds available stock (${item.availableQty})`, "error");
                return;
            }
        }

        const itemsBaseAmount = billingItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
        const itemsTax = billingItems.reduce((sum, item) => sum + item.tax, 0);
        const itemsDiscount = billingItems.reduce((sum, item) => sum + item.discount, 0);

        const shippingBase = additionalCharges?.shipping?.amount || 0;
        const shippingTax = additionalCharges?.shipping?.amount ? (additionalCharges.shipping.amount * (additionalCharges.shipping.tax / 100)) : 0;
        
        const packagingBase = additionalCharges?.packaging?.amount || 0;
        const packagingTax = additionalCharges?.packaging?.amount ? (additionalCharges.packaging.amount * (additionalCharges.packaging.tax / 100)) : 0;

        const totalTax = itemsTax + shippingTax + packagingTax;
        const totalBase = itemsBaseAmount + shippingBase + packagingBase;
        const totalDiscount = itemsDiscount;

        setLoading(true);
        try {
            const payload = {
                customer_phone: selectedCustomer?.mobile || selectedCustomer?.phone || "N/A",
                customer_name: selectedCustomer?.name || "Walk-in",
                total_amount: totalBase,
                discount: totalDiscount,
                tax: totalTax,
                final_amount: grandTotal,
                payment_method: paymentMode,
                items: billingItems.map(item => ({
                    product_id: item.productId,
                    stock_id: item.stockId,
                    variant_id: item.variantId,
                    stock_type_id: item.stockTypeId,
                    price: item.sellingPrice,
                    qty: item.quantity,
                    total: item.total
                })),
            };

            const result = await generateBill(payload);

            if (result && (result.success || result.status)) {
                await showAlertModal(`✅ Bill generated successfully!\n\nBill No: ${result.data?.bill_no || result.data?.id || 'N/A'}\nTotal: ₹${(result.data?.final_amount || grandTotal).toFixed(2)}`, 'Success');
                navigate('/billing/invoices');
            } else {
                showAlert(`❌ Failed: ${result?.message || 'Unknown error'}`, "error");
            }
        } catch (error: any) {
            console.error("Payment failed", error);
            showAlert(`Payment failed: ${error.message || 'Please try again.'}`, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            {/* Top Header Section */}
            <header className="info-bar">
                <div className="info-row">
                    <span><strong>Customer:</strong> {selectedCustomer?.name || "Walk-in"}</span>
                    <span><strong>Mobile:</strong> {selectedCustomer?.mobile || "N/A"}</span>
                </div>
            </header>

            {/* Main Content Card */}
            <div className="checkout-card">
                <div className="card-header">
                    Review Items & Select Payment
                </div>

                <div className="card-body">
                    <h3>Items ({billingItems.length})</h3>
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Variant</th>
                                <th>Warranty</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billingItems.map((item, idx) => (
                                <tr key={`${item.productId}-${item.variantType}-${item.shelfId}`}>
                                    <td>{idx + 1}</td>
                                    <td>{item.productName}</td>
                                    <td>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            backgroundColor: item.variantType === 'original' ? '#dcfce7' : item.variantType === 'import' ? '#dbeafe' : '#fef3c7',
                                            color: item.variantType === 'original' ? '#166534' : item.variantType === 'import' ? '#1e40af' : '#92400e',
                                        }}>
                                            {item.variantType}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '13px' }}>{item.warranty || '-'}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                                    <td>₹{item.sellingPrice.toFixed(2)}</td>
                                    <td style={{ fontWeight: 600 }}>₹{item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="totals-section">
                        <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                        {shippingTotal > 0 && <p>Shipping: ₹{shippingTotal.toFixed(2)}</p>}
                        {packagingTotal > 0 && <p>Packaging: ₹{packagingTotal.toFixed(2)}</p>}
                        <h2 className="grand-total">Grand Total: ₹{grandTotal.toFixed(2)}</h2>
                    </div>

                    <hr className="divider" />

                    {/* Payment Method Section */}
                    <div className="payment-section">
                        <h3 className="section-title">Payment Method</h3>
                        <div className="payment-grid">
                            {(['CASH', 'CARD', 'UPI', 'ONLINE'] as const).map((method) => (
                                <label key={method} className={`payment-card ${paymentMode === method ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value={method}
                                        checked={paymentMode === method}
                                        onChange={() => setPaymentMode(method)}
                                        className="hidden-radio"
                                    />
                                    <div className="payment-card-content">
                                        <div className="payment-icon">
                                            {method === 'CASH' && <FaMoneyBillAlt size={24} color="#22c55e" />}
                                            {method === 'CARD' && <FaCreditCard size={24} color="#3b82f6" />}
                                            {method === 'UPI' && <FaMobileAlt size={24} color="#f59e0b" />}
                                            {method === 'ONLINE' && <FaGlobe size={24} color="#6366f1" />}
                                        </div>
                                        <span className="method-name">{method}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="payment-actions">
                        <button
                            className="pay-btn"
                            onClick={handlePayNow}
                            disabled={loading || billingItems.length === 0}
                        >
                            {loading ? 'Processing...' : `Pay Now ₹${grandTotal.toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;