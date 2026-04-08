import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchBusinessCategoryGroups } from "../../../api/category";
import { fetchCategoryBrandList, fetchBusinessSuppliers } from "../../../api/product";
import { listProductAllocations } from "../../../api/product_allocation";
import { createStock, updateStock } from "../../../api/stock";

import StorageSelection from "../StorageManagement/StorageSelection";
import { showAlert } from "../../../Components/Notification/CenterAlert";
import "./productstock.css";

interface StockItem {
    id: number;
    supplier: string;
    category_group: string;
    category: string;
    brand: string;
    product: string;
    qty: string;
    minStock: string;
    // maxStock: string;
    variants: any[];
    stockType: string;
    date: string;
    displayStock?: string;
    shopInSale?: string;
    outsideStock?: string;
}

const StockEntry: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Form states
    const [supplier, setSupplier] = useState("");
    const [category_group, setCategoryGroups] = useState("");
    const [category, setCategory] = useState("");
    const [categoryListOptions, setCategoryListOptions] = useState<any[]>([]);
    const [brand, setBrand] = useState("");
    // const [brandListOptions, setBrandListOptions] = useState<any[]>([]);
    const [product, setProduct] = useState("");
    const [productListOptions, setProductListOptions] = useState<any[]>([]);
    const [qty, setQty] = useState("");
    const [minStock, setMinStock] = useState("");
    // const [maxStock, setMaxStock] = useState("");
    const [variants, setVariants] = useState<any[]>([]);
    const [stockType, setStockType] = useState("Primary");
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [activeVariantTab, setActiveVariantTab] = useState("original");
    const [isSpecifyModalOpen, setIsSpecifyModalOpen] = useState(false);
    const [displayStock, setDisplayStock] = useState("");
    const [shopInSale, setShopInSale] = useState("");
    const [outsideStock, setOutsideStock] = useState("");
    const [showStorage, setShowStorage] = useState(false);
    const [distPerVariant, setDistPerVariant] = useState<Record<string, { display: string, shop: string, outside: string }>>({
        original: { display: "", shop: "", outside: "" },
        import: { display: "", shop: "", outside: "" },
        compliment: { display: "", shop: "", outside: "" }
    });
    const [activeDistVariant, setActiveDistVariant] = useState("original");

    // const [categoryGroupsList, setCategoryGroupsList] = useState<any[]>([]);
    const [supplierListOptions, setSupplierListOptions] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedLocationData, setSelectedLocationData] = useState<any>(null);
    const [tempProductName, setTempProductName] = useState<string>("");



    // 1. Initial Data Load - Category Groups
    useEffect(() => {
        const loadCategoryGroups = async () => {
            try {
                const response = await fetchBusinessCategoryGroups();
                if (response && response.data) {
                    // if (Array.isArray(response.data)) {
                    //     setCategoryGroupsList(response.data);
                    // } else if (response.data.category_groups && Array.isArray(response.data.category_groups)) {
                    //     setCategoryGroupsList(response.data.category_groups);
                    // } else if (response.data.categories && Array.isArray(response.data.categories)) {
                    //     setCategoryGroupsList(response.data.categories);
                    // } else {
                    //     setCategoryGroupsList([]);
                    // }
                } else if (Array.isArray(response)) {
                    // setCategoryGroupsList(response);
                } else {
                    // setCategoryGroupsList([]);
                }
            } catch (error) {
                console.error("Error fetching category groups:", error);
            }
        };
        loadCategoryGroups();

        const loadSuppliers = async () => {
            try {
                const response = await fetchBusinessSuppliers();
                if (response && response.data && Array.isArray(response.data)) {
                    setSupplierListOptions(response.data);
                } else if (Array.isArray(response)) {
                    setSupplierListOptions(response);
                } else if (response && response.data && typeof response.data === 'object') {
                    // If data is an object containing the list (e.g. { data: { suppliers: [] } })
                    const possibleArray = Object.values(response.data).find(val => Array.isArray(val));
                    if (possibleArray) setSupplierListOptions(possibleArray as any[]);
                }
            } catch (error) {
                console.error("Error fetching suppliers:", error);
            }
        };
        loadSuppliers();



        if (location.state?.editItem) {
            const rawItem = location.state.editItem as any;
            // Handle various levels of nesting from different API structures
            const item = rawItem.stock || rawItem.data || (rawItem.id ? rawItem : null);

            if (item) {
                console.log("✏️ Processing Edit Item:", item);

                // Normalizing IDs for the state (always as strings for select values)
                const resolvedSupplierId = item.supplier?.id || item.supplier_id || (typeof item.supplier === 'number' ? item.supplier : null);
                const resolvedProductId = item.product?.id || item.product_id || (typeof item.product === 'number' ? item.product : null) || item.allocated_product_id;
                const resolvedCategoryId = item.category?.id || item.category_id || (typeof item.category === 'number' ? item.category : null) || item.product?.category_id;
                const resolvedBrandId = item.brand?.id || item.brand_id || (typeof item.brand === 'number' ? item.brand : null) || item.product?.brand_id;
                const resolvedCategoryGroupId = item.category_group?.id || item.category_group_id || item.category_group || item.product?.category_group_id;

                console.log("📍 ID Resolution Results:", { resolvedSupplierId, resolvedProductId, resolvedCategoryId, resolvedBrandId, resolvedCategoryGroupId });

                if (resolvedSupplierId) setSupplier(String(resolvedSupplierId));
                if (resolvedCategoryGroupId) setCategoryGroups(String(resolvedCategoryGroupId));
                if (resolvedCategoryId) setCategory(String(resolvedCategoryId));
                if (resolvedBrandId) setBrand(String(resolvedBrandId));
                if (resolvedProductId) {
                    const stringId = String(resolvedProductId);
                    setProduct(stringId);
                    setTempProductName(item.product?.product_name || item.product?.name || item.product_name || item.name || `Product #${resolvedProductId}`);
                    console.log(`✅ Set Product state to: ${stringId} (${item.product?.product_name || item.product?.name || item.product_name || item.name || '?'})`);
                }

                setMinStock(item.min_qty || item.minStock || item.min_stock || "");

                // If total_qty is 0 or null, check if any variants have quantity
                let finalQty = item.total_qty || item.quantity || item.qty || item.stock_qty || item.stock || "";
                if ((!finalQty || Number(finalQty) === 0) && item.variants && Array.isArray(item.variants)) {
                    finalQty = item.variants.reduce((acc: number, v: any) => acc + (Number(v.qty) || 0), 0);
                }
                setQty(String(finalQty || "0"));
                setEditingId(item.id);

                // Variants mapping (ensuring type is correct)
                if (item.variants && Array.isArray(item.variants)) {
                    const variantMap: Record<number, string> = { 1: 'original', 2: 'import', 3: 'compliment' };
                    setVariants(item.variants.map((v: any) => ({
                        variantType: variantMap[v.variant_id] || v.variant_name?.toLowerCase() || 'original',
                        quantity: v.qty || v.quantity || "",
                        buyingPrice: v.buying_price || "",
                        profitMargin: v.profit_margin || "",
                        sellingPrice: v.selling_price || ""
                    })));
                }

                // Stock distribution mapping
                if (item.stock_types && Array.isArray(item.stock_types)) {
                    const display = item.stock_types.find((st: any) => st.stock_type_id === 1);
                    const shop = item.stock_types.find((st: any) => st.stock_type_id === 2);
                    const outside = item.stock_types.find((st: any) => st.stock_type_id === 3);

                    if (display) setDisplayStock(String(display.qty));
                    if (shop) setShopInSale(String(shop.qty));
                    if (outside) setOutsideStock(String(outside.qty));

                    // For editing, we might want to distribute to the first variant by default 
                    // or ideally have the mapping from backend. Since the current backend payload 
                    // doesn't support per-variant distribution, we'll assign the totals to 'original' 
                    // as a fallback for the UI state.
                    setDistPerVariant(prev => ({
                        ...prev,
                        original: {
                            display: display ? String(display.qty) : "",
                            shop: shop ? String(shop.qty) : "",
                            outside: outside ? String(outside.qty) : ""
                        }
                    }));
                }

                if (item.stockType || item.stock_type) {
                    setStockType(item.stockType || item.stock_type || "Primary");
                }

                // Pre-populate storage location path for StorageSelection component
                if (item.storage_location || item.location) {
                    const loc = item.storage_location || item.location;
                    const preSelected: Record<string, any> = {};

                    // Root storage type
                    if (loc.storage_id || loc.storage?.id) {
                        preSelected.storage = String(loc.storage_id || loc.storage?.id);
                    } else if (item.storage_id) {
                        preSelected.storage = String(item.storage_id);
                    }

                    // Extract path using leaf-to-root logic if parents are present
                    // Note: This relies on the backend returning the parent chain or level info
                    if (loc.id) {
                        // If we have level info, we can try to map it
                        // This is a best-effort reconstruction 
                        if (loc.level_id !== undefined && loc.id) {
                            // Find the index of this level in the future structure levels list
                            // Given we don't know the indices yet, we'll use the ID directly in the key if possible
                            // Or better: pass the leaf ID as a hint
                            preSelected.leafId = loc.id;
                        }
                    }
                    setSelectedLocationData(preSelected);
                }
            }
        }
    }, [location.state]);

    // 2. Load category list when category_group changes
    useEffect(() => {
        const loadCategoryList = async () => {
            if (category_group) {
                try {
                    // Using the Brand API which contains the full tree as per user request
                    const res = await fetchCategoryBrandList(category_group);
                    if (res && res.data) {
                        let rawCats = [];
                        if (Array.isArray(res.data)) {
                            rawCats = res.data[0]?.primary_categories || res.data[0]?.categories || [];
                        } else {
                            rawCats = res.data.primary_categories || res.data.categories || [];
                        }

                        // Flatten Primary and Secondary categories, ensuring brands are kept
                        const flattened: any[] = [];
                        rawCats.forEach((pc: any) => {
                            flattened.push({ ...pc, isPrimary: true });
                            if (pc.secondary_categories && Array.isArray(pc.secondary_categories)) {
                                pc.secondary_categories.forEach((sc: any) => {
                                    flattened.push({ ...sc, isPrimary: false, parentName: pc.name });
                                });
                            }
                        });
                        setCategoryListOptions(flattened);
                    }
                } catch (error) {
                    console.error("Error fetching category list:", error);
                }
            } else {
                setCategoryListOptions([]);
            }
        };
        loadCategoryList();
    }, [category_group]);

    // 3. Update Brand list when category changes
    useEffect(() => {
        if (category && categoryListOptions.length > 0) {
            // Find the selected category object to get its brands
            const selectedCat = categoryListOptions.find(cat =>
                String(cat.id) === String(category) || cat.name === category
            );

            if (selectedCat && selectedCat.brands && Array.isArray(selectedCat.brands)) {
                // setBrandListOptions(selectedCat.brands);
            } else {
                // setBrandListOptions([]);
            }
        } else {
            // setBrandListOptions([]);
        }
    }, [category, categoryListOptions]);

    useEffect(() => {
        // Only clear if we are not in edit mode (to prevent clearing initial pre-population)
        if (!location.state?.editItem) {
            setCategory("");
            setProduct("");
        }
    }, [stockType]);

    // 5. Load Product list based on allocated products from /api/productAllocation
    useEffect(() => {
        const loadProductList = async () => {
            try {
                const res = await listProductAllocations();
                if (res?.success && Array.isArray(res.data)) {
                    const allProducts: any[] = [];

                    // Traverse nested structure: CategoryGroup -> Categories (primary/secondary) -> Category -> Brand -> Products
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
                                                    // maxStock: p.Qty?.max || "",
                                                    mrp: p.mrp || "",
                                                    brand_id: br.id,
                                                    category_id: cat.id,
                                                    category_group_id: group.CategoryGroupId
                                                });
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });

                    // When editing, we might want to ensure the specific product is in the list 
                    // even if filters are still processing.
                    const filtered = allProducts.filter((p: any) => {
                        const matchesBrand = brand ? String(p.brand_id) === String(brand) : true;
                        const matchesCategory = category ? String(p.category_id) === String(category) : true;
                        const isTheCurrentEditedProduct = product && String(p.id) === String(product);
                        return isTheCurrentEditedProduct || (matchesBrand && matchesCategory);
                    });

                    setProductListOptions(filtered);
                } else {
                    setProductListOptions([]);
                }
            } catch (error) {
                console.error("Error fetching allocated product list:", error);
                setProductListOptions([]);
            }
        };
        loadProductList();
    }, [brand, category, product]);


    // const handleVariantChange = (value: string) => {
    //     if (variants.includes(value)) {
    //         setVariants(variants.filter((item) => item !== value));
    //     } else {
    //         setVariants([...variants, value]);
    //     }
    // };

    const resetForm = () => {
        setSupplier("");
        setCategoryGroups("");
        setCategory("");
        setBrand("");
        setProduct("");
        setQty("");
        setMinStock("");
        // setMaxStock("");
        setVariants([]);
        setStockType("Primary");
        setEditingId(null);
        setShopInSale("");
        setOutsideStock("");

    };

    const handleSave = async () => {
        if (!supplier || !product || !qty) {
            alert("Please fill in all required fields (Supplier, Product, and Quantity).");
            return;
        }

        // Resolve IDs
        const productIdNum = Number(product);
        const supplierIdNum = Number(supplier);

        if (isNaN(productIdNum) || isNaN(supplierIdNum)) {
            alert("Invalid Product or Supplier selection.");
            return;
        }

        // Resolve names for local history
        const selectedProduct = productListOptions.find((p: any) => String(p.id) === String(product));
        const productName = selectedProduct?.name || product;

        const selectedSupplier = supplierListOptions.find((s: any) => String(s.id) === String(supplier));
        const supplierName = selectedSupplier?.name || selectedSupplier?.supplier_name || selectedSupplier?.business_name || supplier;

        // Find the most specific location ID
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
        }

        if (!mostSpecificLocationId) {
            showAlert("Please select a storage location.", 'error');
            return;
        }

        const variantTypeMap: Record<string, number> = {
            'original': 1,
            'import': 2,
            'compliment': 3
        };

        // Sum distributions across all variants
        let totalDisplay = 0;
        let totalShop = 0;
        let totalOutside = 0;

        Object.values(distPerVariant).forEach(dist => {
            totalDisplay += Number(dist.display) || 0;
            totalShop += Number(dist.shop) || 0;
            totalOutside += Number(dist.outside) || 0;
        });

        const stockTypesPayload = [];
        if (totalDisplay > 0) stockTypesPayload.push({ stock_type_id: 1, qty: totalDisplay });
        if (totalShop > 0) stockTypesPayload.push({ stock_type_id: 2, qty: totalShop });
        if (totalOutside > 0) stockTypesPayload.push({ stock_type_id: 3, qty: totalOutside });

        // Final payload matching the user request exactly
        const apiPayload = {
            product_id: productIdNum,
            supplier_id: supplierIdNum,
            is_self_produced: false,
            storage_location_id: mostSpecificLocationId,
            variants: variants.map(v => ({
                variant_id: variantTypeMap[v.variantType] || 1,
                buying_price: Number(v.buyingPrice) || 0,
                profit_margin: Number(v.profitMargin) || 0,
                selling_price: Number(v.sellingPrice) || 0,
                qty: Number(v.quantity) || 0
            })),
            stock_types: stockTypesPayload
        };

        try {
            console.log("📤 Sending Stock Payload:", apiPayload);
            let response;
            if (editingId !== null) {
                response = await updateStock(editingId, apiPayload);
            } else {
                response = await createStock(apiPayload);
            }

            if (response.success || response.status) {
                console.log("✅ Stock saved successfully:", response);

                // Save locally for history
                const savedStock = localStorage.getItem("stock_data");
                let stockList: StockItem[] = savedStock ? JSON.parse(savedStock) : [];

                const localData: any = {
                    id: response?.data?.id || editingId || Date.now(),
                    supplier,
                    supplier_name: supplierName,
                    category_group,
                    category,
                    brand,
                    product,
                    product_name: productName,
                    minStock,
                    // maxStock,
                    qty,
                    variants,
                    stockType,
                    date: new Date().toLocaleDateString(),
                    displayStock,
                    shopInSale,
                    outsideStock
                };

                if (editingId !== null) {
                    stockList = stockList.map(item => item.id === editingId ? localData : item);
                    showAlert("Successfully saved", 'success');
                } else {
                    stockList = [localData, ...stockList];
                    showAlert("Successfully saved", 'success');
                }

                localStorage.setItem("stock_data", JSON.stringify(stockList));
                resetForm();
                navigate("/stock-list");
            } else {
                throw new Error(response.message || "Unknown error occurred while saving stock.");
            }
        } catch (error: any) {
            console.error("❌ Failed to save stock:", error);
            showAlert(`Failed: ${error.message || "Please check your network connection."}`, 'error');
        }
    };

    const handleCancel = () => {
        navigate("/stock-list");
    };

    return (
        <>
            <div className="stock-container">
                <div className="stock-card">
                    <h2>{editingId !== null ? "Edit Stock Entry" : "Stock Entry"}</h2>

                    {!showStorage ? (
                        <>
                            <div className="form-grid-entry">
                                <div className="form-group">
                                    <label>Supplier <span style={{ color: "red" }}>*</span></label>
                                    <select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                                        <option value="">Select Supplier</option>
                                        {Array.isArray(supplierListOptions) && supplierListOptions.map((sup, index) => (
                                            <option key={index} value={sup.id || sup.supplier_id || sup.name || sup}>
                                                {sup.name || sup.supplier_name || sup.business_name || sup}
                                            </option>
                                        ))}
                                    </select>
                                </div>



                                {/* <div className="form-group">
                        <label>Category Group</label>
                        <select value={category_group} onChange={(e) => setCategoryGroups(e.target.value)}>
                            <option value="">Select Category Group</option>
                            {Array.isArray(categoryGroupsList) && categoryGroupsList.map((group, index) => (
                                <option key={index} value={group.id || group.name || group.category_group_name}>
                                    {group.name || group.category_group_name || group.category_name}
                                </option>
                            ))}
                        </select>
                    </div> */}

                                {/* <div className="form-group">
                        <label>Stock Type</label>
                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={stockType === "Primary"}
                                    onChange={() => setStockType("Primary")}
                                />
                                Primary
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={stockType === "Secondary"}
                                    onChange={() => setStockType("Secondary")}
                                />
                                Secondary
                            </label>
                        </div>
                    </div> */}


                                {/* <div className="form-group">
                        <label>Category List</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="">Select Category</option>
                            {categoryListOptions
                                .filter(cat => stockType === "Primary" ? cat.isPrimary : !cat.isPrimary)
                                .map((cat, index) => (
                                    <option key={index} value={cat.id || cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                        </select>
                    </div> */}

                                {/* <div className="form-group">
                        <label>Brand</label>
                        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                            <option value="">Select Brand</option>
                            {brandListOptions.map((br, index) => (
                                <option key={index} value={br.id || br.brand_id || br.name || br}>
                                    {br.name || br.brand_name || br}
                                </option>
                            ))}
                        </select>
                    </div> */}

                                <div className="form-group">
                                    <label>Product <span style={{ color: "red" }}>*</span></label>
                                    <select
                                        value={product}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            setProduct(selectedId);

                                            // Auto-fill min/max stock values from the selected product allocation details
                                            // const selectedProd = productListOptions.find((p: any) => String(p.id) === String(selectedId));
                                            // if (selectedProd) {
                                            //     setMinStock(String(selectedProd.minStock || ""));
                                            //     setMaxStock(String(selectedProd.maxStock || ""));
                                            // }
                                        }}
                                    >
                                        <option value="">Select Product</option>
                                        {product && !productListOptions.find(p => String(p.id) === String(product)) && (
                                            <option value={product}>{tempProductName || `Product #${product}`}</option>
                                        )}
                                        {Array.isArray(productListOptions) && productListOptions.map((prod, index) => (
                                            <option key={index} value={prod.id}>
                                                {prod.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Quantity <span style={{ color: "red" }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Enter Quantity"
                                        value={qty}
                                        onKeyDown={(e) => {
                                            const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
                                            if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^\d*$/.test(val)) setQty(val);
                                        }}
                                    />
                                </div>

                                {/* <div className="form-group">
                            <label>Min Stock</label>
                            <input
                                type="text"
                                placeholder="Enter Minimum Quantity"
                                value={minStock}
                                onKeyDown={(e) => {
                                    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
                                    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) setMinStock(val);
                                }}
                            />
                        </div> */}

                                {/* <div className="form-group">
                            <label>Max Stock</label>
                            <input
                                type="text"
                                placeholder=""
                                value={maxStock}
                                onKeyDown={(e) => {
                                    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
                                    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                // onChange={(e) => {
                                //     const val = e.target.value;
                                //     if (/^\d*$/.test(val)) setMaxStock(val);
                                // }}
                            />
                        </div> */}

                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: '1px' }}>
                                    <label style={{ marginBottom: "12px", display: "block", fontWeight: 600, color: '#374151' }}>Variant</label>
                                    <button type="button" className="variant-btn" onClick={() => setIsVariantModalOpen(true)}>
                                        Specify Variant Details
                                    </button>
                                </div>

                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: '1px' }}>
                                    <label style={{ marginBottom: "12px", display: "block", fontWeight: 600, color: '#374151' }}>Stock Dist</label>
                                    <button type="button" className="variant-btn" onClick={() => setIsSpecifyModalOpen(true)}>
                                        Specify Stock Details
                                    </button>
                                </div>
                            </div>

                            <div className="button-group">
                                <button
                                    type="button"
                                    className="next-btn"
                                    onClick={() => setShowStorage(true)}
                                >
                                    Next
                                </button>
                                <button className="cancel-btn" onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="storage-section-wrapper" style={{ position: 'relative' }}>
                            <button type="button" className="back-btn top-right" onClick={() => setShowStorage(false)}>
                                Back
                            </button>
                            <StorageSelection
                                onSelectionChange={(data: any) => setSelectedLocationData(data)}
                                initialData={selectedLocationData}
                            />
                            <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                                <button className="save-btn" onClick={handleSave}>
                                    {editingId !== null ? "Update" : "Save"}
                                </button>
                                <button type="button" className="cancel-btn" onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isVariantModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Variant Selection</h3>
                            <button type="button" className="modal-close-btn" style={{ position: 'absolute', top: '20px', right: '24px' }} onClick={() => setIsVariantModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Summary Calculation Area */}
                            <div className="variant-summary-display">
                                <div className="summary-item">
                                    <span className="summary-label">Total Qty:</span>
                                    <span className="summary-value total">{qty || 0}</span>
                                </div>
                                <div className="summary-divider">|</div>
                                <div className="summary-item">
                                    <span className="summary-label">Balance Qty:</span>
                                    <span className="summary-value balance">
                                        {(Number(qty) || 0) - variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            {((Number(qty) || 0) - variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0)) < 0 && (
                                <div className="qty-validation-error">
                                    Entered quantity cannot exceed total quantity
                                </div>
                            )}

                            <div className="variant-tabs">
                                {["Original", "Import", "Complimentary"].map(v => {
                                    const matchedType = v.toLowerCase() === 'complimentary' ? 'compliment' : v.toLowerCase();
                                    return (
                                        <button
                                            key={v}
                                            type="button"
                                            className={`variant-tab-btn ${activeVariantTab === matchedType ? 'active' : ''}`}
                                            onClick={() => setActiveVariantTab(matchedType)}
                                        >
                                            {v}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="variant-inputs">
                                <div className="variant-input-group">
                                    <label>Qty</label>
                                    <input
                                        type="number"
                                        placeholder="Enter Quantity"
                                        value={variants.find(v => v.variantType === activeVariantTab)?.quantity || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVariants(prev => {
                                                const exists = prev.find(v => v.variantType === activeVariantTab);
                                                if (exists) {
                                                    return prev.map(v => v.variantType === activeVariantTab ? { ...v, quantity: val } : v);
                                                }
                                                return [...prev, { variantType: activeVariantTab, quantity: val, sellingPrice: "", buyingPrice: "", profitMargin: "" }];
                                            });
                                        }}
                                    />
                                </div>
                                <div className="variant-input-group">
                                    <label>Buying Price</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Buying Price"
                                        value={variants.find(v => v.variantType === activeVariantTab)?.buyingPrice || ""}
                                        onKeyDown={(e) => {
                                            const blockedKeys = ["e", "E", "+", "-", "Delete", "Backspace", "ArrowLeft", "ArrowRight", "Tab", "."];
                                            if (
                                                !/^[0-9]$/.test(e.key) &&
                                                !blockedKeys.includes(e.key)
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Make sure val only contains numbers or decimals
                                            if (!/^\d*\.?\d*$/.test(val)) return;

                                            setVariants(prev => {
                                                const exists = prev.find(v => v.variantType === activeVariantTab);
                                                let newSellingPrice = exists?.sellingPrice || "";
                                                if (val !== "") {
                                                    const bp = Number(val);
                                                    const pm = Number(exists?.profitMargin || 0);
                                                    if (pm > 0) newSellingPrice = String(Number((bp + pm).toFixed(2)));
                                                }

                                                if (exists) {
                                                    return prev.map(v => v.variantType === activeVariantTab ? { ...v, buyingPrice: val, sellingPrice: newSellingPrice } : v);
                                                }
                                                return [...prev, { variantType: activeVariantTab, quantity: "", sellingPrice: newSellingPrice, buyingPrice: val, profitMargin: "" }];
                                            });
                                        }}
                                    />
                                </div>
                                <div className="variant-input-group">
                                    <label>Profit Margin</label>
                                    <input
                                        type="number"
                                        placeholder="Enter Profit Margin"
                                        value={variants.find(v => v.variantType === activeVariantTab)?.profitMargin || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVariants(prev => {
                                                const exists = prev.find(v => v.variantType === activeVariantTab);
                                                let newSellingPrice = exists?.sellingPrice || "";
                                                if (val !== "") {
                                                    const pm = Number(val);
                                                    const bp = Number(exists?.buyingPrice || 0);
                                                    if (bp > 0) newSellingPrice = String(Number((bp + pm).toFixed(2)));
                                                }

                                                if (exists) {
                                                    return prev.map(v => v.variantType === activeVariantTab ? { ...v, profitMargin: val, sellingPrice: newSellingPrice } : v);
                                                }
                                                return [...prev, { variantType: activeVariantTab, quantity: "", sellingPrice: newSellingPrice, buyingPrice: "", profitMargin: val }];
                                            });
                                        }}
                                    />
                                </div>
                                <div className="variant-input-group">
                                    <label>Selling Price</label>
                                    <input
                                        type="number"
                                        placeholder="Enter Selling Price"
                                        value={variants.find(v => v.variantType === activeVariantTab)?.sellingPrice || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVariants(prev => {
                                                const exists = prev.find(v => v.variantType === activeVariantTab);
                                                if (exists) {
                                                    return prev.map(v => v.variantType === activeVariantTab ? { ...v, sellingPrice: val } : v);
                                                }
                                                return [...prev, { variantType: activeVariantTab, quantity: "", sellingPrice: val, buyingPrice: "", profitMargin: "" }];
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="modal-save-btn" onClick={() => setIsVariantModalOpen(false)}>Save Variants</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isSpecifyModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Stock Distribution</h3>
                            <button type="button" className="modal-close-btn" style={{ position: 'absolute', top: '20px', right: '24px' }} onClick={() => setIsSpecifyModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* NEW TOP SECTION: Total and Balance Qty */}
                            {(() => {
                                const selectedVariantData = variants.find(v => v.variantType === activeDistVariant);
                                const vTotal = Number(selectedVariantData?.quantity) || 0;
                                const dist = distPerVariant[activeDistVariant] || { display: "", shop: "", outside: "" };
                                const entered = (Number(dist.display) || 0) + (Number(dist.shop) || 0) + (Number(dist.outside) || 0);
                                const balance = vTotal - entered;

                                return (
                                    <>
                                        <div className="variant-summary-display" style={{ marginBottom: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 20px' }}>
                                            <div className="summary-item">
                                                <span className="summary-label">Total Quantity:</span>
                                                <span className="summary-value total" style={{ color: '#111827', fontWeight: 700 }}>{vTotal}</span>
                                            </div>
                                            <div className="summary-divider" style={{ margin: '0 20px', color: '#d1d5db' }}>|</div>
                                            <div className="summary-item">
                                                <span className="summary-label">Balance Quantity:</span>
                                                <span className="summary-value balance" style={{ color: balance < 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{balance}</span>
                                            </div>
                                        </div>

                                        {balance < 0 && (
                                            <div className="qty-validation-error" style={{ marginBottom: '15px' }}>
                                                Entered quantity cannot exceed total quantity for this variant
                                            </div>
                                        )}

                                        {/* NEW LEFT CORNER DROPDOWN */}
                                        <div className="variant-select-section" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <label style={{ fontWeight: 600, color: '#374151' }}>Variant Type:</label>
                                            <select 
                                                value={activeDistVariant} 
                                                onChange={(e) => setActiveDistVariant(e.target.value)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1.5px solid #d1d5db',
                                                    backgroundColor: 'white',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    width: '200px'
                                                }}
                                            >
                                                <option value="original">Original</option>
                                                <option value="import">Import</option>
                                                <option value="compliment">Complimentary</option>
                                            </select>
                                        </div>

                                        {/* FORM LAYOUT BELOW */}
                                        <div className="variant-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                            <div className="variant-input-group">
                                                <label>Display Stock</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter Display Stock"
                                                    value={dist.display}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setDistPerVariant(prev => ({
                                                            ...prev,
                                                            [activeDistVariant]: { ...prev[activeDistVariant], display: val }
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            <div className="variant-input-group">
                                                <label>Shop in Sale Stock</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter Shop in Sale Stock"
                                                    value={dist.shop}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setDistPerVariant(prev => ({
                                                            ...prev,
                                                            [activeDistVariant]: { ...prev[activeDistVariant], shop: val }
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            <div className="variant-input-group">
                                                <label>Outside Stock</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter Outside Stock"
                                                    value={dist.outside}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setDistPerVariant(prev => ({
                                                            ...prev,
                                                            [activeDistVariant]: { ...prev[activeDistVariant], outside: val }
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="modal-save-btn" onClick={() => setIsSpecifyModalOpen(false)}>Save Details</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default StockEntry;