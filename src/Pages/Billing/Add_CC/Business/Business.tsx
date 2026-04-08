import { useState, type ChangeEvent, type FormEvent } from 'react';
import './Business.css';

interface CompanyData {
    companyName?: string;
    gstNumber?: string;
    email: string;
    phone: string;
    address: string;
    type?: string;
    id?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface CompanyFormProps {
    onSave: (data: CompanyData) => void;
    onCancel: () => void;
    initialData?: Partial<CompanyData>;
}

const CompanyForm = ({ onSave, onCancel, initialData = {} }: CompanyFormProps) => {
    const [activeTab, setActiveTab] = useState('company'); // 'customer' or 'company'
    const [formData, setFormData] = useState({
        companyName: initialData.companyName || '',
        gstNumber: initialData.gstNumber || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (activeTab === 'company') {
            if (!formData.companyName.trim()) {
                newErrors.companyName = 'Company Name is required';
            }

            if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.toUpperCase())) {
                newErrors.gstNumber = 'Please enter a valid GST number';
            }
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !/^[\d\s\-+]{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Format GST number to uppercase
        if (name === 'gstNumber') {
            setFormData(prev => ({
                ...prev,
                [name]: value.toUpperCase()
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            const saveData = {
                ...formData,
                type: activeTab,
                id: initialData.id || Date.now(),
                createdAt: initialData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (onSave) {
                onSave(saveData);
            }
        }
    };

    const handleReset = () => {
        setFormData({
            companyName: '',
            gstNumber: '',
            email: '',
            phone: '',
            address: '',
        });
        setErrors({});
    };

    return (
        <div className="company-form-modal">
            <div className="company-form-container">
                {/* Header */}
                <div className="form-header">
                    <h1>Add User / Business</h1>
                </div>

                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customer')}
                        type="button"
                    >
                        User
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
                        onClick={() => setActiveTab('company')}
                        type="button"
                    >
                        Business
                    </button>
                    <div className="tab-indicator" style={{
                        left: activeTab === 'customer' ? '0%' : '50%'
                    }} />
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Company Name Field (only for Company tab) */}
                    {activeTab === 'company' && (
                        <div className="form-group">
                            <div className="form-label">
                                <label htmlFor="companyName">
                                    <strong>Company Name</strong> <span className="required-star"></span>
                                </label>
                            </div>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                className={`form-input ${errors.companyName ? 'error' : ''}`}
                                placeholder="Enter company name"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                maxLength={100}
                            />
                            {errors.companyName && (
                                <div className="error-message">{errors.companyName}</div>
                            )}
                        </div>
                    )}

                    {/* GST Number Field (only for Company tab) */}
                    {activeTab === 'company' && (
                        <div className="form-group">
                            <div className="form-label">
                                <label htmlFor="gstNumber">
                                    <strong>GST Number</strong>
                                </label>
                            </div>
                            <input
                                type="text"
                                id="gstNumber"
                                name="gstNumber"
                                className={`form-input ${errors.gstNumber ? 'error' : ''}`}
                                placeholder="Enter GST number (15 characters)"
                                value={formData.gstNumber}
                                onChange={handleInputChange}
                                maxLength={15}
                            />
                            <div className="field-hint">Format: 22AAAAA0000A1Z5</div>
                            {errors.gstNumber && (
                                <div className="error-message">{errors.gstNumber}</div>
                            )}
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="form-group">
                        <div className="form-label">
                            <label htmlFor="email">
                                <strong>Email</strong>
                            </label>
                        </div>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder={`Enter ${activeTab} email address`}
                            value={formData.email}
                            onChange={handleInputChange}
                            maxLength={100}
                        />
                        {errors.email && (
                            <div className="error-message">{errors.email}</div>
                        )}
                    </div>

                    {/* Phone/Mobile Field */}
                    <div className="form-group">
                        <div className="form-label">
                            <label htmlFor="phone">
                                <strong>Phone / Mobile</strong>
                            </label>
                        </div>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                            placeholder="Enter phone or mobile number"
                            value={formData.phone}
                            onChange={handleInputChange}
                            maxLength={15}
                        />
                        {errors.phone && (
                            <div className="error-message">{errors.phone}</div>
                        )}
                    </div>

                    {/* Address Field */}
                    <div className="form-group">
                        <div className="form-label">
                            <label htmlFor="address">
                                <strong>Address</strong>
                            </label>
                        </div>
                        <textarea
                            id="address"
                            name="address"
                            className="form-textarea"
                            placeholder={`Enter ${activeTab} address`}
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={4}
                            maxLength={500}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <div className="primary-actions">
                            <button
                                type="button"
                                className="btn btn-reset"
                                onClick={handleReset}
                            >
                                Clear Form
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                {activeTab === 'company' ? 'Save Company' : 'Save Customer'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanyForm;