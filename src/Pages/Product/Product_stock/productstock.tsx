import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
    Package, 
    Users, 
    Layers, 
    ArrowRight, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Plus,
    ShoppingCart,
    Store,
    Warehouse,
    Save
} from "lucide-react";
import { fetchBusinessSuppliers } from "../../../api/product";
import { listProductAllocations } from "../../../api/product_allocation";
import { createStock, updateStock } from "../../../api/stock";

import StorageSelection from "../StorageManagement/StorageSelection";
import { showAlert } from "../../../Components/Notification/CenterAlert";
import "./productstock.css";

interface StockType {
    stock_type_id: number;
    name: string;
    qty: string;
}

interface Variant {
    variant_id: number;
    variant_name: string;
    qty: string;
    buying_price: string;
    profit_margin: string;
    selling_price: string;
    stock_types: StockType[];
}

const StockEntry: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Form states
    const [supplier, setSupplier] = useState("");
    const [product, setProduct] = useState("");
    const [productListOptions, setProductListOptions] = useState<any[]>([]);
    const [qty, setQty] = useState("");
    const [variants, setVariants] = useState<Variant[]>([]);
    const [activeVariantTab, setActiveVariantTab] = useState<number>(1);
    const [showStorage, setShowStorage] = useState(false);

    const [supplierListOptions, setSupplierListOptions] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedLocationData, setSelectedLocationData] = useState<any>(null);

    const DEFAULT_STOCK_TYPES = [
        { stock_type_id: 1, name: "Display Stock", qty: "" },
        { stock_type_id: 2, name: "Shop Stock", qty: "" },
        { stock_type_id: 3, name: "Outside Stock", qty: "" }
    ];

    // Initial Data Load
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const response = await fetchBusinessSuppliers();
                if (response && response.data && Array.isArray(response.data)) {
                    setSupplierListOptions(response.data);
                } else if (Array.isArray(response)) {
                    setSupplierListOptions(response);
                }
            } catch (error) {
                console.error("Error fetching suppliers:", error);
            }
        };
        loadSuppliers();

        const loadProductList = async () => {
            try {
                const res = await listProductAllocations();
                if (res?.success && Array.isArray(res.data)) {
                    const allProducts: any[] = [];
                    res.data.forEach((group: any) => {
                        const categoriesMap = group.Categories || {};
                        ["primary", "secondary"].forEach(type => {
                            const catList = categoriesMap[type];
                            if (catList && typeof catList === 'object') {
                                Object.values(catList).forEach((cat: any) => {
                                    const brandMap = cat.Brand || {};
                                    Object.values(brandMap).forEach((br: any) => {
                                        if (br.Products && Array.isArray(br.Products)) {
                                            br.Products.forEach((p: any) => {
                                                allProducts.push({
                                                    id: p.id,
                                                    name: p.name,
                                                    minStock: p.Qty?.min || "",
                                                });
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                    setProductListOptions(allProducts);
                }
            } catch (error) {
                console.error("Error fetching allocated products:", error);
            }
        };
        loadProductList();

        if (location.state?.editItem) {
            const rawItem = location.state.editItem as any;
            const item = rawItem.stock || rawItem.data || (rawItem.id ? rawItem : null);

            if (item) {
                setEditingId(item.id);
                setSupplier(String(item.supplier_id || item.supplier?.id || ""));
                setProduct(String(item.product_id || item.product?.id || ""));
                setQty(String(item.total_qty || item.qty || "0"));
                
                if (item.variants && Array.isArray(item.variants)) {
                    setVariants(item.variants.map((v: any) => ({
                        variant_id: v.variant_id,
                        variant_name: v.variant_name || (v.variant_id === 1 ? "Original" : v.variant_id === 2 ? "Import" : "Complimentary"),
                        qty: String(v.qty || ""),
                        buying_price: String(v.buying_price || ""),
                        profit_margin: String(v.profit_margin || ""),
                        selling_price: String(v.selling_price || ""),
                        stock_types: v.stock_types && Array.isArray(v.stock_types) && v.stock_types.length > 0 
                            ? v.stock_types.map((st: any) => ({
                                stock_type_id: st.stock_type_id,
                                name: st.name || (st.stock_type_id === 1 ? "Display" : st.stock_type_id === 2 ? "Shop" : "Outside"),
                                qty: String(st.qty || "")
                            }))
                            : DEFAULT_STOCK_TYPES.map(dst => ({ ...dst, qty: "0" }))
                    })));
                }

                if (item.storage_location || item.location) {
                    const loc = item.storage_location || item.location;
                    setSelectedLocationData({
                        storage: String(loc.storage_id || ""),
                        leafId: loc.id
                    });
                }
            }
        }
    }, [location.state]);


    const resetForm = () => {
        setSupplier("");
        setProduct("");
        setQty("");
        setVariants([]);
        setEditingId(null);
        setSelectedLocationData(null);
    };

    const validateVariants = () => {
        for (const variant of variants) {
            const variantTotal = Number(variant.qty) || 0;
            const stockTypesTotal = variant.stock_types.reduce((sum, st) => sum + (Number(st.qty) || 0), 0);
            if (variantTotal !== stockTypesTotal) {
                return `Sum of stock types for variant ${variant.variant_name || variant.variant_id} must equal total quantity (${variantTotal}). Current sum: ${stockTypesTotal}`;
            }
        }
        return null;
    };

    const handleSave = async () => {
        if (!supplier || !product || !qty) {
            showAlert("Please fill in all required fields (Supplier, Product, and Quantity).", "error");
            return;
        }

        const error = validateVariants();
        if (error) {
            showAlert(error, "error");
            return;
        }

        let mostSpecificLocationId = null;
        if (selectedLocationData) {
            const dynamicKeys = Object.keys(selectedLocationData)
                .filter(key => key.startsWith('level_'))
                .sort((a, b) => {
                    const idxA = parseInt(a.split('_')[1]);
                    const idxB = parseInt(b.split('_')[1]);
                    return idxB - idxA;
                });

            for (const key of dynamicKeys) {
                if (selectedLocationData[key]) {
                    mostSpecificLocationId = Number(selectedLocationData[key]);
                    break;
                }
            }
            if (!mostSpecificLocationId && selectedLocationData.leafId) {
                mostSpecificLocationId = selectedLocationData.leafId;
            }
        }

        if (!mostSpecificLocationId) {
            showAlert("Please select a storage location.", 'error');
            return;
        }

        const apiPayload = {
            product_id: Number(product),
            supplier_id: Number(supplier),
            is_self_produced: false,
            storage_location_id: mostSpecificLocationId,
            variants: variants.map(v => ({
                variant_id: v.variant_id,
                qty: Number(v.qty) || 0,
                buying_price: Number(v.buying_price) || 0,
                profit_margin: Number(v.profit_margin) || 0,
                selling_price: Number(v.selling_price) || 0,
                stock_types: v.stock_types.map(st => ({
                    stock_type_id: st.stock_type_id,
                    qty: Number(st.qty) || 0
                }))
            }))
        };

        try {
            let response;
            if (editingId !== null) {
                response = await updateStock(editingId, apiPayload);
            } else {
                response = await createStock(apiPayload);
            }

            if (response.success || response.status) {
                showAlert("Stock entry saved successfully", 'success');
                resetForm();
                navigate("/stock-list");
            } else {
                showAlert(response.message || "Failed to save stock.", 'error');
            }
        } catch (error: any) {
            showAlert(`Error: ${error.message || "Something went wrong"}`, 'error');
        }
    };

    const handleCancel = () => {
        navigate("/stock-list");
    };

    const updateVariantField = (variantId: number, field: keyof Variant, value: string) => {
        setVariants(prev => prev.map(v => {
            if (v.variant_id === variantId) {
                const updated = { ...v, [field]: value };
                if (field === "buying_price" || field === "profit_margin") {
                    const bp = Number(field === "buying_price" ? value : v.buying_price) || 0;
                    const pm = Number(field === "profit_margin" ? value : v.profit_margin) || 0;
                    if (bp > 0) updated.selling_price = String(Number((bp + pm).toFixed(2)));
                }
                return updated;
            }
            return v;
        }));
    };

    const updateStockTypeQty = (variantId: number, stockTypeId: number, value: string) => {
        setVariants(prev => prev.map(v => {
            if (v.variant_id === variantId) {
                return {
                    ...v,
                    stock_types: v.stock_types.map(st => 
                        st.stock_type_id === stockTypeId ? { ...st, qty: value } : st
                    )
                };
            }
            return v;
        }));
    };

    const toggleVariant = (id: number, name: string) => {
        setVariants(prev => {
            const exists = prev.find(v => v.variant_id === id);
            if (exists) {
                return prev.filter(v => v.variant_id !== id);
            }
            return [...prev, {
                variant_id: id,
                variant_name: name,
                qty: "",
                buying_price: "",
                profit_margin: "",
                selling_price: "",
                stock_types: DEFAULT_STOCK_TYPES.map(st => ({ ...st }))
            }];
        });
    };

    return (
        <div className="stock-container">
            <div className="stock-card">
                <div className="stock-stepper">
                    <div className={`step-item ${!showStorage ? 'active' : 'completed'}`}>
                        <div className="step-circle">{!showStorage ? 1 : <CheckCircle2 size={20} />}</div>
                        <span className="step-label">Stock Details</span>
                    </div>
                    <div className={`stepper-line ${showStorage ? 'full' : ''}`}></div>
                    <div className={`step-item ${showStorage ? 'active' : ''}`}>
                        <div className="step-circle">2</div>
                        <span className="step-label">Storage Allocation</span>
                    </div>
                </div>

                <div className="stock-header">
                    <h2>{editingId !== null ? "Edit Stock Entry" : "Stock Entry"}</h2>
                    <p className="subtitle">Configure your inventory items and their storage distribution</p>
                </div>

                {!showStorage ? (
                    <div className="details-form-area">
                        <div className="form-section-title">
                            <Package size={22} className="text-primary" />
                            <span>Basic Inventory Info</span>
                        </div>
                        
                        <div className="form-grid-entry">
                            <div className="form-group">
                                <label><Users size={16} /> Supplier <span className="required">*</span></label>
                                <div className="input-with-icon">
                                    <Users className="input-icon" size={18} />
                                    <select className="sm-select" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                                        <option value="">Select Supplier</option>
                                        {supplierListOptions.map((sup, index) => (
                                            <option key={index} value={sup.id}>
                                                {sup.name || sup.supplier_name || sup.business_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label><Package size={16} /> Product <span className="required">*</span></label>
                                <div className="input-with-icon">
                                    <Package className="input-icon" size={18} />
                                    <select className="sm-select" value={product} onChange={(e) => setProduct(e.target.value)}>
                                        <option value="">Select Product</option>
                                        {productListOptions.map((prod, index) => (
                                            <option key={index} value={prod.id}>{prod.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label><Layers size={16} /> Total Quantity <span className="required">*</span></label>
                                <div className="input-with-icon">
                                    <Layers className="input-icon" size={18} />
                                    <input
                                        className="stock-input"
                                        type="number"
                                        placeholder="0"
                                        value={qty}
                                        onChange={(e) => setQty(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="variant-selection-area">
                            <div className="form-section-title" style={{ border: 'none', marginBottom: '1rem' }}>
                                <Layers size={22} className="text-primary" />
                                <span>Select Variants</span>
                            </div>
                            <div className="variant-chips-container">
                                {[
                                    { id: 1, name: "Original" },
                                    { id: 2, name: "Import" },
                                    { id: 3, name: "Complimentary" }
                                ].map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        className={`chip-btn ${variants.find(varItem => varItem.variant_id === v.id) ? 'active' : 'inactive'}`}
                                        onClick={() => toggleVariant(v.id, v.name)}
                                    >
                                        {variants.find(varItem => varItem.variant_id === v.id) ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                                        {v.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {variants.length > 0 && (
                            <div className="variant-details-wrapper">
                                <div className="variant-tabs">
                                    {variants.map(v => (
                                        <button
                                            key={v.variant_id}
                                            className={`tab-btn ${activeVariantTab === v.variant_id ? 'active' : ''}`}
                                            onClick={() => setActiveVariantTab(v.variant_id)}
                                        >
                                            {v.variant_name}
                                        </button>
                                    ))}
                                </div>

                                <div className="variant-content">
                                    {variants.map(v => v.variant_id === activeVariantTab && (
                                        <div key={v.variant_id} className="animate-fade-in">
                                            <div className="details-grid">
                                                <div className="form-group">
                                                    <label><Package size={14} /> Variant Qty</label>
                                                    <div className="input-with-icon">
                                                        <Package className="input-icon" size={16} style={{ left: '0.875rem' }} />
                                                        <input 
                                                            className="stock-input" 
                                                            style={{ paddingLeft: '2.5rem' }} 
                                                            type="number" 
                                                            value={v.qty} 
                                                            onChange={(e) => updateVariantField(v.variant_id, "qty", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Buying Price</label>
                                                    <div className="input-with-icon">
                                                        <span className="input-icon" style={{ left: '0.875rem', fontWeight: 700, fontSize: '0.9rem' }}>$</span>
                                                        <input 
                                                            className="stock-input" 
                                                            style={{ paddingLeft: '2.5rem' }} 
                                                            type="number" 
                                                            value={v.buying_price} 
                                                            onChange={(e) => updateVariantField(v.variant_id, "buying_price", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Profit Margin</label>
                                                    <div className="input-with-icon">
                                                        <span className="input-icon" style={{ left: '0.875rem', fontWeight: 700, fontSize: '0.9rem' }}>%</span>
                                                        <input 
                                                            className="stock-input" 
                                                            style={{ paddingLeft: '2.5rem' }} 
                                                            type="number" 
                                                            value={v.profit_margin} 
                                                            onChange={(e) => updateVariantField(v.variant_id, "profit_margin", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Selling Price</label>
                                                    <div className="input-with-icon">
                                                        <span className="input-icon" style={{ left: '0.875rem', fontWeight: 700, fontSize: '0.9rem' }}>$</span>
                                                        <input 
                                                            className="stock-input" 
                                                            style={{ paddingLeft: '2.5rem' }} 
                                                            type="number" 
                                                            value={v.selling_price} 
                                                            onChange={(e) => updateVariantField(v.variant_id, "selling_price", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="stock-split-card">
                                                <div className="split-header">
                                                    <div className="form-section-title" style={{ border: 'none', marginBottom: 0, padding: 0 }}>
                                                        <Warehouse size={20} className="text-primary" />
                                                        <span>Distribution Split</span>
                                                    </div>
                                                    {(() => {
                                                        const total = v.stock_types.reduce((sum, st) => sum + (Number(st.qty) || 0), 0);
                                                        const targetNum = Number(v.qty) || 0;
                                                        const diff = targetNum - total;
                                                        const isValid = diff === 0;
                                                        return (
                                                            <div className={`validation-tag ${isValid ? 'success' : 'error'}`}>
                                                                {isValid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                                                {isValid ? "Matched" : `Mismatch: ${total}/${targetNum}`}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="split-grid">
                                                    {v.stock_types.map(st => (
                                                        <div key={st.stock_type_id} className="form-group">
                                                            <label>
                                                                {st.stock_type_id === 1 && <ShoppingCart size={14} />}
                                                                {st.stock_type_id === 2 && <Store size={14} />}
                                                                {st.stock_type_id === 3 && <Warehouse size={14} />}
                                                                {st.name}
                                                            </label>
                                                            <div className="input-with-icon">
                                                                <Layers className="input-icon" size={16} style={{ left: '0.875rem' }} />
                                                                <input 
                                                                    className="stock-input"
                                                                    style={{ paddingLeft: '2.5rem' }}
                                                                    type="number" 
                                                                    placeholder="0" 
                                                                    value={st.qty} 
                                                                    onChange={(e) => updateStockTypeQty(v.variant_id, st.stock_type_id, e.target.value)} 
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="step-footer">
                            <button className="danger-btn" onClick={handleCancel}>Cancel</button>
                            <button type="button" className="primary-btn" onClick={() => setShowStorage(true)}>
                                Next Step <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="storage-step-container">
                        <div className="storage-back-area">
                            <button type="button" className="outline-btn" onClick={() => setShowStorage(false)}>
                                <ArrowLeft size={18} /> Back to Details
                            </button>
                        </div>
                        
                        <div className="storage-selection-wrapper" style={{ minHeight: '300px' }}>
                            <StorageSelection
                                onSelectionChange={(data: any) => setSelectedLocationData(data)}
                                initialData={selectedLocationData}
                            />
                        </div>

                        <div className="step-footer">
                            <button className="danger-btn" onClick={handleCancel}>Cancel</button>
                            <button className="primary-btn" style={{ background: 'var(--success)' }} onClick={handleSave}>
                                <Save size={18} /> {editingId !== null ? "Update Stock" : "Complete Stock Entry"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockEntry;