import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt, FaChevronLeft, FaChevronRight, FaQrcode, FaInfoCircle, FaTimes, FaWarehouse, FaCheckCircle, FaRegCircle, FaEye, FaUndo, FaEdit } from 'react-icons/fa';

import { getStocks, getStockTypesByStockId } from '../../../../api/stock';
import { getCustomers, getCustomerByBusiness } from '../../../../api/customer';
import { fetchCategories } from '../../../../api/category';
import AdvancedProductSearch from '../Advancedproductsearch/Advanceproductsearch';
import CustomerSelect from '../Selectcustomer_company/selectcustomer_company';
import AddBilling from '../AddBilling/Addbilling';
import CompanyForm from '../../Add_CC/Business/Business';
import CheckoutPage from '../Payment/Payment';
import { showAlert } from '../../../../Components/Notification/CenterAlert';
import { IMAGE_BASE_API } from '../../../../api/base_api/api_list';
import './Billing.css';

const BillingPage = () => {
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
    // const [searchQty, setSearchQty] = useState('');
    const [searchBy, setSearchBy] = useState('Product Name');
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [showCustomerSelect, setShowCustomerSelect] = useState(false);
    const [showAddBilling, setShowAddBilling] = useState(false);
    const [showAddCC, setShowAddCC] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [addedProducts, setAddedProducts] = useState<any[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [billingQtys, setBillingQtys] = useState<Record<string, number>>({});
    const [billingPriceWithTax, setBillingPriceWithTax] = useState<Record<string, number>>({});
    const [billingDiscounts, setBillingDiscounts] = useState<Record<string, number>>({});
    const [billingPriceWithTaxMode, setBillingPriceWithTaxMode] = useState<Record<string, 'Percentage' | 'Amount'>>({});
    const [billingDiscountMode, setBillingDiscountMode] = useState<Record<string, 'Percentage' | 'Amount'>>({});
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [gstNo, setGstNo] = useState('');
    const [companyNameInput, setCompanyNameInput] = useState('');
    const [verificationMethod, setVerificationMethod] = useState('Mobile No');
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [customerNotFound, setCustomerNotFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('User'); // 'User' or 'Product'
    const [customerType, setCustomerType] = useState('User'); // 'User' or 'Business'
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedViewProduct, setSelectedViewProduct] = useState<any>(null);
    const [showBillingItemDetail, setShowBillingItemDetail] = useState(false);
    const [billingItemDetailData, setBillingItemDetailData] = useState<any>(null);
    const [selectedViewProdId, setSelectedViewProdId] = useState<string | null>(null);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [selectedItemFilters, setSelectedItemFilters] = useState<Set<string>>(new Set());
    const [categoryList, setCategoryList] = useState<any[]>([]);
    const [filterFeature, setFilterFeature] = useState('All');
    const [filterBrand, setFilterBrand] = useState('All');
    const [filterPrice, setFilterPrice] = useState('All');
    const [manualPrice, setManualPrice] = useState('');
    const [showPriceDropdown, setShowPriceDropdown] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [showFeatureDropdown, setShowFeatureDropdown] = useState(false);
    const [featureSearch, setFeatureSearch] = useState('');
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [brandSearch, setBrandSearch] = useState('');

    const [showAdditionalChargeModal, setShowAdditionalChargeModal] = useState(false);
    const [selectedAdditionalCharges, setSelectedAdditionalCharges] = useState<Set<string>>(new Set());
    const [shippingCharge, setShippingCharge] = useState({ amount: 0, tax: 0 });
    const [packagingCharge, setPackagingCharge] = useState({ amount: 0, tax: 0 });
    const [taxManualMode, setTaxManualMode] = useState<Record<string, boolean>>({});
    const [discountManualMode, setDiscountManualMode] = useState<Record<string, boolean>>({});
    const [billingStockDist, setBillingStockDist] = useState<Record<string, string>>({});
    const [stockDistOptions, setStockDistOptions] = useState<Record<string, any[]>>({});

    // Stock Request Modal State
    const [showStockRequest, setShowStockRequest] = useState(false);
    const [stockRequestProduct, setStockRequestProduct] = useState<any>(null);
    const [stockRequestVariant, setStockRequestVariant] = useState('');
    const [stockRequestQty, setStockRequestQty] = useState('');
    const [stockRequestNotes, setStockRequestNotes] = useState('');
    const [stockRequestError, setStockRequestError] = useState('');
    const [stockRequestSuccess, setStockRequestSuccess] = useState(false);
    const [stockRequestPrice, setStockRequestPrice] = useState('');
    const [stockRequestDate, setStockRequestDate] = useState(new Date().toISOString().split('T')[0]);
    const [stockRequestTime, setStockRequestTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    const [otpValue, setOtpValue] = useState('');
    const [newCustomerRegName, setNewCustomerRegName] = useState('');
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [modalAddress, setModalAddress] = useState('');
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const lastVerifiedPhoneRef = useRef('');

    const handleStockDistChange = (pId: string, value: string) => {
        setBillingStockDist(prev => ({ ...prev, [pId]: value }));
    };

    // Fetch stock types from API when item is selected
    const fetchStockDistForItem = async (prod: any, pId: string) => {
        const stockId = prod.actual_id || prod.stock_id || prod.id;
        if (!stockId || stockDistOptions[pId]) return; // Already fetched or no ID
        try {
            const res = await getStockTypesByStockId(stockId);
            console.log(`📦 Stock types response for stock ${stockId} (pId: ${pId}):`, JSON.stringify(res));

            // Try multiple response shapes
            let options: any[] = [];
            if (Array.isArray(res)) {
                options = res;
            } else if (res?.data && Array.isArray(res.data)) {
                options = res.data;
            } else if (res?.data?.stock_types && Array.isArray(res.data.stock_types)) {
                options = res.data.stock_types;
            } else if (res?.stock_types && Array.isArray(res.stock_types)) {
                options = res.stock_types;
            }

            if (options.length > 0) {
                // Normalize the options to ensure consistent field names
                const normalized = options.map((opt: any) => ({
                    stock_type_id: opt.stock_type_id || opt.id || opt.type_id,
                    name: opt.name || opt.stock_type_name || opt.type_name ||
                        (opt.stock_type_id === 1 ? 'Display' : opt.stock_type_id === 2 ? 'Shop in Sales' : opt.stock_type_id === 3 ? 'Outside Stocks' : `Type ${opt.stock_type_id}`),
                    available_qty: opt.available_qty ?? opt.qty ?? opt.quantity ?? opt.available ?? 0
                }));
                console.log(`✅ Normalized ${normalized.length} stock type options:`, normalized);
                setStockDistOptions(prev => ({ ...prev, [pId]: normalized }));
            } else {
                console.warn(`⚠️ No stock type options found for stock ${stockId}. Full response:`, res);
            }
        } catch (err) {
            console.error(`Failed to fetch stock types for stock ${stockId}:`, err);
        }
    };

    // Unique key for each distributed stock row
    const getProdId = (prod: any, index: number) => String(prod.id || index);

    const getSellingPrice = (prod: any) => {
        const p = prod.selling_price ?? prod.sellingPrice ?? prod.price ?? prod.mrp ?? 0;
        return Number(p);
    };

    const getAvailableQty = (prod: any) => {
        return prod.quantity || prod.qty || prod.available_qty || prod.stock || prod.stock_qty || prod.variant_qty || "0";
    };
    const handleQtyChange = (pId: string, value: string) => {
        const numVal = value === '' ? 0 : parseInt(value, 10);
        setBillingQtys(prev => ({ ...prev, [pId]: isNaN(numVal) ? 1 : numVal }));
    };

    const handlePriceWithTaxModeChange = (pId: string, mode: 'Percentage' | 'Amount') => {
        setBillingPriceWithTaxMode(prev => ({ ...prev, [pId]: mode }));
    };

    const handleDiscountModeChange = (pId: string, mode: 'Percentage' | 'Amount') => {
        setBillingDiscountMode(prev => ({ ...prev, [pId]: mode }));
    };

    const toggleProductSelection = (prodId: string) => {
        const newSet = new Set(selectedProductIds);
        if (newSet.has(prodId)) {
            newSet.delete(prodId);
        } else {
            newSet.add(prodId);
            // Fetch stock types when selecting an item
            const prod = addedProducts.find((p: any, i: number) => getProdId(p, i) === prodId);
            if (prod) {
                fetchStockDistForItem(prod, prodId);
                // Prompt requirement: Default QTY = total available qty
                const availableQty = Number(getAvailableQty(prod));
                setBillingQtys(prev => ({ ...prev, [prodId]: availableQty }));
            }
        }
        setSelectedProductIds(newSet);
    };



    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchValue(searchValue);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchValue]);

    useEffect(() => {
        const loadCustomers = async () => {
            try {
                const res = await getCustomers();
                if (res && res.data) {
                    setAllCustomers(Array.isArray(res.data) ? res.data : []);
                } else if (Array.isArray(res)) {
                    setAllCustomers(res);
                }
            } catch (err) {
                console.error("Failed to load customers for suggestions", err);
            }
        };
        loadCustomers();
    }, []);

    const phoneSuggestions = useMemo(() => {
        if (!customerPhone) return allCustomers.slice(0, 10);
        const search = customerPhone.toLowerCase();
        return allCustomers.filter(c => {
            const mobile = String(c.mobile || c.phone || '');
            const name = String(c.name || c.customer_name || '').toLowerCase();
            return mobile.includes(search) || name.includes(search);
        }).slice(0, 10);
    }, [customerPhone, allCustomers]);

    // Fetch stock from backend (using getStocks as requested)
    useEffect(() => {
        const loadStocks = async () => {
            setLoading(true);
            try {
                const res = await getStocks();
                let apiStocks: any[] = [];

                if (res && (res.success || res.status)) {
                    apiStocks = res.data?.stocks || res.data || [];
                } else if (Array.isArray(res)) {
                    apiStocks = res;
                }

                if (apiStocks.length > 0) {
                    console.log("📥 Stocks loaded from /api/stocks:", apiStocks);
                    const flattened: any[] = [];

                    apiStocks.forEach((item: any) => {
                        const productName = item.product_name || item.product?.product_name || item.product?.name || (typeof item.product === 'string' ? item.product : "Unknown");

                        if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
                            item.variants.forEach((v: any, vIdx: number) => {
                                const internalId = item.id ? `${item.id}-${vIdx}` : `stock-${Math.random()}`;
                                flattened.push({
                                    ...item,
                                    id: internalId,
                                    actual_id: item.id,
                                    stock_id: item.id,
                                    product_id: item.product_id,
                                    product_name: productName,
                                    variant_id: v.variant_id || 1,
                                    variant_type: v.variant_name || v.name || v.variantType || (v.variant_id === 1 ? 'original' : v.variant_id === 2 ? 'imported' : 'compliment'),
                                    selling_price: v.selling_price || v.sellingPrice || item.selling_price,
                                    quantity: v.qty || v.quantity || 0,
                                    shelf_id: item.shelf_id,
                                    shelf_name: item.shelf_name || '-',
                                    brand_name: item.brand_name || item.product?.brand_name || item.product?.brand?.name || "-",
                                    stock_type_id: item.stock_type_id || (item.stockType === 'Primary' || item.stock_type_name === 'Display' ? 1 : 2),
                                    stock_type_name: item.stock_type_name || item.stockType || 'Display'
                                });
                            });
                        } else {
                            const internalId = item.id ? String(item.id) : `stock-${Math.random()}`;
                            flattened.push({
                                ...item,
                                id: internalId,
                                actual_id: item.id,
                                stock_id: item.id,
                                product_id: item.product_id,
                                product_name: productName,
                                brand_name: item.brand_name || item.product?.brand_name || item.product?.brand?.name || "-",
                                quantity: item.quantity || item.qty || item.total_qty || 0,
                                stock_type_id: item.stock_type_id || (item.stockType === 'Primary' || item.stock_type_name === 'Display' ? 1 : 2),
                                stock_type_name: item.stock_type_name || item.stockType || 'Display'
                            });
                        }
                    });
                    setAddedProducts(flattened);
                    setSelectedProductIds(new Set<string>());
                } else {
                    setAddedProducts([]);
                }
            } catch (error) {
                console.error("Error fetching available stock for billing:", error);
                setAddedProducts([]);
            } finally {
                setLoading(false);
            }
        };
        loadStocks();
        // Auto-focus search input
        if (activeTab === 'Product' && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [activeTab]);

    // Fetch categories for the "Select Items" dropdown
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await fetchCategories();
                const cats = Array.isArray(res) ? res : (res?.data || []);
                setCategoryList(cats);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        loadCategories();
    }, []);

    const handleCustomerSelect = (customer: any) => {
        setSelectedCustomer(customer);
        setShowCustomerSelect(false);
    };

    const handleStoreSelect = () => {
        setShowAddBilling(false);
    };

    const handleAddNewCC = () => {
        setShowCustomerSelect(false);
        setShowAddCC(true);
    };
    const handleDirectPayment = (pId: string) => {
        // 1. Find product to get available quantity
        const prod = addedProducts.find((p: any, i: number) => getProdId(p, i) === pId);
        if (!prod) return;

        const availableQty = Number(getAvailableQty(prod));

        // 2. Ensure product is selected
        if (!selectedProductIds.has(pId)) {
            const newSet = new Set(selectedProductIds);
            newSet.add(pId);
            setSelectedProductIds(newSet);
            // Fetch stock types for this item
            fetchStockDistForItem(prod, pId);
        }

        // 3. Set quantity to total available qty as default (per user requirement)
        setBillingQtys(prev => {
            return { ...prev, [pId]: availableQty };
        });

        // 4. Scroll to Selected Items table
        setTimeout(() => {
            document.getElementById('selected-items-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleViewProduct = (prod: any, pId: string) => {
        setSelectedViewProduct(prod);
        setSelectedViewProdId(pId);
        setShowProductModal(true);
    };

    const handleSaveCC = (data: any) => {
        setSelectedCustomer({
            name: data.companyName || (data.customerName || 'New Customer'),
            mobile: data.phone || data.mobile || '',
            ...data
        });
        setShowAddCC(false);
    };
    const handleSaveBusiness = () => {
        if (!companyNameInput.trim()) {
            showAlert("Please enter a Business Name.", "error");
            return;
        }
        const data = {
            name: customerName,
            mobile: customerPhone,
            company_name: companyNameInput,
            gst_no: gstNo,
            type: 'Business'
        };
        setSelectedCustomer(data);
        showAlert(`✅ Business details saved: ${companyNameInput}`, "success");
    };

    const handleVerifyCustomer = async () => {
        if (!customerPhone.trim()) {
            showAlert("Please enter a value to verify.", "error");
            return;
        }

        setVerifying(true);
        setShowUserDetails(false);
        try {
            // Priority: getCustomerByBusiness API
            const res = await getCustomerByBusiness(customerPhone);
            let found = res?.data || res;

            // Handle array responses by finding the best matching record
            if (Array.isArray(found)) {
                found = found.find((c: any) => 
                    String(c.phone || c.mobile || c.contact || '').includes(customerPhone)
                ) || found[0]; // fallback to first item
            }

            if (found && (found.name || found.customerName || found.companyName || found.customer_name)) {
                const name = found.name || found.customerName || "";
                const bName = found.companyName || found.business_name || "";
                const gst = found.gst_no || found.gstNo || "";

                setCustomerName(name);
                setCompanyNameInput(bName || name);
                setGstNo(gst);
                // Automatically populate phone number from API if available
                if (found.mobile || found.phone) {
                    setCustomerPhone(found.mobile || found.phone);
                }

                setCustomerNotFound(false);
                lastVerifiedPhoneRef.current = customerPhone;
                setSelectedCustomer({
                    name: name,
                    mobile: customerPhone,
                    company_name: bName,
                    gst_no: gst,
                    ...found
                });
                setShowUserDetails(true);
            } else {
                setCustomerNotFound(true);
                lastVerifiedPhoneRef.current = customerPhone;
                setShowUserDetails(false);
                setSelectedCustomer(null);
            }
        } catch (error) {
            console.error("Verification failed", error);
            showAlert("Customer data could not be fetched. Please enter manually.", "error");
        } finally {
            setVerifying(false);
        }
    };

    // handleSendOtp removed — Add New Customer now opens external URL directly
    // const handleSendOtp = async (inputPhone?: string) => {
    //     const phone = inputPhone || customerPhone;
    //     if (!phone || phone.length < 10) {
    //         showAlert("Please enter a valid 10-digit mobile number.", "error");
    //         return;
    //     }
    //     setVerifying(true);
    //     try {
    //         showAlert(`OTP sent to ${phone}. (Mock: use 1234)`, "success");
    //         setShowAddCustomerModal(true);
    //     } catch (e) {
    //         showAlert("Failed to send OTP. Please try again.", "error");
    //     } finally {
    //         setVerifying(false);
    //     }
    // };

    // const handleVerifyOtp = async () => {
    //     if (otpValue === '1234') { // Mock OTP check
    //         showAlert("OTP Verified!", "success");
    //         setIsOtpVerified(true);
    //     } else {
    //         showAlert("Invalid OTP. Please enter 1234.", "error");
    //     }
    // };

    // const handleFinalRegister = async () => {
    //     if (!newCustomerRegName.trim()) {
    //         showAlert("Please enter the customer name.", "error");
    //         return;
    //     }
    //     setVerifying(true);
    //     try {
    //         const res = await addCustomer({
    //             name: newCustomerRegName,
    //             mobile: customerPhone,
    //             address: modalAddress,
    //             customer_type: customerType
    //         });
    //         if (res) {
    //             showAlert("Customer registered successfully!", "success");
    //             const newCust = res.data || res;
    //             setSelectedCustomer(newCust);
    //             setCustomerName(newCustomerRegName);
    //             setShowUserDetails(true);
    //             setCustomerNotFound(false);
    //             setShowAddCustomerModal(false);
    //             setIsOtpVerified(false);
    //             setOtpValue('');
    //         }
    //     } catch (e) {
    //         showAlert("Failed to register customer.", "error");
    //     } finally {
    //         setVerifying(false);
    //     }
    // };

    useEffect(() => {
        const value = customerPhone.trim();
        // Standardize verification check: 10 chars for Mobile/PAN, 15 for GST
        const isMobileOrPan = (verificationMethod === 'Mobile No' || verificationMethod === 'PAN No') && value.length === 10;
        const isGst = verificationMethod === 'GST No' && value.length === 15;

        // Auto-verify if conditions are met and we aren't already SHOWING details or ALREADY verifying
        // Also ensure we haven't already tried verifying THIS phone and failed (!customerNotFound)
        if ((isMobileOrPan || isGst) && !showUserDetails && !verifying && !customerNotFound && lastVerifiedPhoneRef.current !== value) {
            handleVerifyCustomer();
        }
    }, [customerPhone, verificationMethod, showUserDetails, verifying, customerNotFound]);

    // Final filtered products
    const filteredProducts = useMemo(() => {
        let results = [...addedProducts];

        // 1. Search Query
        if (debouncedSearchValue.trim()) {
            const term = debouncedSearchValue.toLowerCase();
            results = results.filter(prod => {
                const name = (prod.product_name || prod.product?.product_name || '').toLowerCase();
                const qrCode = (prod.qr_code || '').toLowerCase();
                const barcode = (prod.barcode || '').toLowerCase();
                if (searchBy === 'Product Name') return name.startsWith(term);
                if (searchBy === 'QR Code') return qrCode.includes(term);
                if (searchBy === 'Barcode') return barcode.includes(term);
                return name.startsWith(term) || qrCode.includes(term) || barcode.includes(term);
            });
        }

        // 2. Product Feature (Variant) Filter
        if (filterFeature !== 'All') {
            results = results.filter(p => (p.variant_type || 'original').toLowerCase() === filterFeature.toLowerCase());
        }

        // 3. Brand Filter
        if (filterBrand !== 'All') {
            results = results.filter(p => (p.brand_name || '-').toLowerCase() === filterBrand.toLowerCase());
        }

        // 4. Category Filter (Select Items)
        if (selectedItemFilters.size > 0) {
            results = results.filter(p => {
                const catName = p.category_name || p.category?.category_name || p.category?.name;
                return selectedItemFilters.has(catName);
            });
        }

        // 5. Price Filter (Preset or Manual)
        if (manualPrice.trim() !== '') {
            const searchPrice = parseFloat(manualPrice);
            if (!isNaN(searchPrice)) {
                results = results.filter(p => {
                    const price = getSellingPrice(p);
                    // Filter for exact price match when a manual price is entered
                    return price === searchPrice;
                });
            }
        } else if (filterPrice && filterPrice !== 'All' && filterPrice !== 'Low to High' && filterPrice !== 'High to Low') {
            results = results.filter(p => {
                const price = getSellingPrice(p);
                switch (filterPrice) {
                    case '0-100': return price >= 0 && price <= 100;
                    case '100-500': return price > 100 && price <= 500;
                    case '500-1000': return price > 500 && price <= 1000;
                    case '1000-2000': return price > 1000 && price <= 2000;
                    case '2000-5000': return price > 2000 && price <= 5000;
                    case '5000-10000': return price > 5000 && price <= 10000;
                    case '10000+': return price > 10000;
                    default: return true;
                }
            });
        }

        // 6. Price Sorting
        if (filterPrice === 'Low to High') {
            results.sort((a, b) => {
                const valA = getSellingPrice(a);
                const valB = getSellingPrice(b);
                return (valA || 0) - (valB || 0);
            });
        } else if (filterPrice === 'High to Low') {
            results.sort((a, b) => {
                const valA = getSellingPrice(a);
                const valB = getSellingPrice(b);
                return (valB || 0) - (valA || 0);
            });
        } else {
            // Default Alphabetical Sort (A-Z)
            results.sort((a, b) => {
                const nameA = (a.product_name || a.product?.product_name || '').toLowerCase();
                const nameB = (b.product_name || b.product?.product_name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
        }

        return results;
    }, [addedProducts, debouncedSearchValue, searchBy, filterFeature, filterBrand, filterPrice, selectedItemFilters]);

    // Unique brands in currently added products
    const availableBrands = useMemo(() => {
        const brands = new Set(addedProducts.map(p => p.brand_name || '-').filter(b => b !== '-'));
        return Array.from(brands).sort((a, b) => a.localeCompare(b));
    }, [addedProducts]);

    const availableFeatures = useMemo(() => {
        const features = new Set(addedProducts.map(p => p.feature_name || '-').filter(f => f !== '-'));
        return Array.from(features).sort((a, b) => a.localeCompare(b));
    }, [addedProducts]);

    const filteredAvailableBrands = useMemo(() => {
        const allBrands = ['All', 'Level-1', 'Level-2', 'Level-3', ...availableBrands];
        if (!brandSearch.trim()) return allBrands;
        const search = brandSearch.toLowerCase();
        return allBrands.filter(b => b.toLowerCase().startsWith(search));
    }, [availableBrands, brandSearch]);

    const filteredAvailableFeatures = useMemo(() => {
        const allFeatures = ['All', 'Level-1', 'Level-2', 'Level-3', ...availableFeatures];
        if (!featureSearch.trim()) return allFeatures;
        const search = featureSearch.toLowerCase();
        return allFeatures.filter(f => f.toLowerCase().startsWith(search));
    }, [availableFeatures, featureSearch]);

    // Category names for the "Select Items" dropdown
    const dropdownCategories = useMemo(() => {
        if (categoryList.length > 0) return categoryList;
        // Fallback: extract unique category names from stock data  
        const cats = new Map<string, any>();
        addedProducts.forEach(p => {
            const catName = p.category_name || p.category?.category_name || p.category?.name;
            const catId = p.category_id || p.category?.id;
            if (catName && !cats.has(catName)) {
                cats.set(catName, { id: catId, category_name: catName });
            }
        });
        return Array.from(cats.values()).sort((a: any, b: any) => {
            const nameA = a.category_name || a.name || "";
            const nameB = b.category_name || b.name || "";
            return nameA.localeCompare(nameB);
        });
    }, [categoryList, addedProducts]);

    const filteredDropdownCategories = useMemo(() => {
        if (!categorySearch.trim()) return dropdownCategories;
        const search = categorySearch.toLowerCase();
        return dropdownCategories.filter((cat: any) => {
            const name = (cat.category_name || cat.name || '').toLowerCase();
            return name.startsWith(search);
        }).sort((a: any, b: any) => {
            const nameA = a.category_name || a.name || "";
            const nameB = b.category_name || b.name || "";
            return nameA.localeCompare(nameB);
        });
    }, [dropdownCategories, categorySearch]);

    const toggleItemFilter = (catName: string) => {
        setSelectedItemFilters(prev => {
            const next = new Set(prev);
            if (next.has(catName)) {
                next.delete(catName);
            } else {
                next.add(catName);
            }
            return next;
        });
    };

    const clearItemFilters = () => {
        setSelectedItemFilters(new Set());
    };

    const selectAllItems = () => {
        setSelectedItemFilters(new Set(dropdownCategories.map((c: any) => c.category_name || c.name)));
    };

    // Reset all filters
    const handleResetFilters = () => {
        setFilterFeature('All');
        setFilterBrand('All');
        setFilterPrice('All');
        setManualPrice('');
        setSearchValue('');
        clearItemFilters();
    };

    // Pagination calculations
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredProducts.length);
    const currentData = useMemo(() => {
        return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredProducts, startIndex, rowsPerPage]);

    // Reset to page 1 when search or rowsPerPage changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchValue, searchBy, rowsPerPage, filterPrice, filterFeature, filterBrand, selectedItemFilters]);

    // Build billing items for checkout (items that are selected)
    const billingItems = useMemo(() => {
        return addedProducts
            .map((prod: any, index: number) => {
                const pId = String(prod.id || index);
                if (!selectedProductIds.has(pId)) return null;
                const available = Number(getAvailableQty(prod));
                if (available <= 0) return null; // Don't allow items with 0 stock

                const rawQty = billingQtys[pId];
                const qty = rawQty !== undefined && rawQty !== null ? rawQty : 1;
                const finalQty = typeof qty === 'number' ? Math.min(qty, available) : qty;
                const numericQty = Number(finalQty) || 0;

                const price = getSellingPrice(prod);
                const taxRate = prod.tax_rate || prod.taxRate || 0;

                // Final Tax calculation
                let calculatedTaxPerUnit: number;
                const pwtMode = billingPriceWithTaxMode[pId] || 'Amount';
                const pwtValue = billingPriceWithTax[pId];
                const isManual = taxManualMode[pId];

                if (pwtValue !== undefined) {
                    if (pwtMode === 'Percentage') {
                        calculatedTaxPerUnit = price * (pwtValue / 100);
                    } else {
                        calculatedTaxPerUnit = pwtValue;
                    }
                } else {
                    calculatedTaxPerUnit = price * (taxRate / 100);
                }

                const priceWithTax = price + calculatedTaxPerUnit;

                // Final Discount calculation
                let calculatedTotalDiscount: number;
                const dMode = billingDiscountMode[pId] || 'Amount';
                const dValue = billingDiscounts[pId];
                const defaultDiscount = prod.discount || prod.discount_amount || 0;

                if (dValue !== undefined) {
                    if (dMode === 'Percentage') {
                        calculatedTotalDiscount = (priceWithTax * numericQty) * (dValue / 100);
                    } else {
                        calculatedTotalDiscount = dValue;
                    }
                } else {
                    calculatedTotalDiscount = defaultDiscount;
                }

                const stockDistName = billingStockDist[pId] || prod.stock_type_name || (prod.stock_type_id === 1 ? 'Display' : prod.stock_type_id === 2 ? 'Shop In Sale' : prod.stock_type_id === 3 ? 'Outside Stock' : 'Display');

                // Find correct stockTypeId from options or fallback mapping
                let currentStockTypeId = prod.stock_type_id;
                const options = stockDistOptions[pId] || [];
                if (options.length > 0) {
                    const match = options.find((opt: any) => opt.name === stockDistName);
                    if (match) currentStockTypeId = match.stock_type_id;
                } else {
                    // Fallback to standard mappings if no specific options fetched
                    if (stockDistName === 'Display') currentStockTypeId = 1;
                    else if (stockDistName === 'Shop In Sale' || stockDistName === 'Shop in Sales') currentStockTypeId = 2;
                    else if (stockDistName === 'Outside Stock' || stockDistName === 'Outside Stocks') currentStockTypeId = 3;
                }

                // Compute stock qty for the currently selected stock dist option
                const distOpts = stockDistOptions[pId] || [];
                const stTypesArr = prod.stock_types || [];
                let selectedStockQty = available; // fallback to total available
                if (distOpts.length > 0) {
                    const selOpt = distOpts.find((o: any) => o.name === stockDistName);
                    if (selOpt) selectedStockQty = Number(selOpt.available_qty) || 0;
                } else if (stTypesArr.length > 0) {
                    const selSt = stTypesArr.find((s: any) => s.stock_type_id === currentStockTypeId);
                    if (selSt) selectedStockQty = Number(selSt.qty) || 0;
                }

                return {
                    productId: prod.product_id,
                    stockId: prod.actual_id || prod.stock_id || prod.id,
                    rowId: pId,
                    variantId: prod.variant_id,
                    variantType: prod.variant_type || 'original',
                    quantity: finalQty,
                    shelfId: prod.shelf_id,
                    stockTypeId: currentStockTypeId,
                    stockTypeName: stockDistName,
                    stockTypes: prod.stock_types || [],
                    stockDistOptions: stockDistOptions[pId] || [],
                    selectedStockQty,
                    productName: prod.product_name || prod.product?.product_name || '-',
                    sellingPrice: price,
                    tax: calculatedTaxPerUnit * numericQty,
                    discount: calculatedTotalDiscount,
                    total: (priceWithTax * numericQty) - calculatedTotalDiscount,
                    priceWithTaxMode: pwtMode,
                    discountMode: dMode,
                    priceWithTaxValue: pwtValue !== undefined ? pwtValue : (pwtMode === 'Percentage' ? taxRate : calculatedTaxPerUnit),
                    discountValue: dValue !== undefined ? dValue : (dMode === 'Percentage' ? 0 : calculatedTotalDiscount),
                    calculatedTaxDisplay: calculatedTaxPerUnit * numericQty,
                    calculatedDiscountDisplay: calculatedTotalDiscount,
                    availableQty: available,
                    warranty: prod.warranty || prod.warranty_period || '-',
                    isManualTax: isManual,
                    productImage: prod.product_image || prod.product?.product_image || null,
                };
            })
            .filter(Boolean) as any[];
    }, [addedProducts, selectedProductIds, billingQtys, billingPriceWithTax, billingDiscounts, billingPriceWithTaxMode, billingDiscountMode, taxManualMode, billingStockDist, stockDistOptions]);

    const grandTotal = useMemo(() => {
        const subtotal = billingItems.reduce((acc, curr) => acc + curr.total, 0);
        let extra = 0;
        if (selectedAdditionalCharges.has('shipping')) {
            extra += shippingCharge.amount + (shippingCharge.amount * (shippingCharge.tax / 100));
        }
        if (selectedAdditionalCharges.has('packaging')) {
            extra += packagingCharge.amount + (packagingCharge.amount * (packagingCharge.tax / 100));
        }
        return subtotal + extra;
    }, [billingItems, shippingCharge, packagingCharge, selectedAdditionalCharges]);

    const handleAdvancedProductSelect = (product: any) => {
        // Here we add the product to our local list if it's not there, and select it.
        // We need to map it to the structure BillingPage expects.
        const productId = String(product._id || product.id);

        // Check if already in addedProducts
        const exists = addedProducts.find(p => String(p.product_id || p.id) === productId);

        if (exists) {
            const pId = String(exists.id || addedProducts.indexOf(exists));
            toggleProductSelection(pId);
        } else {
            const newProd = {
                ...product,
                product_id: productId,
                product_name: product.name || product.product_name,
                selling_price: product.price || product.selling_price || 0,
                quantity: product.stock || product.quantity || 0,
                warranty: product.warranty || product.warranty_period || '-',
                variant_type: product.variant_type || 'original',
                shelf_name: product.shelf_name || '-',
                stock_type_name: 'Primary'
            };
            const updatedList = [...addedProducts, newProd];
            setAddedProducts(updatedList);
            const newIndex = updatedList.length - 1;
            const newPId = String(newProd.id || newIndex);
            toggleProductSelection(newPId);
        }
    };



    if (showPayment) {
        return (
            <div className="page-wrapper">
                <button className="back-btn" onClick={() => setShowPayment(false)}>
                    ← Back
                </button>
                <CheckoutPage
                    selectedCustomer={selectedCustomer || { name: customerName, mobile: customerPhone }}
                    billingItems={billingItems}
                    additionalCharges={{
                        shipping: shippingCharge,
                        packaging: packagingCharge
                    }}
                    grandTotal={grandTotal}
                />
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            {/* Main Section: Billing & Products */}
            <section className="billing-section">
                <div className="section-header blue-bg">
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            className={`btn-advanced-search ${activeTab === 'User' ? 'active-tab' : ''}`}
                            style={{
                                backgroundColor: activeTab === 'User' ? '#fff' : 'transparent',
                                color: activeTab === 'User' ? '#007bff' : '#fff'
                            }}
                            onClick={() => setActiveTab('User')}
                        >
                            User
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                className={`btn-advanced-search ${activeTab === 'Product' ? 'active-tab' : ''}`}
                                style={{
                                    backgroundColor: activeTab === 'Product' ? '#fff' : 'transparent',
                                    color: activeTab === 'Product' ? '#007bff' : '#fff'
                                }}
                                onClick={() => setActiveTab('Product')}
                            >
                                Products
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card-content">
                    {activeTab === 'User' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                {/* <h3 style={{ margin: 0 }}>User Details</h3> */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                        <button
                                            onClick={() => setCustomerType('User')}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                backgroundColor: customerType === 'User' ? '#fff' : 'transparent',
                                                color: customerType === 'User' ? '#007bff' : '#64748b',
                                                boxShadow: customerType === 'User' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            User
                                        </button>
                                        <button
                                            onClick={() => setCustomerType('Business')}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                backgroundColor: customerType === 'Business' ? '#fff' : 'transparent',
                                                color: customerType === 'Business' ? '#007bff' : '#64748b',
                                                boxShadow: customerType === 'Business' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Business
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="search-grid">
                                {customerType === 'Business' && (
                                    <div className="input-group">
                                        <label>Verify By</label>
                                        <select
                                            className="form-control"
                                            value={verificationMethod}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setVerificationMethod(val);
                                                setCustomerPhone('');
                                                setShowUserDetails(false);
                                            }}
                                        >
                                            <option>Mobile No</option>
                                            <option>GST No</option>
                                            <option>PAN No</option>
                                        </select>
                                    </div>
                                )}

                                <div className="input-group grow" style={{ position: 'relative' }}>
                                    <label>{customerType === 'User' ? 'Mobile No' : verificationMethod}</label>
                                    <input
                                        type="text"
                                        placeholder={customerType === 'User' ? 'Enter Mobile No' :
                                            verificationMethod === 'Mobile No' ? 'Enter Mobile No' :
                                                verificationMethod === 'GST No' ? 'Enter GST Number' :
                                                    verificationMethod === 'PAN No' ? 'Enter PAN Number' : `Enter ${verificationMethod}`}
                                        className="form-control"
                                        value={customerPhone}
                                        onFocus={() => setShowPhoneSuggestions(true)}
                                        onBlur={(e) => {
                                            setTimeout(() => setShowPhoneSuggestions(false), 200);
                                            if (e.target.value.length >= 10 && !showUserDetails && !verifying) {
                                                handleVerifyCustomer();
                                            }
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setCustomerPhone(val);
                                            setShowUserDetails(false);
                                            setCustomerNotFound(false);
                                            lastVerifiedPhoneRef.current = '';
                                        }}
                                    />
                                    {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            zIndex: 51,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            width: '200px'
                                        }}>
                                            {phoneSuggestions.map((c, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: '10px 14px',
                                                        cursor: 'pointer',
                                                        borderBottom: idx < phoneSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                        display: 'flex',
                                                        justifyContent: 'space-between'
                                                    }}
                                                    onClick={() => {
                                                        setCustomerPhone(c.mobile || c.phone || '');
                                                        setCustomerName(c.name || c.customer_name || '');
                                                        setGstNo(c.gst_no || c.gstNo || '');
                                                        setCompanyNameInput(c.companyName || c.business_name || c.name || '');
                                                        setShowPhoneSuggestions(false);
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>{c.mobile || c.phone}</span>
                                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{c.name || c.customer_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {verifying && (
                                        <div style={{ position: 'absolute', right: '10px', top: '35px' }}>
                                            <div className="spinner-small"></div>
                                        </div>
                                    )}
                                    {customerNotFound && (
                                        <p style={{ position: 'absolute', top: '100%', left: 0, color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 500 }}>
                                            Customer not found. Please add new customer.
                                        </p>
                                    )}
                                </div>
                                {/* 
                                {customerType === 'Business' && (
                                    <>
                                        <div className="input-group">
                                            <label>GST.No</label>
                                            <input
                                                type="text"
                                                placeholder="Enter GST No"
                                                className="form-control"
                                                value={gstNo}
                                                onChange={(e) => setGstNo(e.target.value)}
                                            />
                                        </div>
                                        <div className="input-group grow">
                                            <label>Company Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter Company Name"
                                                className="form-control"
                                                value={companyNameInput}
                                                onChange={(e) => setCompanyNameInput(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )} */}

                                <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button
                                        className="btn-blue"
                                        style={{ 
                                            height: '42px', 
                                            width: '100%', 
                                            whiteSpace: 'nowrap', 
                                            minWidth: '100px',
                                            animation: customerNotFound ? 'pulse-blue 1.5s infinite' : 'none',
                                            backgroundColor: '#007bff'
                                        }}
                                        onClick={() => {
                                            if (customerType === 'Business' && !customerNotFound) {
                                                handleSaveBusiness(); 
                                            } else {
                                                window.open('https://user.jobes24x7.com/', '_blank');
                                            }
                                        }}
                                        disabled={verifying}
                                    >
                                        {verifying ? 'Processing...' : 
                                         customerType === 'Business' && !customerNotFound ? 'Save Business' : 'Add New Customer'}
                                    </button>
                                </div>
                            </div>

                            {showUserDetails && selectedCustomer && (
                                <div className="verified-details-card fade-in">
                                    <div className="verified-header">
                                        <h4>Customer Information</h4>
                                        <div className="verified-badge">Verified</div>
                                    </div>
                                    <div className="details-grid">
                                        <div className="detail-field">
                                            <label>Customer Name</label>
                                            <p>{selectedCustomer.name || selectedCustomer.customerName || '-'}</p>
                                        </div>
                                        <div className="detail-field">
                                            <label>Address</label>
                                            <p>{selectedCustomer.address || selectedCustomer.address_line || selectedCustomer.location || '-'}</p>
                                        </div>
                                        <div className="detail-field">
                                            <label>Email</label>
                                            <p>{selectedCustomer.email || '-'}</p>
                                        </div>
                                        {/* <div className="detail-field">
                                            <label>Previous Balance</label>
                                            <p style={{ color: (selectedCustomer.balance || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                                                ₹{selectedCustomer.balance || 0}
                                            </p>
                                        </div> */}
                                    </div>
                                </div>
                            )}
                        </>
                    )}


                    {activeTab === 'Product' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0 }}>Product Search</h3>
                                <button
                                    className="btn-blue-outline"
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '8px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #007bff',
                                        color: '#007bff',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowAdvancedSearch(true)}
                                >
                                    Advanced Search
                                </button>
                            </div>

                            <div className="search-grid">
                                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Search By:</label>
                                    <select
                                        className="form-control"
                                        value={searchBy}
                                        style={{ height: '42px', maxWidth: '150px' }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSearchBy(val);
                                            if (val === 'QR Code' || val === 'Barcode') {
                                                setShowScanner(true);
                                            }
                                        }}
                                    >
                                        <option>Product Name</option>
                                        <option>QR Code</option>
                                        <option>Barcode</option>
                                    </select>
                                </div>

                                <div className="input-group grow" style={{ flexGrow: 0, flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Enter Value:</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '80px' }}>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder={
                                                searchBy === 'Product Name' ? "Filter by first letter (A–Z)" :
                                                    searchBy === 'QR Code' ? "Scan QR code / enter value" :
                                                        searchBy === 'Barcode' ? "Scan Barcode / enter value" :
                                                            "Type to search..."
                                            }
                                            className="form-control"
                                            style={{ flex: 1, height: '42px', maxWidth: '300px' }}
                                            value={searchValue}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                                        />
                                        {searchBy !== 'Product Name' && (
                                            <button
                                                className="btn-blue"
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    width: '80px',
                                                    height: '80px',
                                                    padding: '0',
                                                    flexShrink: 0
                                                }}
                                                onClick={() => setShowScanner(true)}
                                            >
                                                <FaQrcode size={24} /> 
                                                <span style={{ fontSize: '12px' }}>Scan</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* <div className="input-group" style={{ width: '100px' }}>
                                    <label>Qty (Min)</label>
                                    <input
                                        type="number"
                                        placeholder="Min Qty"
                                        className="form-control"
                                        value={searchQty}
                                        onChange={(e) => setSearchQty(e.target.value)}
                                    />
                                </div> */}


                                {/* <button
                                    className="btn-green"
                                    onClick={handleGenerateBilling}
                                    disabled={selectedProductIds.size === 0}
                                >
                                    Generate Bill ({selectedProductIds.size})
                                </button> */}
                            </div>
                            {/* 
                            <p className="tip-text" style={{ marginTop: '15px', backgroundColor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}>
                                Scan the product QR code to automatically retrieve and display the product details in the table below.
                            </p> */}

                            <hr className="divider" />

                            {!(debouncedSearchValue.trim() !== '' || selectedItemFilters.size > 0) ? null : (
                                <div className="added-products-section fade-in">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', position: 'relative', zIndex: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <h3 className="blue-text" style={{ margin: 0 }}>
                                                Available Stock ({filteredProducts.length})
                                            </h3>
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => setShowItemDropdown(!showItemDropdown)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 14px',
                                                        backgroundColor: selectedItemFilters.size > 0 ? '#0d6efd' : '#f8fafc',
                                                        color: selectedItemFilters.size > 0 ? '#fff' : '#334155',
                                                        border: selectedItemFilters.size > 0 ? '1px solid #0d6efd' : '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Select Items {selectedItemFilters.size > 0 && `(${selectedItemFilters.size})`}
                                                    <span style={{ fontSize: '10px', transform: showItemDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                                </button>

                                                {showItemDropdown && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        marginTop: '6px',
                                                        width: '280px',
                                                        maxHeight: '320px',
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '10px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                                                        zIndex: 50,
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Filter by Category</span>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={selectAllItems} style={{ fontSize: '11px', color: '#0d6efd', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>All</button>
                                                                <button onClick={clearItemFilters} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                                                            </div>
                                                        </div>
                                                        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Search category (e.g. Type A)..."
                                                                value={categorySearch}
                                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                                autoFocus
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '8px 10px',
                                                                    fontSize: '13px',
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: '6px',
                                                                    outline: 'none',
                                                                    backgroundColor: '#f8fafc'
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '6px 0' }}>
                                                            {filteredDropdownCategories.length === 0 ? (
                                                                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                                                    {categorySearch ? `No categories starting with "${categorySearch}"` : 'No categories available'}
                                                                </div>
                                                            ) : (
                                                                filteredDropdownCategories.map((cat: any) => {
                                                                    const catName = cat.category_name || cat.name;
                                                                    return (
                                                                        <label
                                                                            key={cat.id || catName}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '10px',
                                                                                padding: '8px 14px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '14px',
                                                                                fontWeight: 500,
                                                                                color: '#1e293b',
                                                                                transition: 'background 0.15s',
                                                                                backgroundColor: selectedItemFilters.has(catName) ? '#eff6ff' : 'transparent'
                                                                            }}
                                                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = selectedItemFilters.has(catName) ? '#dbeafe' : '#f8fafc')}
                                                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = selectedItemFilters.has(catName) ? '#eff6ff' : 'transparent')}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedItemFilters.has(catName)}
                                                                                onChange={() => toggleItemFilter(catName)}
                                                                                style={{ width: '16px', height: '16px', accentColor: '#0d6efd', cursor: 'pointer' }}
                                                                            />
                                                                            {catName}
                                                                        </label>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                        <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                                                            <button
                                                                onClick={() => setShowItemDropdown(false)}
                                                                style={{
                                                                    padding: '5px 16px',
                                                                    backgroundColor: '#0d6efd',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Done
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>SHOW</span>
                                            <select
                                                value={rowsPerPage}
                                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #cbd5e1',
                                                    backgroundColor: '#fff',
                                                    fontSize: '14px',
                                                    color: '#334155',
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                                <option value={200}>200</option>
                                                <option value={500}>500</option>
                                                <option value={1000}>1000</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Filter Section */}
                                    <div className="dynamic-filter-section">
                                        <div className="filter-dropdown-grid">
                                            <div className="filter-group">
                                                <label>Product Feature</label>
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowFeatureDropdown(!showFeatureDropdown);
                                                            setShowBrandDropdown(false);
                                                            setShowItemDropdown(false);
                                                        }}
                                                        className="filter-select"
                                                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}
                                                    >
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {filterFeature === 'All' ? 'All Features' : filterFeature}
                                                        </span>
                                                        <span style={{ fontSize: '10px', transform: showFeatureDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                                    </button>
                                                    {showFeatureDropdown && (
                                                        <div style={{
                                                            position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '220px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden'
                                                        }}>
                                                            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search feature..."
                                                                    value={featureSearch}
                                                                    onChange={(e) => setFeatureSearch(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    autoFocus
                                                                    style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', backgroundColor: '#f8fafc' }}
                                                                />
                                                            </div>
                                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                {filteredAvailableFeatures.length === 0 ? (
                                                                    <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>No results found</div>
                                                                ) : (
                                                                    filteredAvailableFeatures.map(feat => (
                                                                        <div
                                                                            key={feat}
                                                                            onClick={() => { setFilterFeature(feat); setShowFeatureDropdown(false); setFeatureSearch(''); }}
                                                                            style={{ padding: '8px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f8fafc', backgroundColor: filterFeature === feat ? '#eff6ff' : 'transparent', color: filterFeature === feat ? '#0d6efd' : '#1e293b', fontWeight: filterFeature === feat ? 600 : 400 }}
                                                                        >
                                                                            {feat}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="filter-group">
                                                <label>Brand</label>
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowBrandDropdown(!showBrandDropdown);
                                                            setShowFeatureDropdown(false);
                                                            setShowItemDropdown(false);
                                                        }}
                                                        className="filter-select"
                                                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}
                                                    >
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {filterBrand === 'All' ? 'All Brands' : filterBrand}
                                                        </span>
                                                        <span style={{ fontSize: '10px', transform: showBrandDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                                    </button>
                                                    {showBrandDropdown && (
                                                        <div style={{
                                                            position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '220px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden'
                                                        }}>
                                                            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search brand..."
                                                                    value={brandSearch}
                                                                    onChange={(e) => setBrandSearch(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    autoFocus
                                                                    style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', backgroundColor: '#f8fafc' }}
                                                                />
                                                            </div>
                                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                {filteredAvailableBrands.length === 0 ? (
                                                                    <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>No results found</div>
                                                                ) : (
                                                                    filteredAvailableBrands.map(brand => (
                                                                        <div
                                                                            key={brand}
                                                                            onClick={() => { setFilterBrand(brand); setShowBrandDropdown(false); setBrandSearch(''); }}
                                                                            style={{ padding: '8px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f8fafc', backgroundColor: filterBrand === brand ? '#eff6ff' : 'transparent', color: filterBrand === brand ? '#0d6efd' : '#1e293b', fontWeight: filterBrand === brand ? 600 : 400 }}
                                                                        >
                                                                            {brand}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="filter-group" style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Price & Sort</label>
                                                <div 
                                                    onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px 14px',
                                                        backgroundColor: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: filterPrice !== 'All' ? '#0f172a' : '#64748b'
                                                    }}
                                                >
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {filterPrice === 'All' ? 'Price Range / Sort' : 
                                                         filterPrice === 'Low to High' ? 'Price: Low to High' :
                                                         filterPrice === 'High to Low' ? 'Price: High to Low' : 
                                                         `₹${filterPrice.replace('-', ' - ₹')}`}
                                                    </span>
                                                    <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showPriceDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                                </div>

                                                {showPriceDropdown && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        marginTop: '6px',
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '10px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                                                        zIndex: 100,
                                                        maxHeight: '350px',
                                                        overflowY: 'auto'
                                                    }}>
                                                        <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                                            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</div>
                                                            <div 
                                                                onClick={() => { setFilterPrice('Low to High'); setShowPriceDropdown(false); }}
                                                                style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', backgroundColor: filterPrice === 'Low to High' ? '#eff6ff' : 'transparent', color: filterPrice === 'Low to High' ? '#0d6efd' : '#1e293b', fontWeight: 500, fontSize: '13px' }}
                                                            >
                                                                Price: Low to High
                                                            </div>
                                                            <div 
                                                                onClick={() => { setFilterPrice('High to Low'); setShowPriceDropdown(false); }}
                                                                style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', backgroundColor: filterPrice === 'High to Low' ? '#eff6ff' : 'transparent', color: filterPrice === 'High to Low' ? '#0d6efd' : '#1e293b', fontWeight: 500, fontSize: '13px' }}
                                                            >
                                                                Price: High to Low
                                                            </div>
                                                        </div>
                                                        <div style={{ padding: '8px' }}>
                                                            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Range</div>
                                                            {[
                                                                { val: '0-100', label: '₹0 - ₹100' },
                                                                { val: '100-500', label: '₹100 - ₹500' },
                                                                { val: '500-1000', label: '₹500 - ₹1000' },
                                                                { val: '1000-2000', label: '₹1000 - ₹2000' },
                                                                { val: '2000-5000', label: '₹2000 - ₹5000' },
                                                                { val: '5000-10000', label: '₹5000 - ₹10000' },
                                                                { val: '10000+', label: '₹10000+' }
                                                            ].map(range => (
                                                                <div 
                                                                    key={range.val}
                                                                    onClick={() => { setFilterPrice(range.val); setManualPrice(''); setShowPriceDropdown(false); }}
                                                                    style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', backgroundColor: filterPrice === range.val ? '#eff6ff' : 'transparent', color: filterPrice === range.val ? '#0d6efd' : '#1e293b', fontWeight: 500, fontSize: '13px' }}
                                                                >
                                                                    {range.label}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ padding: '8px', borderTop: '1px solid #f1f5f9' }}>
                                                            <div 
                                                                onClick={() => { setFilterPrice('All'); setShowPriceDropdown(false); }}
                                                                style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', fontWeight: 600, textAlign: 'center', fontSize: '13px' }}
                                                            >
                                                                Reset Choice
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                <button className="btn-reset-filters" onClick={handleResetFilters}>
                                                    Reset Filters
                                                </button>
                                            </div>
                                        </div>

                                        {(filterFeature !== 'All' || filterBrand !== 'All' || filterPrice !== 'All' || manualPrice.trim() !== '' || selectedItemFilters.size > 0) && (
                                            <div className="filter-tags-container">
                                                {filterFeature !== 'All' && (
                                                    <span className="filter-tag">
                                                        Feature: {filterFeature} <FaTimes onClick={() => setFilterFeature('All')} />
                                                    </span>
                                                )}
                                                {filterBrand !== 'All' && (
                                                    <span className="filter-tag">
                                                        Brand: {filterBrand} <FaTimes onClick={() => setFilterBrand('All')} />
                                                    </span>
                                                )}
                                                {filterPrice !== 'All' && (
                                                    <span className="filter-tag">
                                                        Price: {
                                                            filterPrice === 'Low to High' ? 'Sort Low to High' :
                                                                filterPrice === 'High to Low' ? 'Sort High to Low' :
                                                                    filterPrice === '0-100' ? '₹0 - ₹100' :
                                                                        filterPrice === '100-500' ? '₹100 - ₹500' :
                                                                            filterPrice === '500-1000' ? '₹500 - ₹1000' :
                                                                                filterPrice === '1000-2000' ? '₹1000 - ₹2000' :
                                                                                    filterPrice === '2000-5000' ? '₹2000 - ₹5000' :
                                                                                        filterPrice === '5000-10000' ? '₹5000 - ₹10000' :
                                                                                            filterPrice === '10000+' ? '₹10000+' : filterPrice
                                                        }
                                                        <FaTimes onClick={() => setFilterPrice('All')} />
                                                    </span>
                                                )}
                                                {manualPrice.trim() !== '' && (
                                                    <span className="filter-tag">
                                                        Manual Price: ₹{manualPrice} <FaTimes onClick={() => setManualPrice('')} />
                                                    </span>
                                                )}
                                                {Array.from(selectedItemFilters).map(cat => (
                                                    <span key={cat} className="filter-tag">
                                                        Category: {cat} <FaTimes onClick={() => toggleItemFilter(cat)} />
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {loading ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>Loading distributed stock...</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="added-products-container">
                                                <table className="added-products-table">
                                                    <thead>
                                                        <tr>
                                                            <th>S.No</th>
                                                            <th>Product</th>
                                                            <th>Variant</th>
                                                            <th>Warranty</th>
                                                            <th>Total Qty</th>
                                                            <th>Unit Price</th>
                                                            <th>Total</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredProducts.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={7} style={{ padding: '40px 30px', textAlign: 'center', color: '#64748b' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                                        <FaWarehouse size={32} style={{ opacity: 0.3 }} />
                                                                        <span>{debouncedSearchValue ? 'No products found' : 'No items selected from stock list.'}</span>
                                                                        {!debouncedSearchValue && (
                                                                            <button
                                                                                onClick={() => navigate('/stock-list')}
                                                                                style={{
                                                                                    marginTop: '10px',
                                                                                    padding: '8px 16px',
                                                                                    backgroundColor: '#007bff',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '6px',
                                                                                    fontWeight: 600,
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                Go to Stock List
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            currentData.map((prod: any, index: number) => {
                                                                const actualIndex = startIndex + index;
                                                                const pId = getProdId(prod, actualIndex);
                                                                const price = getSellingPrice(prod);
                                                                return (
                                                                    <tr
                                                                        key={pId}
                                                                        style={{
                                                                            borderBottom: '1px solid #e5e7eb',
                                                                            backgroundColor: selectedProductIds.has(pId) ? '#f0f7ff' : '#fff',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onClick={() => toggleProductSelection(pId)}
                                                                    >
                                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>{actualIndex + 1}</td>
                                                                        <td
                                                                            style={{ padding: '12px 16px', fontWeight: '600', color: '#007bff' }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDirectPayment(pId);
                                                                            }}
                                                                        >
                                                                            {prod.product_name || '-'}
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px' }}>
                                                                            <span style={{
                                                                                padding: '4px 10px',
                                                                                borderRadius: '12px',
                                                                                fontSize: '12px',
                                                                                fontWeight: 600,
                                                                                backgroundColor: prod.variant_type === 'original' ? '#dcfce7' : prod.variant_type === 'import' ? '#dbeafe' : '#fef3c7',
                                                                                color: prod.variant_type === 'original' ? '#166534' : prod.variant_type === 'import' ? '#1e40af' : '#92400e',
                                                                            }}>
                                                                                {prod.variant_type || '-'}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                                                                            {prod.warranty || prod.warranty_period || '-'}
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px', color: '#475569' }}>{Number(getAvailableQty(prod))}</td>
                                                                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>₹{price.toFixed(2)}</td>
                                                                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>₹{(Number(getAvailableQty(prod)) * price).toFixed(2)}</td>
                                                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                                                                                {Number(getAvailableQty(prod)) > 0 ? (
                                                                                    <>
                                                                                        <button
                                                                                            title="View Details"
                                                                                            style={{
                                                                                                width: '30px',
                                                                                                height: '30px',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                borderRadius: '6px',
                                                                                                border: '1px solid #64748b',
                                                                                                backgroundColor: '#64748b',
                                                                                                color: '#fff',
                                                                                                cursor: 'pointer',
                                                                                                transition: 'all 0.3s ease',
                                                                                                padding: 0
                                                                                            }}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleViewProduct(prod, pId);
                                                                                            }}
                                                                                        >
                                                                                            <FaEye size={14} />
                                                                                        </button>
                                                                                        <button
                                                                                            className="btn-blue"
                                                                                            title="Add to Bill"
                                                                                            style={{
                                                                                                width: '30px',
                                                                                                height: '30px',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                borderRadius: '6px',
                                                                                                cursor: 'pointer',
                                                                                                transition: 'all 0.3s ease',
                                                                                                padding: 0
                                                                                            }}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleDirectPayment(pId);
                                                                                            }}
                                                                                        >
                                                                                            <FaFileAlt size={14} />
                                                                                        </button>
                                                                                    </>
                                                                                ) : (
                                                                                    <button
                                                                                        style={{
                                                                                            padding: '6px 20px',
                                                                                            fontSize: '12px',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            gap: '5px',
                                                                                            borderRadius: '7px',
                                                                                            border: 'none',
                                                                                            backgroundColor: '#ef4444',
                                                                                            color: '#fff',
                                                                                            fontWeight: 600,
                                                                                            cursor: 'pointer',
                                                                                            transition: 'all 0.3s ease',
                                                                                            height: '40px',
                                                                                            width: '100px'
                                                                                        }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setStockRequestProduct(prod);
                                                                                            setStockRequestVariant(prod.variant_type || '');
                                                                                            setStockRequestQty('');
                                                                                            setStockRequestNotes('');
                                                                                            setStockRequestError('');
                                                                                            setStockRequestSuccess(false);
                                                                                            setShowStockRequest(true);
                                                                                        }}
                                                                                        onMouseEnter={(e) => {
                                                                                            e.currentTarget.style.backgroundColor = '#dc2626';
                                                                                        }}
                                                                                        onMouseLeave={(e) => {
                                                                                            e.currentTarget.style.backgroundColor = '#ef4444';
                                                                                        }}
                                                                                    >
                                                                                        📦 Request
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="pagination-container">
                                                <div className="pagination-info">
                                                    Showing {filteredProducts.length === 0 ? 0 : startIndex + 1} to {endIndex} of {filteredProducts.length} entries
                                                </div>
                                                <div className="pagination-controls">
                                                    <div className="go-to-page">
                                                        Go to Page:
                                                        <input
                                                            type="text"
                                                            value={currentPage}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (/^\d*$/.test(val)) {
                                                                    const page = val === "" ? 1 : Math.max(1, Math.min(totalPages, Number(val)));
                                                                    setCurrentPage(page);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="pagination-buttons">
                                                        <button
                                                            className="page-btn"
                                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentPage === 1}
                                                        >
                                                            <FaChevronLeft size={12} />
                                                        </button>
                                                        <button className="page-btn active">
                                                            {currentPage}
                                                        </button>
                                                        <button
                                                            className="page-btn"
                                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentPage === totalPages || totalPages === 0}
                                                        >
                                                            <FaChevronRight size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {selectedProductIds.size > 0 && (
                                <div id="selected-items-section" style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                    <h3 className="blue-text" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Selected Items for Billing ({billingItems.length})</span>
                                    </h3>
                                    <div className="added-products-container">
                                        <table className="added-products-table">
                                            <thead>
                                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>S.NO</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>PRODUCT</th>
                                                    <th style={{ textAlign: 'center', padding: '12px 16px' }}>QTY</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>UNIT PRICE</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>TOTAL</th>
                                                    <th style={{ textAlign: 'center', padding: '12px 16px' }}>ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billingItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No items with valid quantities to bill</td>
                                                    </tr>
                                                ) : (
                                                    billingItems.map((item, idx) => (
                                                        <tr key={`${item.rowId}-${item.productId}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 16px' }}>{idx + 1}</td>
                                                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.productName}</td>

                                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                                {(() => {
                                                                    const stockMax = item.selectedStockQty ?? item.availableQty ?? 0;
                                                                    const entered = Number(item.quantity) || 0;
                                                                    const remaining = stockMax - entered;

                                                                    const isOutOfStock = stockMax <= 0;
                                                                    const isOverLimit = entered > stockMax;
                                                                    const isZeroLeft = remaining <= 0;
                                                                    const isLowStock = !isZeroLeft && remaining < 5;

                                                                    if (isOutOfStock) {
                                                                        return (
                                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                                                <div style={{
                                                                                    width: '90px',
                                                                                    padding: '6px 8px',
                                                                                    textAlign: 'center',
                                                                                    borderRadius: '6px',
                                                                                    backgroundColor: '#fef2f2',
                                                                                    border: '1.5px solid #ef4444',
                                                                                    color: '#ef4444',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: 700
                                                                                }}>
                                                                                    Out of Stock
                                                                                </div>
                                                                                <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>Stock: 0</div>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                                            <input
                                                                                type="text"
                                                                                inputMode="numeric"
                                                                                value={item.quantity || ''}
                                                                                placeholder="Qty"
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                                                    const num = parseInt(val, 10);
                                                                                    // Restrict input to available stock
                                                                                    if (!isNaN(num) && num > stockMax) {
                                                                                        handleQtyChange(item.rowId, String(stockMax));
                                                                                    } else {
                                                                                        handleQtyChange(item.rowId, val);
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    width: '70px',
                                                                                    padding: '6px',
                                                                                    textAlign: 'center',
                                                                                    border: `1.5px solid ${isOverLimit ? '#ef4444' : isZeroLeft ? '#ef4444' : isLowStock ? '#f59e0b' : '#22c55e'}`,
                                                                                    borderRadius: '6px',
                                                                                    outline: 'none',
                                                                                    fontSize: '14px',
                                                                                    fontWeight: 600,
                                                                                    backgroundColor: isZeroLeft ? '#fef2f2' : isLowStock ? '#fffbeb' : '#f0fdf4',
                                                                                    transition: 'all 0.3s ease'
                                                                                }}
                                                                            />
                                                                            <div
                                                                                title={remaining <= 0 ? "No more stock available" : `Available after billing: ${remaining}`}
                                                                                style={{
                                                                                    fontSize: '11px',
                                                                                    color: isZeroLeft ? '#ef4444' : isLowStock ? '#b45309' : '#16a34a',
                                                                                    fontWeight: 600,
                                                                                    marginTop: '4px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '2px'
                                                                                }}
                                                                            >
                                                                                <>
                                                                                    <span style={{ opacity: 0.9 }}>Current:</span>
                                                                                    <span style={{ fontWeight: 800 }}>{remaining}</span>
                                                                                </>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>₹{item.sellingPrice.toFixed(2)}</td>
                                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>₹{item.total.toFixed(2)}</td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setBillingItemDetailData(item);
                                                                            setShowBillingItemDetail(true);
                                                                        }}
                                                                        className="billing-view-btn"
                                                                        title="View Details"
                                                                    >
                                                                        <FaEye size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => toggleProductSelection(item.rowId)}
                                                                        title="Remove Item"
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '40px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            backgroundColor: '#fef2f2',
                                                                            color: '#ef4444',
                                                                            border: '1px solid #fca5a5',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            fontWeight: 600,
                                                                            fontSize: '12px',
                                                                            transition: 'all 0.3s ease',
                                                                            padding: 0
                                                                        }}
                                                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                                                    >
                                                                        <FaTimes size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
                                        <button
                                            style={{
                                                padding: '12px 24px',
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                borderRadius: '8px',
                                                backgroundColor: 'white',
                                                color: '#3b82f6',
                                                border: '1px solid #3b82f6',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                            onClick={() => setShowAdditionalChargeModal(true)}
                                        >
                                            + Additional Charges
                                        </button>
                                        <button
                                            className="btn-green"
                                            onClick={() => setShowPayment(true)}
                                            disabled={
                                                billingItems.length === 0 ||
                                                billingItems.some(i => !Number(i.quantity)) ||
                                                billingItems.some(i => (i.selectedStockQty ?? i.availableQty ?? 0) <= 0) ||
                                                billingItems.some(i => Number(i.quantity) > (i.selectedStockQty ?? i.availableQty ?? 0))
                                            }
                                            title={
                                                billingItems.some(i => (i.selectedStockQty ?? i.availableQty ?? 0) <= 0)
                                                    ? '⚠ Cannot proceed: one or more items are out of stock'
                                                    : billingItems.some(i => Number(i.quantity) > (i.selectedStockQty ?? i.availableQty ?? 0))
                                                        ? '⚠ Cannot proceed: quantity exceeds available stock'
                                                        : `Total: ₹${grandTotal.toFixed(2)}`
                                            }
                                            style={{
                                                padding: '12px 24px',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.2)'
                                            }}
                                        >
                                            Proceed to Payment
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {showAdvancedSearch && (
                <AdvancedProductSearch
                    onClose={() => setShowAdvancedSearch(false)}
                    onSelectProduct={handleAdvancedProductSelect}
                />
            )}

            {showCustomerSelect && (
                <CustomerSelect
                    onClose={() => setShowCustomerSelect(false)}
                    onCustomerSelect={handleCustomerSelect}
                    onAddNew={handleAddNewCC}
                />
            )}

            {showAddBilling && (
                <AddBilling
                    onClose={() => setShowAddBilling(false)}
                    onStoreSelect={handleStoreSelect}
                />
            )}

            {showAddCC && (
                <CompanyForm
                    onCancel={() => setShowAddCC(false)}
                    onSave={handleSaveCC}
                />
            )}
            {showScanner && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', padding: 0 }}>
                        <div className="header blue-bg row-flex" style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaQrcode />
                                <span style={{ fontWeight: 600 }}>Product Scanner</span>
                            </div>
                            <span className="close-x" onClick={() => setShowScanner(false)}>&times;</span>
                        </div>
                        <div style={{ padding: '30px', textAlign: 'center' }}>
                            <div style={{
                                width: '100%',
                                height: '220px',
                                backgroundColor: '#000',
                                position: 'relative',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    border: '2px solid #007bff',
                                    width: '80%',
                                    height: '150px',
                                    borderRadius: '8px',
                                    position: 'relative'
                                }}>
                                    {/* Scanning line animation */}
                                    <div style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '2px',
                                        backgroundColor: '#007bff',
                                        boxShadow: '0 0 10px #007bff',
                                        top: '0',
                                        animation: 'scanLine 2s linear infinite'
                                    }} />
                                    <style>{`
                                        @keyframes scanLine {
                                            0% { top: 0% }
                                            50% { top: 100% }
                                            100% { top: 0% }
                                        }
                                    `}</style>
                                    <p style={{ color: '#fff', fontSize: '12px', marginTop: '60px', opacity: 0.7 }}>
                                        Position {searchBy} within frame
                                    </p>
                                </div>
                            </div>

                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px', marginTop: '10px' }}>
                                Searching for: <strong>{activeTab === 'User' ? verificationMethod : searchBy}</strong>
                            </p>
                            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                                Please point the camera or scanner at the code.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {showProductModal && selectedViewProduct && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="header blue-bg row-flex">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaInfoCircle />
                                <span style={{ fontWeight: 600 }}>Product Details</span>
                            </div>
                            <span className="close-x" onClick={() => setShowProductModal(false)}><FaTimes /></span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
                                <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{
                                        width: '180px',
                                        height: '180px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f8fafc'
                                    }}>
                                        <img
                                            src={selectedViewProduct.product_image ? `${IMAGE_BASE_API}/${selectedViewProduct.product_image}` : 'https://via.placeholder.com/180?text=No+Image'}
                                            alt={selectedViewProduct.product_name || 'Product'}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/180?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Description</label>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#475569',
                                            marginTop: '6px',
                                            lineHeight: '1.5',
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            paddingRight: '4px'
                                        }}>
                                            {selectedViewProduct.description || selectedViewProduct.product?.description || '-'}
                                        </div>
                                    </div>
                                </div>
                                <div className="detail-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Product Name</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>{selectedViewProduct.product_name || '-'}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Variant</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>{selectedViewProduct.variant_type || '-'}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Total Qty</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>{getAvailableQty(selectedViewProduct)}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Stock Type</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>{selectedViewProduct.stock_type_name || '-'}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Normal Price</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>
                                            ₹{(() => {
                                                const price = getSellingPrice(selectedViewProduct);
                                                const gst = Number(selectedViewProduct.gst || selectedViewProduct.tax_percentage || 0);
                                                return (price / (1 + gst / 100)).toFixed(2);
                                            })()}
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Tax Percentage</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>
                                            {selectedViewProduct.gst || selectedViewProduct.tax_percentage || 0}%
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Tax Price</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>
                                            ₹{(() => {
                                                const price = getSellingPrice(selectedViewProduct);
                                                const gst = Number(selectedViewProduct.gst || selectedViewProduct.tax_percentage || 0);
                                                const normalPrice = price / (1 + gst / 100);
                                                return (price - normalPrice).toFixed(2);
                                            })()}
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Selling Price</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>₹{getSellingPrice(selectedViewProduct).toFixed(2)}</div>
                                    </div>
                                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                        <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Warranty</label>
                                        <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>{selectedViewProduct.warranty || selectedViewProduct.warranty_period || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-blue" onClick={() => setShowProductModal(false)}>Close</button>
                            <button className="btn-green" onClick={() => {
                                setShowProductModal(false);
                                if (selectedViewProdId) handleDirectPayment(selectedViewProdId);
                            }}>Add to Bill</button>
                        </div>
                    </div>
                </div>
            )}
            {showAdditionalChargeModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="header blue-bg row-flex">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaWarehouse />
                                <span style={{ fontWeight: 600 }}>Additional Charges</span>
                            </div>
                            <span className="close-x" onClick={() => setShowAdditionalChargeModal(false)}><FaTimes /></span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Shipping Section */}
                                <div
                                    style={{
                                        position: 'relative',
                                        padding: '20px 15px 15px 15px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        backgroundColor: selectedAdditionalCharges.has('shipping') ? '#f0f9ff' : '#f8fafc',
                                        borderLeft: selectedAdditionalCharges.has('shipping') ? '4px solid #3b82f6' : '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => {
                                        setSelectedAdditionalCharges(prev => {
                                            const next = new Set(prev);
                                            if (next.has('shipping')) next.delete('shipping');
                                            else next.add('shipping');
                                            return next;
                                        });
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}>
                                        {selectedAdditionalCharges.has('shipping') ?
                                            <FaCheckCircle color="#3b82f6" size={18} /> :
                                            <FaRegCircle color="#cbd5e1" size={18} />
                                        }
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingLeft: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Delivery/Shipping charges (+)</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', opacity: selectedAdditionalCharges.has('shipping') ? 1 : 0.5 }}>
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount (₹)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={!selectedAdditionalCharges.has('shipping')}
                                                value={shippingCharge.amount || ''}
                                                placeholder="0.00"
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setShippingCharge(prev => ({ ...prev, amount: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 }))}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Tax (%)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={!selectedAdditionalCharges.has('shipping')}
                                                value={shippingCharge.tax || ''}
                                                placeholder="0"
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setShippingCharge(prev => ({ ...prev, tax: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 }))}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                                            />
                                        </div>
                                    </div>
                                    {selectedAdditionalCharges.has('shipping') && (
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#166534', fontWeight: 600, textAlign: 'right' }}>
                                            Total: ₹{(shippingCharge.amount + (shippingCharge.amount * (shippingCharge.tax / 100))).toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                {/* Packaging Section */}
                                <div
                                    style={{
                                        position: 'relative',
                                        padding: '20px 15px 15px 15px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        backgroundColor: selectedAdditionalCharges.has('packaging') ? '#f0f9ff' : '#f8fafc',
                                        borderLeft: selectedAdditionalCharges.has('packaging') ? '4px solid #3b82f6' : '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => {
                                        setSelectedAdditionalCharges(prev => {
                                            const next = new Set(prev);
                                            if (next.has('packaging')) next.delete('packaging');
                                            else next.add('packaging');
                                            return next;
                                        });
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}>
                                        {selectedAdditionalCharges.has('packaging') ?
                                            <FaCheckCircle color="#3b82f6" size={18} /> :
                                            <FaRegCircle color="#cbd5e1" size={18} />
                                        }
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingLeft: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Packaging Charges (+)</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', opacity: selectedAdditionalCharges.has('packaging') ? 1 : 0.5 }}>
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount (₹)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={!selectedAdditionalCharges.has('packaging')}
                                                value={packagingCharge.amount || ''}
                                                placeholder="0.00"
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setPackagingCharge(prev => ({ ...prev, amount: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 }))}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Tax (%)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={!selectedAdditionalCharges.has('packaging')}
                                                value={packagingCharge.tax || ''}
                                                placeholder="0"
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setPackagingCharge(prev => ({ ...prev, tax: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 }))}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                                            />
                                        </div>
                                    </div>
                                    {selectedAdditionalCharges.has('packaging') && (
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#166534', fontWeight: 600, textAlign: 'right' }}>
                                            Total: ₹{(packagingCharge.amount + (packagingCharge.amount * (packagingCharge.tax / 100))).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-blue" onClick={() => setShowAdditionalChargeModal(false)}>Cancel</button>
                            <button className="btn-green" onClick={() => setShowAdditionalChargeModal(false)} style={{ padding: '8px 20px' }}>Apply Charges</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Stock Request Modal ─── */}
            {showStockRequest && stockRequestProduct && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        animation: 'fadeIn 0.2s ease'
                    }}
                    onClick={() => setShowStockRequest(false)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            width: '420px',
                            maxWidth: '92vw',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                            animation: 'slideUp 0.25s ease'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            padding: '20px 24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>📦 Stock Request</h3>
                                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>Request stock for out-of-stock items</p>
                            </div>
                            <button
                                onClick={() => setShowStockRequest(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: '#fff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px' }}>
                            {stockRequestSuccess ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                                    <h4 style={{ margin: '0 0 6px', color: '#059669', fontSize: '1.1rem' }}>Request Submitted!</h4>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Your stock request has been sent successfully.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Product Name */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>Product Name</label>
                                        <div style={{
                                            padding: '10px 14px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            color: '#1e293b',
                                            fontSize: '0.9rem'
                                        }}>
                                            {stockRequestProduct.product_name || stockRequestProduct.product?.product_name || '-'}
                                        </div>
                                    </div>

                                    {/* Variant (Fixed) */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>Variant</label>
                                        <div>
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: (stockRequestProduct.variant_type || 'original') === 'original' ? '#dcfce7' : (stockRequestProduct.variant_type || '') === 'import' ? '#dbeafe' : '#fef3c7',
                                                color: (stockRequestProduct.variant_type || 'original') === 'original' ? '#166534' : (stockRequestProduct.variant_type || '') === 'import' ? '#1e40af' : '#92400e',
                                            }}>
                                                {stockRequestProduct.variant_type || 'original'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quantity & Price */}
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>Quantity <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Qty"
                                                value={stockRequestQty}
                                                onChange={(e) => { 
                                                    const val = e.target.value;
                                                    if (val === '' || Number(val) >= 0) {
                                                        setStockRequestQty(val); 
                                                        setStockRequestError(''); 
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    border: `1px solid ${stockRequestError ? '#ef4444' : '#d1d5db'}`,
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    color: '#1e293b',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                onFocus={(e) => { if (!stockRequestError) e.target.style.borderColor = '#6366f1'; }}
                                                onBlur={(e) => { if (!stockRequestError) e.target.style.borderColor = '#d1d5db'; }}
                                            />
                                            {stockRequestError && (
                                                <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '6px 0 0', fontWeight: 500 }}>{stockRequestError}</p>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>Expected Price</label>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={stockRequestPrice}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || Number(val) >= 0) {
                                                        setStockRequestPrice(val);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    color: '#1e293b',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                                            />
                                        </div>
                                    </div>

                                    {/* Date and Time */}
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>Date</label>
                                            <input
                                                type="date"
                                                value={stockRequestDate}
                                                onChange={(e) => setStockRequestDate(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    color: '#1e293b',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>Time</label>
                                            <input
                                                type="time"
                                                value={stockRequestTime}
                                                onChange={(e) => setStockRequestTime(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    color: '#1e293b',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div style={{ marginBottom: '4px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
                                        <textarea
                                            placeholder="Add any additional notes..."
                                            value={stockRequestNotes}
                                            onChange={(e) => setStockRequestNotes(e.target.value)}
                                            rows={2}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                color: '#1e293b',
                                                resize: 'vertical',
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                            onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            background: '#f8fafc'
                        }}>
                            {stockRequestSuccess ? (
                                <button
                                    onClick={() => setShowStockRequest(false)}
                                    style={{
                                        padding: '10px 24px',
                                        background: '#6366f1',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Done
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowStockRequest(false)}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const qty = parseInt(stockRequestQty, 10);
                                            const price = parseFloat(stockRequestPrice) || 0;
                                            
                                            if (!stockRequestQty || isNaN(qty) || qty <= 0) {
                                                setStockRequestError('Quantity is required and must be greater than 0');
                                                return;
                                            }
                                            if (price < 0) {
                                                setStockRequestError('Expected price cannot be negative');
                                                return;
                                            }
                                            // Build API-ready payload
                                            const payload = {
                                                product_id: stockRequestProduct.product_id || stockRequestProduct.id,
                                                product_name: stockRequestProduct.product_name || stockRequestProduct.product?.product_name,
                                                variant: stockRequestVariant || stockRequestProduct.variant_type || 'original',
                                                quantity: qty,
                                                expected_price: parseFloat(stockRequestPrice) || 0,
                                                notes: stockRequestNotes,
                                                requested_at: `${stockRequestDate}T${stockRequestTime}:00`
                                            };
                                            console.log('📦 Stock Request Payload:', payload);
                                            setStockRequestSuccess(true);
                                        }}
                                        style={{
                                            padding: '10px 24px',
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                                        }}
                                    >
                                        Submit Request
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Item Detail Modal */}
            {showBillingItemDetail && billingItemDetailData && (() => {
                const rowId = billingItemDetailData.rowId;
                const liveItem = billingItems.find((i: any) => i.rowId === rowId) || billingItemDetailData;
                const currentPwtMode = billingPriceWithTaxMode[rowId] || 'Amount';
                const currentPwtValue = billingPriceWithTax[rowId];
                const currentDiscMode = billingDiscountMode[rowId] || 'Amount';
                const currentDiscValue = billingDiscounts[rowId];
                const currentStockDist = billingStockDist[rowId] || liveItem.stockTypeName || 'Display';
                const currentManualTax = taxManualMode[rowId] || false;
                const currentManualDisc = discountManualMode[rowId] || false;

                return (
                <div className="billing-detail-overlay" onClick={() => setShowBillingItemDetail(false)}>
                    <div className="billing-detail-modal modern-layout" onClick={(e) => e.stopPropagation()}>
                        <div className="billing-detail-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaInfoCircle color="#007bff" />
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>ITEM DETAILS</span>
                            </div>
                            <button
                                className="billing-detail-close"
                                onClick={() => setShowBillingItemDetail(false)}
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        <div className="billing-detail-body">
                            <div className="billing-detail-grid">
                                {/* LEFT SIDE: IMAGE & NAME/VARIANT */}
                                <div className="billing-detail-left">
                                    <div className="billing-detail-img-wrapper">
                                        <img 
                                            src={liveItem.productImage ? `${IMAGE_BASE_API}/${liveItem.productImage}` : 'https://via.placeholder.com/150?text=No+Image'} 
                                            alt={liveItem.productName} 
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                        />
                                    </div>
                                    <div className="billing-detail-name-variant">
                                        <h3>{liveItem.productName}</h3>
                                        <span className="billing-detail-variant-badge">
                                            {liveItem.variantType || 'Regular'}
                                        </span>
                                    </div>
                                </div>

                                {/* RIGHT SIDE: EDITABLE FIELDS */}
                                <div className="billing-detail-right">
                                    {/* Stock Distribution */}
                                    <div className="billing-detail-field-group">
                                        <label>STOCK DISTRIBUTION</label>
                                        {(() => {
                                            const apiOptions = liveItem.stockDistOptions || [];
                                            const stTypes = liveItem.stockTypes || [];
                                            const getStQty = (typeId: number) => {
                                                const st = stTypes.find((s: any) => s.stock_type_id === typeId);
                                                return st ? Number(st.qty) || 0 : 0;
                                            };
                                            const options = apiOptions.length > 0
                                                ? apiOptions.map((opt: any) => ({
                                                    name: opt.name,
                                                    qty: Number(opt.available_qty) || 0,
                                                    id: opt.stock_type_id
                                                }))
                                                : [
                                                    { name: 'Display', qty: getStQty(1), id: 1 },
                                                    { name: 'Shop in Sales', qty: getStQty(2), id: 2 },
                                                    { name: 'Outside Stocks', qty: getStQty(3), id: 3 }
                                                ];
                                            const selectedOpt = options.find((o: any) => o.name === currentStockDist);
                                            const selectedQty = selectedOpt ? selectedOpt.qty : 0;
                                            const selectedColor = selectedQty > 0 ? '#10b981' : '#ef4444';

                                            return (
                                                <select
                                                    value={currentStockDist}
                                                    onChange={(e) => handleStockDistChange(rowId, e.target.value)}
                                                    className="billing-detail-select"
                                                    style={{
                                                        color: selectedColor,
                                                        borderColor: '#e2e8f0',
                                                        backgroundColor: selectedQty > 0 ? '#f0fdf4' : '#fff7f7'
                                                    }}
                                                >
                                                    {options.map((opt: any) => (
                                                        <option
                                                            key={opt.id}
                                                            value={opt.name}
                                                            disabled={opt.qty === 0}
                                                        >
                                                            {opt.qty > 0 ? `${opt.name} (${opt.qty})` : `${opt.name} — OOS`}
                                                        </option>
                                                    ))}
                                                </select>
                                            );
                                        })()}
                                    </div>

                                    {/* Price with Tax */}
                                    <div className="billing-detail-field-group">
                                        <div className="label-row">
                                            <label>PRICE WITH TAX</label>
                                            <button 
                                                onClick={() => {
                                                    const nextManual = !currentManualTax;
                                                    setTaxManualMode(prev => ({ ...prev, [rowId]: nextManual }));
                                                    if (!nextManual) {
                                                        setBillingPriceWithTax(old => {
                                                            const n = { ...old };
                                                            delete n[rowId];
                                                            return n;
                                                        });
                                                    }
                                                }}
                                                className={`action-icon-btn ${currentManualTax ? 'active' : ''}`}
                                            >
                                                {currentManualTax ? <FaUndo size={12} /> : <FaEdit size={12} />}
                                            </button>
                                        </div>
                                        <div className={`input-combo ${currentManualTax ? 'manual' : ''}`}>
                                            <select 
                                                disabled={!currentManualTax}
                                                value={currentPwtMode}
                                                onChange={(e) => handlePriceWithTaxModeChange(rowId, e.target.value as 'Percentage' | 'Amount')}
                                            >
                                                <option value="Amount">₹</option>
                                                <option value="Percentage">%</option>
                                            </select>
                                            <input 
                                                disabled={!currentManualTax}
                                                value={currentPwtValue !== undefined ? currentPwtValue : ''}
                                                placeholder={currentManualTax ? "Manual Tax" : "Auto Calculated"}
                                                onChange={(e) => {
                                                    const num = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                                                    setBillingPriceWithTax(prev => ({ ...prev, [rowId]: num }));
                                                }}
                                            />
                                        </div>
                                        <span className="computed-badge">Calculated Tax: ₹{liveItem.tax?.toFixed(2) || '0.00'}</span>
                                    </div>

                                    {/* Discount */}
                                    <div className="billing-detail-field-group">
                                        <div className="label-row">
                                            <label>DISCOUNT</label>
                                            <button 
                                                onClick={() => {
                                                    const nextManual = !currentManualDisc;
                                                    setDiscountManualMode(prev => ({ ...prev, [rowId]: nextManual }));
                                                    if (!nextManual) {
                                                        setBillingDiscounts(old => {
                                                            const n = { ...old };
                                                            delete n[rowId];
                                                            return n;
                                                        });
                                                    }
                                                }}
                                                className={`action-icon-btn ${currentManualDisc ? 'active' : ''}`}
                                            >
                                                {currentManualDisc ? <FaUndo size={12} /> : <FaEdit size={12} />}
                                            </button>
                                        </div>
                                        <div className={`input-combo ${currentManualDisc ? 'manual' : ''}`}>
                                            <select 
                                                disabled={!currentManualDisc}
                                                value={currentDiscMode}
                                                onChange={(e) => handleDiscountModeChange(rowId, e.target.value as 'Percentage' | 'Amount')}
                                            >
                                                <option value="Amount">₹</option>
                                                <option value="Percentage">%</option>
                                            </select>
                                            <input 
                                                disabled={!currentManualDisc}
                                                value={currentDiscValue !== undefined ? currentDiscValue : ''}
                                                placeholder={currentManualDisc ? "Manual Disc" : "No Discount"}
                                                onChange={(e) => {
                                                    const num = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                                                    setBillingDiscounts(prev => ({ ...prev, [rowId]: num }));
                                                }}
                                            />
                                        </div>
                                        <span className="computed-badge">Calculated Disc: ₹{liveItem.discount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="billing-detail-divider"></div>

                            {/* BOTTOM SUMMARY ROW */}
                            <div className="billing-detail-financials">
                                <div className="financial-item">
                                    <label>Unit Price</label>
                                    <span className="value">₹{liveItem.sellingPrice?.toFixed(2)}</span>
                                </div>
                                <div className="financial-item">
                                    <label>Quantity</label>
                                    <span className="value">{liveItem.quantity}</span>
                                </div>
                                <div className="financial-item">
                                    <label>Tax Amt</label>
                                    <span className="value text-tax">₹{liveItem.tax?.toFixed(2)}</span>
                                </div>
                                <div className="financial-item">
                                    <label>Discount</label>
                                    <span className="value text-disc">₹{liveItem.discount?.toFixed(2)}</span>
                                </div>
                                <div className="financial-item total">
                                    <label>TOTAL PRICE</label>
                                    <span className="value">₹{liveItem.total?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="billing-detail-footer">
                            <button className="done-btn" onClick={() => setShowBillingItemDetail(false)}>Done</button>
                        </div>
                    </div>
                </div>
                );
            })()}
            {showAddCustomerModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="header blue-bg row-flex">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaFileAlt />
                                <span style={{ fontWeight: 600 }}>Add New Customer</span>
                            </div>
                            <span className="close-x" onClick={() => {
                                setShowAddCustomerModal(false);
                                setOtpValue('');
                                setIsOtpVerified(false);
                            }}><FaTimes /></span>
                        </div>
                        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="input-group">
                                <label style={{ color: '#64748b', fontSize: '13px' }}>Mobile Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter Mobile No"
                                    style={{ backgroundColor: '#f8fafc' }}
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ color: '#64748b', fontSize: '13px' }}>OTP Input</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={otpValue}
                                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="Enter OTP"
                                        style={{ width: '100%', borderColor: isOtpVerified ? '#10b981' : '#ced4da' }}
                                        disabled={isOtpVerified}
                                    />
                                    {isOtpVerified && <FaCheckCircle style={{ position: 'absolute', right: '12px', top: '12px', color: '#10b981' }} />}
                                </div>
                                <p style={{ fontSize: '12px', color: '#007bff', margin: '4px 0 0 0' }}>
                                    OTP has been sent to the mobile number
                                </p>
                            </div>

                            <div className="input-group">
                                <label style={{ color: '#64748b', fontSize: '13px' }}>Customer Name Input</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newCustomerRegName}
                                    onChange={(e) => setNewCustomerRegName(e.target.value)}
                                    placeholder="Enter Customer Name"
                                    disabled={!isOtpVerified}
                                    style={{ opacity: isOtpVerified ? 1 : 0.6 }}
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ color: '#64748b', fontSize: '13px' }}>Address Input</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={modalAddress}
                                    onChange={(e) => setModalAddress(e.target.value)}
                                    placeholder="Enter Address"
                                    disabled={!isOtpVerified}
                                    style={{ opacity: isOtpVerified ? 1 : 0.6 }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '15px 25px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                className="btn-reset-filters" 
                                style={{ height: '40px' }}
                                onClick={() => {
                                    setShowAddCustomerModal(false);
                                    setOtpValue('');
                                    setIsOtpVerified(false);
                                }}
                            >
                                Cancel
                            </button>
                            {/* <button 
                                className="btn-blue" 
                                style={{ height: '40px', minWidth: '100px' }}
                                onClick={() => {
                                    if (!isOtpVerified) handleVerifyOtp();
                                    else handleFinalRegister();
                                }}
                                disabled={verifying}
                            >
                                {verifying ? 'Processing...' : (isOtpVerified ? 'Submit' : 'Verify')}
                            </button> */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPage;
