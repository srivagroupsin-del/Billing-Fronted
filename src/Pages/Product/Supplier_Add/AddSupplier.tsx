import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddSupplier.css";
import { createSupplier, listSuppliers, updateSupplier, deleteSupplier } from "../../../api/supplier";
import type { SupplierPayload } from "../../../api/supplier";
import { showAlert } from "../../../Components/Notification/CenterAlert";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";

const AddSupplier: React.FC = () => {
    const navigate = useNavigate();
    const [sameAddress, setSameAddress] = useState(false);
    const [supplierName, setSupplierName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [emailId, setEmailId] = useState("");
    const [panNumber, setPanNumber] = useState("");
    const [withGst, setWithGst] = useState(true);
    const [gstNumber, setGstNumber] = useState("");
    const [branchesList, setBranchesList] = useState<{ branch_name: string, phone: string }[]>([{ branch_name: '', phone: '' }]);
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Address States
    const [permAddr1, setPermAddr1] = useState("");
    const [permAddr2, setPermAddr2] = useState("");
    const [permCity, setPermCity] = useState("");
    const [permState, setPermState] = useState("");
    const [permPincode, setPermPincode] = useState("");

    const [currAddr1, setCurrAddr1] = useState("");
    const [currAddr2, setCurrAddr2] = useState("");
    const [currCity, setCurrCity] = useState("");
    const [currState, setCurrState] = useState("");
    const [currPincode, setCurrPincode] = useState("");

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await listSuppliers();
            if (response) {
                let suppliersArray: any[] = [];
                if (Array.isArray(response)) {
                    suppliersArray = response;
                } else if (response.data && Array.isArray(response.data)) {
                    suppliersArray = response.data;
                } else if (response.suppliers && Array.isArray(response.suppliers)) {
                    suppliersArray = response.suppliers;
                } else if (response.data?.suppliers && Array.isArray(response.data.suppliers)) {
                    suppliersArray = response.data.suppliers;
                }
                setSuppliers(suppliersArray);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const resetForm = () => {
        setSupplierName("");
        setCompanyName("");
        setPhoneNumber("");
        setEmailId("");
        setPanNumber("");
        setWithGst(true);
        setGstNumber("");
        setBranchesList([{ branch_name: '', phone: '' }]);
        setPermAddr1("");
        setPermAddr2("");
        setPermCity("");
        setPermState("");
        setPermPincode("");
        setCurrAddr1("");
        setCurrAddr2("");
        setCurrCity("");
        setCurrState("");
        setCurrPincode("");
        setSameAddress(false);
        setEditingId(null);
        setCurrentStep(1);
    };

    // Sync Logic
    const handleSave = async () => {
        if (!supplierName || !phoneNumber) {
            showAlert("Supplier Name and Phone Number are required", "error");
            return;
        }

        const payload: SupplierPayload = {
            supplier_details: {
                supplier_name: supplierName,
                company_name: companyName,
                phone_number: phoneNumber,
                email_id: emailId,
                pan_number: panNumber,
                gst_status: {
                    with_gst: withGst,
                    gst_number: withGst ? gstNumber : ""
                }
            },
            branches: branchesList,
            addresses: {
                permanent_address: {
                    address_line_1: permAddr1,
                    address_line_2: permAddr2,
                    city: permCity,
                    state: permState,
                    pincode: permPincode
                },
                current_address: {
                    address_line_1: currAddr1,
                    address_line_2: currAddr2,
                    city: currCity,
                    state: currState,
                    pincode: currPincode
                }
            }
        };

        setLoading(true);
        try {
            const response = editingId 
                ? await updateSupplier(editingId, payload)
                : await createSupplier(payload);

            if (response.status) {
                showAlert(response.message || `Supplier ${editingId ? "updated" : "added"} successfully`, "success");
                resetForm();
                fetchSuppliers();
            } else {
                showAlert(response.message || `Failed to ${editingId ? "update" : "add"} supplier`, "error");
            }
        } catch (error) {
            console.error("Error saving supplier:", error);
            showAlert("Something went wrong while saving the supplier", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSameAddressToggle = () => {
        const newState = !sameAddress;
        setSameAddress(newState);
        if (newState) {
            setCurrAddr1(permAddr1);
            setCurrAddr2(permAddr2);
            setCurrCity(permCity);
            setCurrState(permState);
            setCurrPincode(permPincode);
        }
    };

    const handleEdit = (supplier: any) => {
        setEditingId(supplier.id);

        const details = supplier.supplier_details || {};
        const backendBranches = supplier.branches && supplier.branches.length > 0
            ? supplier.branches 
            : [{ branch_name: supplier.branch_name || supplier.branchName || "", phone: supplier.phone || "" }];
        setBranchesList(backendBranches);

        const addrs = supplier.addresses || {};
        const perm = addrs.permanent_address || {};
        const curr = addrs.current_address || {};

        setSupplierName(details.supplier_name || supplier.supplier_name || supplier.supplierName || supplier.name || "");
        setCompanyName(details.company_name || supplier.company_name || supplier.companyName || supplier.company || "");
        setPhoneNumber(details.phone_number || supplier.phone_number || supplier.phoneNumber || supplier.phone || "");
        setEmailId(details.email_id || supplier.email_id || supplier.emailId || supplier.email || "");
        setPanNumber(details.pan_number || supplier.pan_number || supplier.panNumber || supplier.pan || "");
        
        const gst = details.gst_status || supplier.gst_status || {};
        setWithGst(!!gst.with_gst || !!supplier.gstStatus);
        setGstNumber(gst.gst_number || supplier.gst_number || supplier.gstNumber || "");
        
        setPermAddr1(perm.address_line_1 || supplier.permanent_address?.address_line_1 || supplier.permanentAddress?.addressLine1 || "");
        setPermAddr2(perm.address_line_2 || supplier.permanent_address?.address_line_2 || supplier.permanentAddress?.addressLine2 || "");
        setPermCity(perm.city || supplier.permanentAddress?.city || "");
        setPermState(perm.state || supplier.permanentAddress?.state || "");
        setPermPincode(perm.pincode || supplier.permanentAddress?.pincode || "");

        setCurrAddr1(curr.address_line_1 || supplier.current_address?.address_line_1 || supplier.currentAddress?.addressLine1 || "");
        setCurrAddr2(curr.address_line_2 || supplier.current_address?.address_line_2 || supplier.currentAddress?.addressLine2 || "");
        setCurrCity(curr.city || supplier.currentAddress?.city || "");
        setCurrState(curr.state || supplier.currentAddress?.state || "");
        setCurrPincode(curr.pincode || supplier.currentAddress?.pincode || "");
        
        setCurrentStep(1); // Jump to first step to review flow

        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number | string) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) return;

        try {
            const response = await deleteSupplier(id);
            if (response.status) {
                showAlert("Supplier deleted successfully", "success");
                fetchSuppliers();
            } else {
                showAlert(response.message || "Failed to delete supplier", "error");
            }
        } catch (error) {
            console.error("Error deleting supplier:", error);
            showAlert("Error deleting supplier", "error");
        }
    };

    return (
        <div className="supplier-container">
            <div className="supplier-card">
                <h2 className="page-title">{editingId ? "Edit Supplier" : "Add Supplier"}</h2>

                {/* Progress Stepper */}
                <div className="stepper-header">
                    <div className={`step-item ${currentStep >= 1 ? "active" : ""}`}>
                        <div className="step-circle">1</div>
                        <span>GST Info</span>
                    </div>
                    <div className="step-divider" />
                    <div className={`step-item ${currentStep >= 2 ? "active" : ""}`}>
                        <div className="step-circle">2</div>
                        <span>Basic Details</span>
                    </div>
                    <div className="step-divider" />
                    <div className={`step-item ${currentStep >= 3 ? "active" : ""}`}>
                        <div className="step-circle">3</div>
                        <span>Branch & Address</span>
                    </div>
                </div>

                <div className="divider" />

                {/* Step 1: GST Info */}
                {currentStep === 1 && (
                    <div className="step-content">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>GST Status</label>
                                <div className="gst-switch-container">
                                    <span className={!withGst ? "active-text" : ""}>Without GST</span>
                                    <label className="gst-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={withGst} 
                                            onChange={(e) => {
                                                setWithGst(e.target.checked);
                                                if (!e.target.checked) setGstNumber("");
                                            }} 
                                        />
                                        <span className="gst-switch-slider"></span>
                                    </label>
                                    <span className={withGst ? "active-text" : ""}>With GST</span>
                                </div>
                            </div>

                            {withGst && (
                                <div className="form-group">
                                    <label>GST Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter GST number" 
                                        value={gstNumber}
                                        onChange={(e) => setGstNumber(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Basic Details */}
                {currentStep === 2 && (
                    <div className="step-content">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Supplier Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter supplier name" 
                                    value={supplierName}
                                    onChange={(e) => setSupplierName(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Company Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter company name" 
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter phone number" 
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email ID</label>
                                <input 
                                    type="email" 
                                    placeholder="Enter email ID" 
                                    value={emailId}
                                    onChange={(e) => setEmailId(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>PAN Number</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter PAN number" 
                                    value={panNumber}
                                    onChange={(e) => setPanNumber(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Branch & Address */}
                {currentStep === 3 && (
                    <div className="step-content">
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3>Branches</h3>
                                <button 
                                    type="button"
                                    onClick={() => setBranchesList([...branchesList, { branch_name: '', phone: '' }])}
                                    style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #2563eb', color: '#2563eb', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    + Add Branch
                                </button>
                            </div>
                            {branchesList.map((branch, index) => (
                                <div key={index} className="form-grid" style={{ marginBottom: '15px', position: 'relative', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', background: '#f8fafc' }}>
                                    <div className="form-group">
                                        <label>Branch Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter branch name" 
                                            value={branch.branch_name || ''}
                                            onChange={(e) => {
                                                const newBranches = [...branchesList];
                                                newBranches[index] = { ...newBranches[index], branch_name: e.target.value };
                                                setBranchesList(newBranches);
                                            }}
                                        />
                                    </div>
                                    {/* <div className="form-group">
                                        <label>Branch Phone</label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter branch phone" 
                                            value={branch.phone || ''}
                                            onChange={(e) => {
                                                const newBranches = [...branchesList];
                                                newBranches[index] = { ...newBranches[index], phone: e.target.value };
                                                setBranchesList(newBranches);
                                            }}
                                        />
                                    </div> */}
                                    {branchesList.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setBranchesList(branchesList.filter((_, i) => i !== index))}
                                            style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="checkbox-row" style={{ marginTop: '0', marginBottom: '20px' }}>
                            <input
                                type="checkbox"
                                checked={sameAddress}
                                onChange={handleSameAddressToggle}
                            />
                            <span>Same as Permanent Address</span>
                        </div>

                        {/* Address Section */}
                        <div className="address-section">
                            {/* Permanent Address */}
                            <div className="address-card">
                                <h3>Permanent Address</h3>

                                <div className="form-group">
                                    <label>Address Line 1</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter address line 1" 
                                        value={permAddr1}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPermAddr1(val);
                                            if (sameAddress) setCurrAddr1(val);
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Address Line 2</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter address line 2" 
                                        value={permAddr2}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPermAddr2(val);
                                            if (sameAddress) setCurrAddr2(val);
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>City</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter city" 
                                        value={permCity}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPermCity(val);
                                            if (sameAddress) setCurrCity(val);
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>State</label>
                                    <select 
                                        value={permState}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPermState(val);
                                            if (sameAddress) setCurrState(val);
                                        }}
                                    >
                                        <option value="">Select state</option>
                                        <option value="Tamil Nadu">Tamil Nadu</option>
                                        <option value="Karnataka">Karnataka</option>
                                        <option value="Kerala">Kerala</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter pincode" 
                                        value={permPincode}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPermPincode(val);
                                            if (sameAddress) setCurrPincode(val);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Current Address */}
                            <div className="address-card">
                                <h3>Current Address</h3>

                                <div className="form-group">
                                    <label>Address Line 1</label>
                                    <input
                                        type="text"
                                        placeholder="Enter address line 1"
                                        value={currAddr1}
                                        onChange={(e) => setCurrAddr1(e.target.value)}
                                        disabled={sameAddress}
                                        className={sameAddress ? "disabled-input" : ""}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Address Line 2</label>
                                    <input
                                        type="text"
                                        placeholder="Enter address line 2"
                                        value={currAddr2}
                                        onChange={(e) => setCurrAddr2(e.target.value)}
                                        disabled={sameAddress}
                                        className={sameAddress ? "disabled-input" : ""}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        placeholder="Enter city"
                                        value={currCity}
                                        onChange={(e) => setCurrCity(e.target.value)}
                                        disabled={sameAddress}
                                        className={sameAddress ? "disabled-input" : ""}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>State</label>
                                    <select 
                                        value={currState}
                                        onChange={(e) => setCurrState(e.target.value)}
                                        disabled={sameAddress}
                                        className={sameAddress ? "disabled-input" : ""}
                                    >
                                        <option value="">Select state</option>
                                        <option value="Tamil Nadu">Tamil Nadu</option>
                                        <option value="Karnataka">Karnataka</option>
                                        <option value="Kerala">Kerala</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        placeholder="Enter pincode"
                                        value={currPincode}
                                        onChange={(e) => setCurrPincode(e.target.value)}
                                        disabled={sameAddress}
                                        className={sameAddress ? "disabled-input" : ""}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="button-row">
                    {currentStep > 1 && (
                        <button className="cancel-btn" onClick={() => setCurrentStep(prev => prev - 1)} disabled={loading}>
                            Back
                        </button>
                    )}
                    {currentStep < 3 ? (
                        <button className="save-btn" style={{ width: '150px' }} onClick={() => setCurrentStep(prev => prev + 1)}>
                            Next
                        </button>
                    ) : (
                        <>
                            <button className="cancel-btn" onClick={() => editingId ? resetForm() : navigate(-1)} disabled={loading}>
                                {editingId ? "Cancel Edit" : "Cancel"}
                            </button>
                            <button 
                                className="save-btn" 
                                onClick={handleSave} 
                                disabled={loading}
                            >
                                {loading ? "Saving..." : (editingId ? "Update Supplier" : "Save Supplier")}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* List Table */}
            <div className="supplier-table-container">
                <h2 className="page-title">Supplier List</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Supplier Name</th>
                                <th>Company Name</th>
                                <th>Phone Number</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((sup, index) => {
                                // Full fallbacks handling flattened fields like 'name' and 'phone' from backend model
                                const name = sup.supplier_details?.supplier_name || sup.supplier_name || sup.supplierName || sup.name || "-";
                                const company = sup.supplier_details?.company_name || sup.company_name || sup.companyName || sup.company || "-";
                                const phone = sup.supplier_details?.phone_number || sup.phone_number || sup.phoneNumber || sup.phone || "-";
                                
                                return (
                                    <tr key={sup.id || index}>
                                        <td>{index + 1}</td>
                                        <td>{name}</td>
                                        <td>{company}</td>
                                        <td>{phone}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="edit-btn" onClick={() => handleEdit(sup)}>
                                                    <Pencil size={18} />
                                                </button>
                                                <button className="delete-btn" onClick={() => handleDelete(sup.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {suppliers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No suppliers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AddSupplier;
