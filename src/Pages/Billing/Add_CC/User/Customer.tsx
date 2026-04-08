import { useState, type ChangeEvent, type FormEvent } from 'react';
import './Customer.css';

interface CustomerData {
    customerName: string;
    mobile: string;
    email: string;
    address: string;
    id?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface CustomerFormProps {
    onSave: (data: CustomerData) => void;
    onCancel: () => void;
    initialData?: Partial<CustomerData>;
}

const CustomerForm = ({ onSave, onCancel, initialData = {} }: CustomerFormProps) => {
    const [formData, setFormData] = useState({
        customerName: initialData.customerName || '',
        mobile: initialData.mobile || '',
        email: initialData.email || '',
        address: initialData.address || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerName.trim()) {
            newErrors.customerName = 'Customer Name is required';
        }

        if (!formData.mobile.trim()) {
            newErrors.mobile = 'Mobile is required';
        } else if (!/^\d{10,15}$/.test(formData.mobile.replace(/\D/g, ''))) {
            newErrors.mobile = 'Please enter a valid mobile number';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

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
            const customerData = {
                ...formData,
                id: initialData.id || Date.now(), // Generate ID if new
                createdAt: initialData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (onSave) {
                onSave(customerData);
            }
        }
    };

    const handleReset = () => {
        setFormData({
            customerName: '',
            mobile: '',
            email: '',
            address: '',
        });
        setErrors({});
    };

    return (
        <div className="customer-form-modal">
            <div className="customer-form-container">
                {/* Header */}
                <div className="form-header">
                    <h1>Add User / Business</h1>
                    <div className="form-subtitle">
                        Fields marked with * are required
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Customer Name Field */}
                    <div className="form-group">
                        <div className="form-label">
                            <label htmlFor="customerName">
                                <strong>User Name</strong> <span className="required-star"></span>
                            </label>
                        </div>
                        <input
                            type="text"
                            id="customerName"
                            name="customerName"
                            className={`form-input ${errors.customerName ? 'error' : ''}`}
                            placeholder="Enter customer or company name"
                            value={formData.customerName}
                            onChange={handleInputChange}
                            maxLength={100}
                        />
                        {errors.customerName && (
                            <div className="error-message">{errors.customerName}</div>
                        )}
                    </div>

                    {/* Mobile Field */}
                    <div className="form-group">
                        <div className="form-label">
                            <label htmlFor="mobile">
                                <strong>Mobile</strong> <span className="required-star">*</span>
                            </label>
                        </div>
                        <input
                            type="tel"
                            id="mobile"
                            name="mobile"
                            className={`form-input ${errors.mobile ? 'error' : ''}`}
                            placeholder="Enter mobile number"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            maxLength={15}
                        />
                        {errors.mobile && (
                            <div className="error-message">{errors.mobile}</div>
                        )}
                    </div>

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
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleInputChange}
                            maxLength={100}
                        />
                        {errors.email && (
                            <div className="error-message">{errors.email}</div>
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
                            placeholder="Enter complete address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={4}
                            maxLength={500}
                        />
                    </div>

                    {/* Divider */}
                    <div className="form-divider">
                        <hr />
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
                                Clear
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm;