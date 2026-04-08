import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import './DashboardView.css';

const DashboardView: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-view-page">
            <div className="preview-container">
                <div className="success-icon">
                    <CheckCircle size={64} color="#10b981" />
                </div>
                <h1 className="title">Setup Complete!</h1>
                <p className="subtitle">Your business is ready to go. Here's a glimpse of your new dashboard.</p>

                <div className="dashboard-mockup">
                    <div className="mock-header">
                        <div className="mock-logo"></div>
                        <div className="mock-nav"></div>
                    </div>
                    <div className="mock-body">
                        <div className="mock-sidebar"></div>
                        <div className="mock-content">
                            <div className="mock-widgets">
                                <div className="mock-widget"></div>
                                <div className="mock-widget"></div>
                                <div className="mock-widget"></div>
                            </div>
                            <div className="mock-chart"></div>
                        </div>
                    </div>
                </div>

                <div className="footer-action">
                    <button className="go-to-dashboard-btn" onClick={() => navigate('/analytics')}>
                        Go to Real Dashboard <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
