import { useState, useEffect } from 'react';
import { ChevronLeft, Briefcase, Package, Receipt, Settings, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [timeRemaining, setTimeRemaining] = useState<string>("");

    // Calculate session expiry
    useEffect(() => {
        const updateCountdown = () => {
            const loginTimestamp = localStorage.getItem('login_timestamp');
            if (!loginTimestamp) {
                setTimeRemaining("Session information not found. Please log in again.");
                return;
            }

            const now = Date.now();
            const expiryTime = 24 * 60 * 60 * 1000;
            const timeLeft = expiryTime - (now - parseInt(loginTimestamp));

            if (timeLeft <= 0) {
                setTimeRemaining("Your session has expired. You will be logged out shortly.");
            } else {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining(`Your login session is active. It will automatically expire in ${hours} hours and ${minutes} minutes (Security Policy: 24h).`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const notifications = [
        { 
            id: 5, 
            title: "Session Login", 
            count: 0, 
            description: timeRemaining,
            icon: <Clock size={20} color="#10b981" />, 
            iconBg: "#ecfdf5",
            badgeBg: "#10b981" 
        },
        { 
            id: 1, 
            title: "Business Setup", 
            count: 2, 
            description: "Complete your business profile and tax settings.",
            icon: <Briefcase size={20} color="#ef4444" />, 
            iconBg: "#fef2f2",
            badgeBg: "#ef4444" 
        },
        { 
            id: 2, 
            title: "Product", 
            count: 7, 
            description: "7 new products were added by the inventory manager.",
            icon: <Package size={20} color="#ef4444" />, 
            iconBg: "#fff1f2",
            badgeBg: "#ef4444" 
        },
        { 
            id: 3, 
            title: "Billing", 
            count: 3, 
            description: "3 invoices are pending payment confirmation.",
            icon: <Receipt size={20} color="#3b82f6" />, 
            iconBg: "#eff6ff",
            badgeBg: "#3b82f6" 
        },
        { 
            id: 4, 
            title: "Management", 
            count: 1, 
            description: "Update your store opening hours in settings.",
            icon: <Settings size={20} color="#64748b" />, 
            iconBg: "#f1f5f9",
            badgeBg: "#64748b" 
        },
    ];

    return (
        <div className="notifications-page" style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => navigate(-1)}
                        style={{ 
                            background: '#fff', 
                            border: '1px solid #e2e8f0', 
                            cursor: 'pointer',
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ChevronLeft size={20} color="#64748b" />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>Notifications</h1>
                </div>
                <button style={{ 
                    padding: '10px 20px', 
                    borderRadius: '10px', 
                    border: '1px solid #3b82f6', 
                    background: '#eff6ff', 
                    color: '#3b82f6',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}>
                    Mark All as Read
                </button>
            </div>

            <div className="notifications-grid" style={{ display: 'grid', gap: '20px' }}>
                {notifications.map((item) => (
                    <div key={item.id} style={{ 
                        padding: '24px', 
                        borderRadius: '20px', 
                        backgroundColor: '#fff', 
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                    }}
                    >
                        <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '16px', 
                            backgroundColor: item.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {item.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{item.title}</h3>
                                {item.count > 0 && (
                                    <span style={{ 
                                        backgroundColor: item.badgeBg, 
                                        color: '#fff', 
                                        padding: '2px 10px', 
                                        borderRadius: '20px', 
                                        fontSize: '12px', 
                                        fontWeight: 800 
                                    }}>
                                        {item.count} Alerts
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>{item.description}</p>
                        </div>
                        <ChevronRight color="#cbd5e1" size={24} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationsPage;
