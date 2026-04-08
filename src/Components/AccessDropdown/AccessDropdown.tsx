import React from 'react';
import { useAccessStore } from './accessStore';
import './AccessDropdown.css';

const AccessDropdown: React.FC = () => {
    // Connect to Zustand store
    const { selectedAccess, addAccess, removeAccess } = useAccessStore();

    // Define available options
    const accessOptions = ["Read", "Write", "Admin"];

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value && !selectedAccess.includes(value)) {
            addAccess(value);
        }
        // Reset the select value to empty so it doesn't stay on an option
        // (This allows selecting the same one again after removal)
        e.target.value = "";
    };

    return (
        <div className="access-dropdown-container">
            <label className="access-label">Access Level</label>
            
            <div className="access-select-wrapper">
                <select 
                    className="access-select" 
                    defaultValue="" 
                    onChange={handleSelect}
                >
                    <option value="" disabled>Choose access rights...</option>
                    {accessOptions.map((option) => (
                        <option 
                            key={option} 
                            value={option}
                            disabled={selectedAccess.includes(option)}
                        >
                            {option} {selectedAccess.includes(option) ? '(Selected)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className="chips-container">
                {selectedAccess.length > 0 ? (
                    selectedAccess.map((access) => (
                        <div key={access} className="access-chip">
                            <span>{access}</span>
                            <button 
                                className="remove-chip-btn" 
                                onClick={() => removeAccess(access)}
                                title={`Remove ${access}`}
                            >
                                &times;
                            </button>
                        </div>
                    ))
                ) : (
                    <span className="no-selection-text">No access rights assigned.</span>
                )}
            </div>
        </div>
    );
};

export default AccessDropdown;
