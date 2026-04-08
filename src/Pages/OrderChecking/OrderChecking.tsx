import { Package, Search, Filter, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderChecking = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginBottom: '20px', fontWeight: '600' }}
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '8px' }}>Order Checking</h1>
                        <p style={{ color: '#64748b' }}>Verify and track all placed orders</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                style={{ padding: '10px 16px 10px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '280px' }}
                            />
                        </div>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>
                            <Filter size={18} /> Filter
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                    <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Package size={40} style={{ margin: '0 auto' }} />
                    </div>
                    <h3>No orders found</h3>
                    <p>When orders are placed, they will appear here for verification.</p>
                </div>
            </div>
        </div>
    );
};

export default OrderChecking;
