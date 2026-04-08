import { useState, type ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBusinesses } from '../../../../api/business.ts';
import './Addbilling.css';

interface Selection {
    company: string;
    store: string;
    location: string;
}

interface AddBillingProps {
    onClose: () => void;
    onStoreSelect?: (selection: Selection) => void;
}

const AddBilling = ({ onClose, onStoreSelect }: AddBillingProps) => {
    const [company, setCompany] = useState("");
    const [store, setStore] = useState("");
    const [location, setLocation] = useState("");
    const navigate = useNavigate();

    // Dynamic Data
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const data = await getBusinesses();
                // Ensure data is an array before setting state
                if (Array.isArray(data)) {
                    setCompanies(data);
                } else if (data && Array.isArray(data.data)) {
                    // Handle case where getBusinesses might return an object with a data property (though api wrapper tries to handle this)
                    setCompanies(data.data);
                } else {
                    console.error("Unexpected response format for companies:", data);
                    setCompanies([]);
                }
            } catch (err) {
                console.error("Failed to load companies", err);
            }
        };
        loadCompanies();
    }, []);

    const handleContinue = () => {
        const selection = { company, store, location };

        // Save selection to localStorage for ProfileCard/Settings to pick up
        localStorage.setItem('selectedBilling', JSON.stringify(selection));
        // Dispatch custom event to notify other components (like ProfileCard)
        window.dispatchEvent(new Event('billingSelectionChanged'));

        if (onStoreSelect) {
            onStoreSelect(selection);
        }

        onClose(); // Close the modal
        navigate('/billing/create', { state: selection }); // Navigate to the billing page with selection
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <h1 className="dashboard-title" style={{ fontSize: '1.5rem' }}>Add Billing</h1>
                <p className="dashboard-subtitle" style={{ marginBottom: '1.5rem' }}>Select a company and store to proceed.</p>

                <div className="add-billing-form-wrapper">
                    <div className="card" style={{ boxShadow: 'none', border: 'none', width: '100%', padding: '0' }}>
                        <div className="card-header1" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h2>Select Company & Store</h2>
                        </div>
                        <div className="card-body" style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                            <div className="form-group">
                                <label>Company</label>
                                <select
                                    value={company}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setCompany(e.target.value)}
                                >
                                    <option value="">-- Select --</option>
                                    {companies.map(comp => (
                                        <option key={comp.id} value={comp.id}>{comp.business_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Store</label>
                                <select
                                    disabled={!company}
                                    value={store}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStore(e.target.value)}
                                >
                                    <option value="">{company ? "-- Select Store --" : "Select company first"}</option>
                                    <option value="store1">Online Store</option>
                                    <option value="store2">Shop</option>
                                    <option value="store3">Local Door Delivery</option>
                                    <option value="store4">Import</option>
                                    <option value="store5">Export</option>
                                    {/* Map your store data here based on selected company */}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Branch</label>
                                <select
                                    disabled={!company}
                                    value={location}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocation(e.target.value)}
                                >
                                    <option value="">{company ? "-- Select Location --" : "Select company first"}</option>
                                    <option value="Gandhipuram">Gandhipuram</option>
                                    <option value="Ukkadam">Ukkadam</option>
                                    <option value="Neelambur">Neelambur</option>
                                </select>
                            </div>

                            <button
                                className="continue-btn"
                                disabled={!company || !store || !location}
                                onClick={handleContinue}
                            >
                                Continue &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddBilling;