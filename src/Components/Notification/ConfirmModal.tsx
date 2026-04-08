import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmState {
    show: boolean;
    title: string;
    message: string;
    isAlert?: boolean;
    resolve: ((value: boolean) => void) | null;
}

let confirmTrigger: (title: string, message: string, isAlert?: boolean) => Promise<boolean>;

export const showConfirm = (message: string, title: string = 'Confirmation'): Promise<boolean> => {
    if (confirmTrigger) {
        return confirmTrigger(title, message, false);
    }
    return Promise.resolve(window.confirm(message));
};

export const showAlertModal = (message: string, title: string = 'Alert'): Promise<boolean> => {
    if (confirmTrigger) {
        return confirmTrigger(title, message, true);
    }
    window.alert(message);
    return Promise.resolve(true);
};

const ConfirmModal: React.FC = () => {
    const [state, setState] = useState<ConfirmState>({
        show: false,
        title: '',
        message: '',
        resolve: null
    });

    const trigger = useCallback((title: string, message: string, isAlert: boolean = false): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                show: true,
                title,
                message,
                isAlert,
                resolve
            });
        });
    }, []);

    useEffect(() => {
        confirmTrigger = trigger;
    }, [trigger]);

    const handleConfirm = () => {
        if (state.resolve) state.resolve(true);
        setState(prev => ({ ...prev, show: false, resolve: null }));
    };

    const handleCancel = () => {
        if (state.resolve) state.resolve(false);
        setState(prev => ({ ...prev, show: false, resolve: null }));
    };

    if (!state.show) return null;

    const isSuccess = state.title?.toLowerCase() === 'success';

    return (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
            <div className="confirm-modal-box" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-header">
                    <div className="confirm-modal-icon" style={{ backgroundColor: isSuccess ? '#dcfce7' : '#fef3c7' }}>
                        {isSuccess ? (
                            <CheckCircle size={24} color="#22c55e" />
                        ) : (
                            <AlertTriangle size={24} color="#f59e0b" />
                        )}
                    </div>
                    <h3 className="confirm-modal-title">{state.title}</h3>
                </div>
                
                <div className="confirm-modal-content">
                    <p className="confirm-modal-message">{state.message}</p>
                </div>

                <div className="confirm-modal-footer">
                    {!state.isAlert && (
                        <button className="confirm-btn-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                    )}
                    <button 
                        className="confirm-btn-ok" 
                        onClick={handleConfirm} 
                        style={{ 
                            width: state.isAlert ? '100%' : '100px',
                            backgroundColor: isSuccess ? '#22c55e' : '#ef4444',
                            boxShadow: isSuccess ? '0 4px 6px -1px rgba(34, 197, 94, 0.2)' : '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
