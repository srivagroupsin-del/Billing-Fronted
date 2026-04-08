import { useState, useEffect, type ChangeEvent } from 'react';
import { getCustomers } from '../../../../api/customer.ts';
import './Selectcustomer_company.css';

interface Customer {
    id: number;
    name: string;
    email: string;
    mobile: string;
    type: string; // 'customer' | 'company'
    _id?: string; // Backend uses _id
}

interface CustomerSelectProps {
    onCustomerSelect: (customer: Customer) => void;
    onClose: () => void;
    onAddNew: () => void;
    initialCustomers?: Customer[];
}

const CustomerSelect = ({ onCustomerSelect, onClose, onAddNew, initialCustomers = [] }: CustomerSelectProps) => {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(initialCustomers);

    // Customer types for the dropdown
    const customerTypes = [
        { value: '', label: 'Choose' },
        { value: 'customer', label: 'Customer' },
        { value: 'company', label: 'Company' },
    ];

    // Filter customers based on search term and type
    useEffect(() => {
        let results = customers;

        // Filter by type if selected
        if (selectedType) {
            results = results.filter(customer => customer.type === selectedType);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(customer =>
                customer.name.toLowerCase().includes(term) ||
                customer.email.toLowerCase().includes(term) ||
                customer.mobile.includes(searchTerm)
            );
        }

        setFilteredCustomers(results);

        // Reset selection if the currently selected customer is no longer in filtered list
        if (selectedCustomerId && !results.find(c => (c._id || c.id?.toString()) === selectedCustomerId)) {
            setSelectedCustomerId('');
        }

    }, [searchTerm, selectedType, customers]);

    // Handle search input change
    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle type selection
    const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
    };

    // Handle customer selection from result dropdown
    const handleResultChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedCustomerId(e.target.value);
    };

    // Handle using the selected customer
    const handleUseCustomer = () => {
        const customer = customers.find(c => (c._id || c.id?.toString()) === selectedCustomerId);
        if (customer && onCustomerSelect) {
            onCustomerSelect(customer);
        }
    };

    // Load data on component mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                // Fetch all customers for now (or filter by type if API supports it)
                const data = await getCustomers();
                // Map backend data to frontend interface if needed
                const mappedData = data.map((c: any) => ({
                    id: c._id, // Use _id as id for internal logic if needed, or keep both
                    _id: c._id,
                    name: c.name || c.companyName || c.customerName,
                    email: c.email,
                    mobile: c.mobile || c.phone,
                    type: c.type || 'customer'
                }));
                // Combine with initialCustomers ensure no duplicates or priority
                setCustomers([...initialCustomers, ...mappedData]);
                setFilteredCustomers([...initialCustomers, ...mappedData]);
            } catch (err) {
                console.error("Failed to load customers", err);
                // Fallback to initialCustomers
                setCustomers(initialCustomers);
                setFilteredCustomers(initialCustomers);
            }
        };

        if (initialCustomers.length === 0) { // Only fetch if not provided
            fetchCustomers();
        } else {
            setCustomers(initialCustomers);
            setFilteredCustomers(initialCustomers);
        }

    }, [initialCustomers]);

    return (
        <div className="customer-select-modal">
            <div className="customer-select-container">
                {/* Header */}
                <div className="customer-select-header">
                    <h2>Select Customer / Company</h2>
                    <button className="header-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* Type Selection */}
                    <div className="form-group">
                        <label htmlFor="customer-type">Type</label>
                        <select
                            id="customer-type"
                            className="type-select"
                            value={selectedType}
                            onChange={handleTypeChange}
                        >
                            {customerTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="form-group">
                        <label htmlFor="customer-search">Search</label>
                        <input
                            id="customer-search"
                            type="text"
                            className="search-input"
                            placeholder="Type name / mobile / email..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Results Dropdown */}
                    <div className="form-group">
                        <label>Select Result</label>
                        <select
                            className="result-select"
                            value={selectedCustomerId}
                            onChange={handleResultChange}
                        >
                            <option value="">-- {filteredCustomers.length === 0 ? 'No Data' : 'Select Customer'} --</option>
                            {filteredCustomers.map(customer => (
                                <option key={customer._id || customer.id} value={customer._id || customer.id} className="customer-option">
                                    {customer.name} - {customer.mobile}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons" style={{ justifyContent: 'space-between' }}>
                        <button
                            className="btn btn-use"
                            style={{ backgroundColor: '#17a2b8', border: 'none' }}
                            onClick={() => onAddNew && onAddNew()}
                        >
                            + Add New
                        </button>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn btn-close"
                                onClick={onClose}
                            >
                                Close
                            </button>
                            <button
                                className="btn btn-use"
                                onClick={handleUseCustomer}
                                disabled={!selectedCustomerId}
                            >
                                Use This Customer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSelect;
