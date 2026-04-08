import React, { useState } from "react";
import "./Business_create.css";

const BusinessForm: React.FC = () => {
    const [formData, setFormData] = useState({
        name: "",
        pan: "",
        gst: "",
        address: "",
        businessType: "",
        categories: [] as string[],
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (value: string) => {
        const updatedCategories = formData.categories.includes(value)
            ? formData.categories.filter((item) => item !== value)
            : [...formData.categories, value];

        setFormData({ ...formData, categories: updatedCategories });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Business Data:", formData);
        alert("Business Saved Successfully!");
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="business-form">
                <h2>Create Business</h2>
                <div className="form-group">
                    <label>Business Name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Enter business name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>PAN Number</label>
                    <input
                        type="text"
                        name="pan"
                        placeholder="Enter PAN number"
                        value={formData.pan}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>GST Number</label>
                    <input
                        type="text"
                        name="gst"
                        placeholder="Enter GST number"
                        value={formData.gst}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Address</label>
                    <textarea
                        name="address"
                        placeholder="Enter address"
                        value={formData.address}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Type of Business</label>
                    <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                    >
                        <option value="">Select type</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Private Limited">Private Limited</option>
                        <option value="LLP">LLP</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Business Category</label>
                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.categories.includes("Sale")}
                                onChange={() => handleCheckboxChange("Sale")}
                            />
                            Sale
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={formData.categories.includes("Service")}
                                onChange={() => handleCheckboxChange("Service")}
                            />
                            Service
                        </label>
                    </div>
                </div>

                <button type="submit" className="save-btn">
                    Save Business
                </button>
            </form>
        </div>
    );
};

export default BusinessForm;