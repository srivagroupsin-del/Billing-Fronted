import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, Check, Plus, AlertCircle } from 'lucide-react';
import { getBusinesses } from '../../api/business';
import { selectBusiness } from '../../api/auth';
import './BusinessSelection.css';

const ICON_COLORS = ['blue', 'green', 'purple', 'orange', 'rose', 'teal'];

const BusinessSelection = () => {
    const navigate = useNavigate();

    const [businessList, setBusinessList] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [selectedName, setSelectedName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSelecting, setIsSelecting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Fetch businesses on mount
    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const data = await getBusinesses();
                console.log('🏢 [BusinessSelection] Fetched businesses:', data);

                if (Array.isArray(data)) {
                    setBusinessList(data);
                } else if (data?.data && Array.isArray(data.data)) {
                    setBusinessList(data.data);
                } else {
                    setBusinessList([]);
                }
            } catch (error) {
                console.error('❌ [BusinessSelection] Failed to fetch businesses:', error);
                showToast('Failed to load businesses', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBusinesses();
    }, []);

    // Handle business selection and continue
    const handleContinue = async () => {
        if (!selectedId) return;

        setIsSelecting(true);
        try {
            console.log(`🔌 [BusinessSelection] Selecting Business ID: ${selectedId}`);
            const response = await selectBusiness({ business_id: selectedId });

            // Save business ID
            localStorage.setItem('business_id', selectedId);
            localStorage.setItem('business_name', selectedName);

            // Save the business-specific token
            const businessToken = response.token || response?.data?.token;
            if (businessToken) {
                localStorage.setItem('token', businessToken);
                console.log('🎟️ [BusinessSelection] Business token saved');
            }

            showToast(`"${selectedName}" selected successfully!`, 'success');

            // Navigate to dashboard after a short delay
            setTimeout(() => {
                navigate('/analytics', { replace: true });
            }, 600);
        } catch (error: any) {
            console.error('❌ [BusinessSelection] Selection failed:', error);
            showToast('Selection failed: ' + (error.message || 'Unknown error'), 'error');
            setIsSelecting(false);
        }
    };

    return (
        <div className="bs-page">
            <div className="bs-overlay"></div>

            <div className="bs-container">
                {/* Header */}
                <div className="bs-header">
                    <div className="bs-logo-icon">
                        <Building size={28} />
                    </div>
                    <h1>Select Your Business</h1>
                    <p>Choose the business you want to work with today</p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="bs-loading">
                        <div className="bs-loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span className="bs-loading-text">Loading your businesses...</span>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && businessList.length === 0 && (
                    <div className="bs-empty">
                        <div className="bs-empty-icon">
                            <AlertCircle size={28} />
                        </div>
                        <h3>No businesses found</h3>
                        <p>It looks like you haven't created a business yet. Create one to get started.</p>
                        <button
                            className="bs-btn-create"
                            onClick={() => navigate('/business-create')}
                        >
                            <Plus size={16} />
                            Create Business
                        </button>
                    </div>
                )}

                {/* Business Grid */}
                {!isLoading && businessList.length > 0 && (
                    <>
                        <div className="bs-grid">
                            {businessList.map((biz, index) => {
                                const id = String(biz.id || biz.business_id);
                                const name = biz.business_name || biz.name || 'Unnamed';
                                const desc = biz.description || biz.business_type || biz.email || 'Business Account';
                                const isSelected = selectedId === id;

                                return (
                                    <div
                                        key={id}
                                        className={`bs-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedId(id);
                                            setSelectedName(name);
                                        }}
                                    >
                                        <div className="bs-card-top">
                                            <div className={`bs-card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                                <Building size={20} />
                                            </div>
                                            <div className="bs-card-texts">
                                                <div className="bs-card-name">{name}</div>
                                                <div className="bs-card-desc">{desc}</div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="bs-card-check">
                                                <Check size={14} color="white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Continue Button */}
                        <div className="bs-actions">
                            <button
                                className="bs-btn-continue"
                                disabled={!selectedId || isSelecting}
                                onClick={handleContinue}
                            >
                                {isSelecting ? (
                                    <>
                                        <div className="bs-spinner"></div>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="bs-footer">
                    <p>© 2026 BillFlow Systems. All rights reserved.</p>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`bs-toast ${toast.type}`}>
                    {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default BusinessSelection;
