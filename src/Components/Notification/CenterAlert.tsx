import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Trash2, X } from 'lucide-react';
import './CenterAlert.css';

export type AlertType = 'success' | 'delete' | 'error';

interface AlertState {
    show: boolean;
    message: string;
    type: AlertType;
}

let alertTrigger: (message: string, type: AlertType) => void;

export const showAlert = (message: string, type: AlertType = 'success') => {
    if (alertTrigger) {
        alertTrigger(message, type);
    }
};

const CenterAlert: React.FC = () => {
    const [alert, setAlert] = useState<AlertState>({
        show: false,
        message: '',
        type: 'success'
    });

    const trigger = useCallback((message: string, type: AlertType) => {
        setAlert({ show: true, message, type });
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            setAlert(prev => ({ ...prev, show: false }));
        }, 3000);
    }, []);

    useEffect(() => {
        alertTrigger = trigger;
    }, [trigger]);

    if (!alert.show) return null;

    return (
        <div className="center-alert-overlay">
            <div className={`center-alert-box ${alert.type}`}>
                <div className="center-alert-icon">
                    {alert.type === 'success' && <CheckCircle size={24} />}
                    {alert.type === 'delete' && <Trash2 size={24} />}
                    {alert.type === 'error' && <X size={24} />}
                </div>
                <div className="center-alert-message">
                    {alert.message}
                </div>
            </div>
        </div>
    );
};

export default CenterAlert;
