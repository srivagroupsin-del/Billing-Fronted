import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createProduct, fetchMappingList, updateProduct, fetchGroupCategoryBrandList, fetchCategoryBrandList, fetchProductsByBrandId, fetchProductsByCategoryAndBrand, fetchBrandsByCategoryId } from "../../../api/product.ts";
import { saveProductAllocation, listProductAllocations } from "../../../api/product_allocation.ts";
import { getBusinessCategoryGroups } from "../../../api/business.ts";
import { showAlert } from "../../../Components/Notification/CenterAlert";
import "./Productentry.css";
import { ChevronDown as LucideChevronDown, Search as LucideSearch } from "lucide-react";

const ProductEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        category: "", // Group Name
        categoryGroupId: "", // Group ID
        brand: "",
        product: "",
        storage: "",
        warehousePlace: "",
        warehouseAddress: "",
        warehouseLandmark: "",
        warehousePincode: "",
        warehouseBlock: "",
        warehouseBuildingName: "",
        warehouseFloor: "",
        warehouseRoomNo: "",
        warehouseRack: "",
        warehouseShelf: "",
        warehouseBox: "",
        warehouseContainer: "",
        showroomName: "",
        showroomAddress: "",
        showroomLandmark: "",
        showroomPincode: "",
        showroomFloor: "",
        showroomSection: "",
        showroomRack: "",
        showroomShelf: "",
        showroomBox: "",
        showroomContainer: "",
        minQty: "",
        maxQty: "",
        categoryList: "", // Specific Category Name or ID
    });

    const [categoryGroupsList, setCategoryGroupsList] = useState<{ id: string, name: string }[]>([]);

    const [setupCategories, setSetupCategories] = useState<{ id: number, name: string, type?: string }[]>([]);

    const [categoryOptions, setCategoryOptions] = useState<{ id: string, name: string, type: string }[]>([]);
    const [brands, setBrands] = useState<{ id: string | number, name: string }[]>([]);
    const [products, setProducts] = useState<{ id: string | number, name: string, min_qty?: any, max_qty?: any }[]>([]);

    //     const ProductList = () => {
    //   const [products, setProducts] = useState<any[]>([]);

    //   useEffect(() => {
    //     fetch("https://srivagroup.in/api/products")
    //       .then((res) => res.json())
    //       .then((data) => setProducts(data))
    //       .catch((err) => console.error(err));
    //   }, []);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [stockType, setStockType] = useState("Primary");
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [groupSearch, setGroupSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowGroupDropdown(false);
            }
        };
        const handleMouseDown = (event: MouseEvent) => handleClickOutside(event);
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, []);

    const [loadingMapping, setLoadingMapping] = useState(false);
    const [setupSummary, setSetupSummary] = useState<any>(null); // SINGLE SOURCE OF TRUTH
    const [mappingData, setMappingData] = useState<any[]>([]); // To satisfy apiHierarchy logic
    const [allocatedData, setAllocatedData] = useState<any[]>([]);

    useEffect(() => {
        const fetchAllocations = async () => {
            try {
                const res = await listProductAllocations();
                if (res && res.data) {
                    setAllocatedData(res.data);
                }
            } catch (err) {
                console.error("Error fetching allocations:", err);
            }
        };
        fetchAllocations();
    }, []);

    useEffect(() => {
        if (location.state?.editProduct) {
            const product = location.state.editProduct;
            console.log("📝 Editing Product Data:", product);

            // Synchronously resolve setupcategory ID since it's locally available
            const savedIdsStr = localStorage.getItem("selected_category_ids");
            const savedNamesStr = localStorage.getItem("selected_category_names");
            let localSetupCats: any[] = [];
            if (savedIdsStr && savedNamesStr) {
                try {
                    const ids = JSON.parse(savedIdsStr);
                    const names = JSON.parse(savedNamesStr);
                    localSetupCats = ids.map((id: number, index: number) => ({ id: String(id), name: names[index] }));
                } catch (e) {
                    console.error("Error parsing local categories", e);
                }
            }

            let resolvedCatList = product.category_id || product.category_list_id || product.category_list || product.category_list_name || "";
            if (resolvedCatList && isNaN(Number(resolvedCatList))) {
                const found = localSetupCats.find(c => c.name === resolvedCatList);
                if (found) resolvedCatList = found.id;
            }

            const rawStockType = product.stock_type || product.stockType || "Primary";
            const normalizedStockType = rawStockType.charAt(0).toUpperCase() + rawStockType.slice(1).toLowerCase();

            setFormData({
                category: product.category_group_name || product.category_name || product.category || "",
                categoryGroupId: String(product.category_group_id || ""),
                categoryList: String(resolvedCatList),
                brand: String(product.brand_id || product.brand_name || product.brand || ""),
                product: String(product.product_id || product.product_name || product.name || ""),
                storage: product.storage_type_name || product.storage || product.storage_name || "",
                minQty: String(product.min_sale_qty || product.min_qty || product.minQty || ""),
                maxQty: String(product.max_sale_qty || product.max_qty || product.maxQty || ""),
                warehousePlace: product.warehouse_place_id || product.warehouse_place || product.place_id || "",
                warehouseAddress: product.warehouse_address || "",
                warehouseLandmark: product.warehouse_landmark || "",
                warehousePincode: product.warehouse_pincode || "",
                warehouseBlock: product.warehouse_block_id || product.warehouse_block || product.block_id || "",
                warehouseBuildingName: product.warehouse_building_name_id || product.warehouse_building_name || product.building_id || "",
                warehouseFloor: product.warehouse_floor_id || product.warehouse_floor || product.floor_id || "",
                warehouseRoomNo: product.warehouse_room_no_id || product.warehouse_room_no || product.room_id || "",
                warehouseRack: product.warehouse_rack_id || product.warehouse_rack || product.rack_id || "",
                warehouseShelf: product.warehouse_shelf_id || product.warehouse_shelf || product.shelf_id || "",
                warehouseBox: product.warehouse_box_id || product.warehouse_box || product.box_id || "",
                warehouseContainer: product.warehouse_container_id || product.warehouse_container || product.container_id || "",
                showroomName: product.showroom_name_id || product.showroom_name || product.building_id || "",
                showroomAddress: product.showroom_address || "",
                showroomLandmark: product.showroom_landmark || "",
                showroomPincode: product.showroom_pincode || "",
                showroomFloor: product.showroom_floor_id || product.showroom_floor || product.floor_id || "",
                showroomSection: product.showroom_section_id || product.showroom_section || product.room_id || "",
                showroomRack: product.showroom_rack_id || product.showroom_rack || product.rack_id || "",
                showroomShelf: product.showroom_shelf_id || product.showroom_shelf || product.shelf_id || "",
                showroomBox: product.showroom_box_id || product.showroom_box || product.box_id || "",
                showroomContainer: product.showroom_container_id || product.showroom_container || product.container_id || ""
            });

            setFormData((prev: any) => ({ ...prev, categoryList: String(resolvedCatList) }));
            setStockType(normalizedStockType);
            setEditingId(product.id);
        }
    }, [location.state]);
    // Load Setup Summary and Category Groups
    useEffect(() => {
        const initData = async () => {
            setLoadingMapping(true);
            try {
                // 1. Fetch Setup Summary (Source of Truth)
                const { getSetupSummary } = await import("../../../api/business.ts");
                const summaryRes = await getSetupSummary();
                const summary = (summaryRes?.success && summaryRes.data) ? summaryRes.data : summaryRes;
                setSetupSummary(summary);
                console.log("📊 [ProductEntry] Setup Summary:", summary);

                // 2. Fetch Master Category Groups
                const res = await getBusinessCategoryGroups();
                console.log("📊 [ProductEntry] Master Category Groups API Raw:", res);

                let masterGroups: any[] = [];
                if (res?.success && res.data) {
                    masterGroups = Array.isArray(res.data) ? res.data : (res.data.category_groups || res.data.categoryGroups || res.data.category_group || res.data.list || []);
                } else if (Array.isArray(res)) {
                    masterGroups = res;
                } else if (res?.category_groups || res?.categoryGroups || res?.category_group || res?.data) {
                    masterGroups = res.category_groups || res.categoryGroups || res.category_group || (Array.isArray(res.data) ? res.data : []);
                }

                // Root property fallback: Check for ANY array property in the root object
                if ((!Array.isArray(masterGroups) || masterGroups.length === 0) && typeof res === 'object' && res !== null) {
                    const firstArray = Object.values(res).find(v => Array.isArray(v));
                    if (firstArray) masterGroups = firstArray as any[];
                }

                // If still empty, check individual data object
                if ((!Array.isArray(masterGroups) || masterGroups.length === 0) && typeof res?.data === 'object') {
                    const firstArray = Object.values(res.data).find(v => Array.isArray(v));
                    if (firstArray) masterGroups = firstArray as any[];
                }

                if (!Array.isArray(masterGroups)) masterGroups = [];
                console.log("📊 [ProductEntry] masterGroups Extracted:", masterGroups.length, "items");

                console.log("📊 [ProductEntry] Master Groups Extracted:", masterGroups);

                // 3. Filter Groups based on Setup Summary IDs
                // Handle different possible keys in setup summary
                const setupGroupsRaw = summary?.category_groups || summary?.categoryGroups || summary?.category_group_ids || summary?.categoryGroupIds || [];
                const setupGroupIds = new Set(setupGroupsRaw.map((g: any) => String(typeof g === 'object' ? (g.category_group_id || g.id) : g)));

                console.log("📊 [ProductEntry] Setup Group IDs:", Array.from(setupGroupIds));

                let filteredGroups = masterGroups
                    .map((g: any) => ({
                        id: String(g.id || g.category_group_id || g.categoryGroupId),
                        name: g.category_group_name || g.categoryGroupName || g.name || g.group_name || "Unnamed Group"
                    }))
                    .filter(g => g.id && (setupGroupIds.size === 0 || setupGroupIds.has(g.id)));

                // If no groups match setup, but we have master groups, maybe setup is global?
                if (filteredGroups.length === 0 && masterGroups.length > 0) {
                    console.warn("⚠️ No groups matched setup summary IDs. Showing all master groups as fallback.");
                    filteredGroups = masterGroups.map((g: any) => ({
                        id: String(g.id || g.category_group_id || g.categoryGroupId),
                        name: g.category_group_name || g.categoryGroupName || g.name || g.group_name || "Unnamed Group"
                    }));
                }

                // ULTIMATE FAIL-SAFE: If still empty but we have summary data, use summary data directly
                if (filteredGroups.length === 0 && setupGroupsRaw && setupGroupsRaw.length > 0) {
                    console.warn("⚠️ Master API failed or empty. Deriving groups directly from Setup Summary.");
                    filteredGroups = setupGroupsRaw.map((sg: any) => ({
                        id: String(sg.id || sg.category_group_id),
                        name: sg.category_group_name || sg.name || "Group from Setup"
                    }));
                }

                const sortedGroups = [...filteredGroups].sort((a, b) => a.name.localeCompare(b.name));
                console.log("📊 [ProductEntry] Final Filtered Groups:", sortedGroups.length, "list items");
                setCategoryGroupsList(sortedGroups);

                // 4. Preselection Logic
                const preferredIdRaw = localStorage.getItem("selected_category_group_id");
                let preferredId = "";
                if (preferredIdRaw) {
                    try {
                        const parsed = JSON.parse(preferredIdRaw);
                        preferredId = String(Array.isArray(parsed) ? (parsed[0] || "") : parsed);
                    } catch { preferredId = String(preferredIdRaw); }
                }

                if (!formData.categoryGroupId && filteredGroups.length > 0) {
                    const found = filteredGroups.find((g: any) => String(g.id) === preferredId);
                    const defaultGroup = (filteredGroups.length === 1) ? filteredGroups[0] : (found || null);
                    if (defaultGroup) {
                        setFormData((prev: any) => ({
                            ...prev,
                            categoryGroupId: defaultGroup.id,
                            category: defaultGroup.name
                        }));
                    }
                }
            } catch (error) {
                console.error("❌ Failed to load setup data:", error);
            } finally {
                setLoadingMapping(false);
            }
        };
        initData();
    }, []);

    useEffect(() => {
        const loadMappingData = async () => {
            if (!formData.categoryGroupId) return;
            setLoadingMapping(true);
            try {
                const savedGroupId = formData.categoryGroupId;
                console.log(`📡 Fetching category brand info for Group ID: ${savedGroupId}...`);
                const [productResponse, brandResponse] = await Promise.all([
                    fetchGroupCategoryBrandList(savedGroupId),
                    fetchCategoryBrandList(savedGroupId)
                ]);

                console.log("📦 Product API Response:", productResponse);
                console.log("📦 Brand API Response:", brandResponse);

                const extractData = (response: any) => {
                    if (!response) return [];
                    if (Array.isArray(response)) return response;
                    if (response.data) {
                        if (Array.isArray(response.data)) return response.data;
                        const d = response.data;
                        return d.category_groups || d.categories || d.Categories || d.category_list || d.list || d.data || 
                               (d.primary ? Object.values(d.primary) : null) || 
                               (d.secondary ? Object.values(d.secondary) : null) || [];
                    }
                    return [];
                };

                const rawProducts = extractData(productResponse);
                const rawBrands = extractData(brandResponse);
                // setApiHierarchy([...rawProducts, ...rawBrands]); // This was not in the original code, but seems like it should be. Adding it.
                // The original code had `setApiHierarchy` in the `loadBrands` useEffect, but it's not defined.
                // Assuming `apiHierarchy` is meant to be `mappingData` or a similar global state for raw data.
                // For now, I'll just use the raw data directly in the processing.

                console.log("🛠️ Processing items into mapping data...");
                const flattened: any[] = [];
                const processItems = (items: any[], parentData: any = {}, isPrimary: boolean = true) => {
                    if (!Array.isArray(items)) return;

                    items.forEach((item: any) => {
                        const currentData = { ...parentData };
                        // Ensure isPrimary is set correctly for this level
                        currentData.isPrimary = item.type === 'Secondary' ? false : (item.type === 'Primary' ? true : isPrimary);

                        // 1. Identify Identity (Group or Category)
                        const groupTitle = item.category_group_name || item.group_name;
                        const itemName = item.name || item.category_name || item.category_list_name;

                        if (groupTitle) {
                            currentData.category_group_name = groupTitle;
                            currentData.category_group_id = item.category_group_id || item.id;
                        }

                        if (itemName && !item.brand_name && !item.brand && !item.brandName) {
                            currentData.category_list_name = itemName;
                            currentData.category_list_id = item.id || item.category_id;

                            // Push the category itself even if it has brands later, to ensure it exists in mapping
                            flattened.push({ ...currentData });
                        }

                        // 2. Handle Brand mapping (direct properties)
                        const bName = item.brand_name || item.brandName || item.brand;
                        const isBrand = !!bName && !item.secondary_categories && !item.primary_categories && !item.categories;

                        if (isBrand) {
                            const bId = item.brand_id || item.id;
                            flattened.push({
                                ...currentData,
                                brand_name: bName,
                                brand_id: bId
                            });
                        }

                        // 3. Handle explicit brands array/object nested inside a category
                        const brandKeys = ['brands', 'Brands', 'brand', 'Brand'];
                        brandKeys.forEach(key => {
                            if (item[key]) {
                                const brandsVal = item[key];
                                // Handle array of brand objects or strings
                                if (Array.isArray(brandsVal)) {
                                    brandsVal.forEach((b: any) => {
                                        const bName = typeof b === 'string' ? b : (b.name || b.brand_name || b.brand_label || b.brand);
                                        const bId = typeof b === 'string' ? null : (b.id || b.brand_id);
                                        if (bName) {
                                            flattened.push({
                                                ...currentData,
                                                brand_name: bName,
                                                brand_id: bId
                                            });
                                        }
                                    });
                                }
                                // Handle single brand object or map of brands
                                else if (typeof brandsVal === 'object') {
                                    Object.values(brandsVal).forEach((b: any) => {
                                        const bName = b.name || b.brand_name || b.brand_label || b.brand || (typeof b === 'string' ? b : null);
                                        const bId = b.id || b.brand_id;
                                        if (bName) {
                                            flattened.push({
                                                ...currentData,
                                                brand_name: bName,
                                                brand_id: bId
                                            });
                                        }
                                    });
                                }
                            }
                        });

                        // 4. Recurse into children
                        const primaryChildren = item.primary_categories || item.categories || (item.Categories?.primary ? Object.values(item.Categories.primary) : null);
                        const secondaryChildren = item.secondary_categories || item.sub_categories || item.items || (item.Categories?.secondary ? Object.values(item.Categories.secondary) : null);
                        const productChildren = item.products;

                        // Also handle generic 'Categories' if it's an array or object
                        const genericCategories = !primaryChildren && !secondaryChildren && item.Categories ? 
                            (Array.isArray(item.Categories) ? item.Categories : Object.values(item.Categories)) : null;

                        if (primaryChildren && Array.isArray(primaryChildren)) {
                            processItems(primaryChildren, currentData, true);
                        }
                        if (secondaryChildren && Array.isArray(secondaryChildren)) {
                            processItems(secondaryChildren, currentData, false);
                        }
                        if (genericCategories && Array.isArray(genericCategories)) {
                            processItems(genericCategories, currentData, currentData.isPrimary);
                        }
                        if (productChildren && Array.isArray(productChildren)) {
                            processItems(productChildren, currentData, currentData.isPrimary);
                        }
                    });
                };

                // Pass the known group context if available
                const initialContext = {
                    category_group_id: formData.categoryGroupId,
                    category_group_name: formData.category
                };

                processItems([...rawProducts, ...rawBrands], initialContext);

                // FINAL FAIL-SAFE: If flattened is empty but we have raw data, use raw data as categories
                let finalMapping: any[] = flattened.length > 0 ? flattened : [];
                if (finalMapping.length === 0) {
                    finalMapping = [...rawProducts, ...rawBrands].map((item: any) => ({
                        ...initialContext,
                        category_list_id: item.id || item.category_id || item.category_list_id,
                        category_list_name: item.name || item.category_name || item.category_list_name,
                        brand_name: item.brand_name || item.brand,
                        brand_id: item.brand_id || item.id,
                        type: item.type || (stockType || "Primary")
                    }));
                }

                if (finalMapping.length > 0) {
                    console.log(`✅ Extracted ${finalMapping.length} mapping entries for Group ID: ${savedGroupId}`);
                    setMappingData(finalMapping);
                    setLoadingMapping(false);
                } else {
                    console.warn(`⚠️ No mapping entries found for Group ID: ${savedGroupId}`);
                }
            } catch (error) {
                console.error("❌ Error in loadMappingData:", error);
            } finally {
                setLoadingMapping(false);
            }

            // Fallback to older mapping API or mock data if no data yet
            if (mappingData.length === 0) {
                const data = await fetchMappingList();
                if (data) {
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setMappingData(list);
                    console.log("🔄 Fallback/Mock mapping data loaded");
                }
            }
        };
        loadMappingData();
    }, [formData.categoryGroupId]);

    // DERIVE CATEGORY OPTIONS FROM MAPPING DATA
    useEffect(() => {
        if (!mappingData || mappingData.length === 0) {
            setCategoryOptions([]);
            return;
        }

        console.log("🔍 Deriving category options from mapping data...");

        // 1. Resolve Name/ID to ensure type matching and correct dropdown display
        if (formData.categoryList) {
            const allCats = mappingData.map((m: any) => ({
                id: String(m.category_list_id || m.id || m.category_id),
                name: m.category_list_name || m.name || m.category_name || "",
                type: m.stock_type || (m.isPrimary ? "Primary" : "Secondary") || "Primary"
            })).filter((c: any) => c.id && c.name);

            const isName = isNaN(Number(formData.categoryList));
            const match = allCats.find((c: any) =>
                isName ? (String(c.name).toLowerCase() === String(formData.categoryList).toLowerCase())
                    : (String(c.id) === String(formData.categoryList))
            );

            if (match) {
                if (isName) {
                    console.log("🎯 Resolved Category Name to ID:", match.id);
                    setFormData((prev: any) => ({ ...prev, categoryList: match.id }));
                }
                if (match.type && String(match.type).toLowerCase() !== stockType.toLowerCase()) {
                    console.log(`🔄 Switching Stock Type from ${stockType} to ${match.type} to match current selection`);
                    setStockType(match.type);
                }
            }
        }

        // 2. Filter Categories based on Setup Summary
        const setupCatsRaw = setupSummary?.categories || setupSummary?.category_list || setupSummary?.category_ids || setupSummary?.categoryIds || [];
        const setupCatIds = new Set(setupCatsRaw.map((c: any) => String(typeof c === 'object' ? (c.category_id || c.category_list_id || c.id) : c)));

        const filteredCats = mappingData
            .map((m: any) => ({
                id: String(m.category_list_id || m.id || m.category_id),
                name: m.category_list_name || m.name || m.category_name || "Unnamed Category",
                type: m.stock_type || (m.isPrimary ? "Primary" : "Secondary") || "Primary"
            }))
            .filter((c: any) => {
                const isIdMatch = c.id && setupCatIds.has(c.id);
                const isNameMatch = c.name && setupCatIds.has(c.name);
                // If editing and this is the current selected category, keep it
                const isEditingMatch = editingId && (String(c.id) === String(formData.categoryList) || c.name === formData.categoryList);
                return (c.id && c.name) && (setupCatIds.size === 0 || isIdMatch || isNameMatch || isEditingMatch);
            });

        // Remove duplicates based on id and type
        const uniqueFilteredCats = Array.from(new Map(filteredCats.map((item: any) => [`${item.id}-${item.type}`, item])).values()) as any[];
        
        // Sort alphabetically
        const sortedCats = [...uniqueFilteredCats].sort((a, b) => a.name.localeCompare(b.name));

        console.log(`📂 Populated ${sortedCats.length} category options`);
        setCategoryOptions(sortedCats);

        // 3. Auto-select category if only one exists
        if (!formData.categoryList && uniqueFilteredCats.length > 0) {
            const currentTypeCats = uniqueFilteredCats.filter((c: any) => String(c.type).toLowerCase() === stockType.toLowerCase());
            if (currentTypeCats.length === 1) {
                setFormData((prev: any) => ({ ...prev, categoryList: currentTypeCats[0].id }));
            }
        }
    }, [mappingData, setupSummary, stockType, editingId, formData.categoryList]);

    // Load selected category IDs and Names from localStorage (set during setup)
    useEffect(() => {
        const savedIdsStr = localStorage.getItem("selected_category_ids");
        const savedNamesStr = localStorage.getItem("selected_category_names");
        const savedTypesStr = localStorage.getItem("selected_category_types");

        if (savedIdsStr && savedNamesStr) {
            const ids = JSON.parse(savedIdsStr);
            const names = JSON.parse(savedNamesStr);
            const types = savedTypesStr ? JSON.parse(savedTypesStr) : [];
            const combined = ids.map((id: number, index: number) => ({
                id,
                name: names[index] || `Category ${id}`,
                type: types[index] ? (types[index].charAt(0).toUpperCase() + types[index].slice(1)) : "Primary"
            }));
            setSetupCategories(combined);
            console.log("📋 Loaded setup categories:", combined);
        }
    }, []);

    // Load Brands based on selected category (strictly filtered by Setup Summary)
    useEffect(() => {
        const loadBrands = async () => {
            if (!formData.categoryList || !setupSummary) {
                setBrands([]);
                return;
            }

            const currentCatId = formData.categoryList;
            const setupBrandsRaw = setupSummary?.brands || setupSummary?.brand_list || setupSummary?.brand_ids || setupSummary?.brandIds || [];
            const setupBrandIds = new Set(setupBrandsRaw.map((b: any) => String(typeof b === 'object' ? (b.brand_id || b.id) : b)));

            console.log(`🔍 Filtering brands for Category ${currentCatId} against Setup Summary...`);

            // Use the flattened mappingData as the source
            const uniqueBrands = new Map();
            mappingData.forEach((m: any) => {
                const matchId = String(m.category_list_id || m.id || m.category_id);
                const brandId = String(m.brand_id || m.brand || "");
                const bName = m.brand_name || m.brand || "";

                if (matchId === String(currentCatId) && brandId) {
                    const isIdMatch = setupBrandIds.has(brandId);
                    const isNameMatch = bName && setupBrandIds.has(bName);
                    // If editing and this is the current selected brand, keep it
                    const isEditingMatch = editingId && (brandId === String(formData.brand) || bName === formData.brand);

                    if (setupBrandIds.size === 0 || isIdMatch || isNameMatch || isEditingMatch) {
                        uniqueBrands.set(brandId, {
                            id: brandId,
                            name: bName || "Unnamed Brand"
                        });
                    }
                }
            });

            const filteredBrands = Array.from(uniqueBrands.values());

            // Fallback: If no brands in mapping, try direct API but still filter by setup
            if (filteredBrands.length === 0 && !isNaN(Number(currentCatId))) {
                try {
                    const response = await fetchBrandsByCategoryId(currentCatId);
                    const list = (response?.data?.brands || response?.data || (Array.isArray(response) ? response : []));
                    if (Array.isArray(list)) {
                        list.forEach((b: any) => {
                            const bId = String(b.id || b.brand_id);
                            if (setupBrandIds.has(bId)) {
                                uniqueBrands.set(bId, { id: bId, name: b.name || b.brand_name });
                            }
                        });
                    }
                } catch (e) {
                    console.error("Brand fallback fetch failed", e);
                }
            }

            const finalBrands = Array.from(uniqueBrands.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
            setBrands(finalBrands);

            // Auto-resolve name to ID if needed
            if (formData.brand && isNaN(Number(formData.brand)) && finalBrands.length > 0) {
                const match = finalBrands.find(b => b.name === formData.brand);
                if (match) {
                    setFormData(prev => ({ ...prev, brand: String(match.id) }));
                }
            }

            // Auto-select if only 1 brand is available
            if (!formData.brand && finalBrands.length === 1) {
                setFormData((prev: any) => ({ ...prev, brand: String(finalBrands[0].id) }));
            }
        };
        loadBrands();
    }, [formData.categoryList, setupSummary, mappingData, editingId]); // Added editingId to deps


    // Update products when brand changes - using allocation data
    useEffect(() => {
        const loadProducts = async () => {
            if (!formData.categoryGroupId || !formData.categoryList || !formData.brand) {
                setProducts([]);
                return;
            }

            const productMap = new Map<string, any>();

            // 1. Initial collection from allocated data
            if (allocatedData && allocatedData.length > 0) {
                const groupId = String(formData.categoryGroupId);
                const catId = String(formData.categoryList);
                const brandId = String(formData.brand);
                const typeKey = stockType.toLowerCase() === 'primary' ? 'primary' : 'secondary';

                const group = allocatedData.find((g: any) => String(g.CategoryGroupId || g.id) === groupId);

                if (group && group.Categories) {
                    const categories = group.Categories[typeKey];
                    if (categories && categories[catId]) {
                        const brandsArr = categories[catId].Brand;
                        if (brandsArr && brandsArr[brandId]) {
                            const foundProducts = brandsArr[brandId].Products;
                            if (Array.isArray(foundProducts)) {
                                foundProducts.forEach((p: any) => {
                                    const id = String(p.id);
                                    productMap.set(id, {
                                        id,
                                        name: p.name,
                                        min_qty: p.Qty?.min,
                                        max_qty: p.Qty?.max
                                    });
                                });
                            }
                        }
                    }
                }
            }

            // 2. Fetch and merge full master list from APIs
            try {
                let apiResponse = null;
                if (!isNaN(Number(formData.brand)) && !isNaN(Number(formData.categoryList))) {
                    apiResponse = await fetchProductsByCategoryAndBrand(formData.categoryList, formData.brand);
                } else if (!isNaN(Number(formData.brand))) {
                    apiResponse = await fetchProductsByBrandId(formData.brand);
                }

                if (apiResponse) {
                    let list: any[] = [];
                    if (Array.isArray(apiResponse)) list = apiResponse;
                    else if (apiResponse.data) list = apiResponse.data.products || (Array.isArray(apiResponse.data) ? apiResponse.data : []);

                    list.forEach((p: any) => {
                        const id = String(p.id || p.product_id);
                        const name = p.name || p.product_name || "";
                        if (name) {
                            // Only add if not already present or for merging extra data
                            productMap.set(id, {
                                id,
                                name,
                                min_qty: p.min_sale_qty || p.min_qty || p.minQty || productMap.get(id)?.min_qty || "",
                                max_qty: p.max_sale_qty || p.max_qty || p.maxQty || productMap.get(id)?.max_qty || ""
                            });
                        }
                    });
                }
            } catch (error) {
                console.error("Error drawing fallback products:", error);
            }

            // Final state update with unique products, sorted alphabetically
            const finalProducts = Array.from(productMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
            setProducts(finalProducts);

            // Auto-resolve product name to ID if needed
            if (formData.product && isNaN(Number(formData.product)) && finalProducts.length > 0) {
                const match = finalProducts.find(p => p.name === formData.product);
                if (match) {
                    setFormData(prev => ({
                        ...prev,
                        product: String(match.id),
                        minQty: match.min_qty ? String(match.min_qty) : prev.minQty,
                        maxQty: match.max_qty ? String(match.max_qty) : prev.maxQty
                    }));
                }
            }
        };
        loadProducts();
    }, [formData.brand, formData.categoryList, formData.categoryGroupId, stockType, allocatedData, editingId]);

    useEffect(() => {
        // Handled in handleChange cascades, but keeping for switch toggle
    }, [stockType]);

    const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;

        // Cascade reset: categoryGroupId → categoryList → brand → product
        if (name === "category") {
            const selectedGroup = categoryGroupsList.find((g: any) => g.id === value);
            setFormData((prev: any) => ({
                ...prev,
                categoryGroupId: value,
                category: selectedGroup ? selectedGroup.name : "",
                categoryList: "",
                brand: "",
                product: "",
                minQty: "",
                maxQty: ""
            }));
            setBrands([]);
            setProducts([]);
            return;
        }

        if (name === "categoryList") {
            setFormData((prev: any) => ({
                ...prev,
                categoryList: value,
                brand: "",
                product: "",
                minQty: "",
                maxQty: ""
            }));
            setBrands([]);
            setProducts([]);
            return;
        }

        if (name === "brand") {
            setFormData((prev: any) => ({
                ...prev,
                brand: value,
                product: "",
                minQty: "",
                maxQty: ""
            }));
            setProducts([]);
            return;
        }

        if (name === "product") {
            const selectedProd = products.find((p: any) => String(p.id) === String(value));
            setFormData((prev: any) => ({
                ...prev,
                product: value,
                minQty: selectedProd?.min_qty ? String(selectedProd.min_qty) : (prev as any).minQty,
                maxQty: selectedProd?.max_qty ? String(selectedProd.max_qty) : (prev as any).maxQty
            }));
            return;
        }

        // Reset child fields when a parent storage field changes
        if (name === "storage") {
            setFormData((prev: any) => ({
                ...prev,
                storage: value,
                warehousePlace: "", warehouseAddress: "", warehouseLandmark: "", warehousePincode: "",
                warehouseBlock: "", warehouseBuildingName: "", warehouseFloor: "", warehouseRoomNo: "",
                warehouseRack: "", warehouseShelf: "", warehouseBox: "", warehouseContainer: "",
                showroomName: "", showroomAddress: "", showroomLandmark: "", showroomPincode: "",
                showroomFloor: "", showroomSection: "", showroomRack: "", showroomShelf: "",
                showroomBox: "", showroomContainer: ""
            }));
        } else if (name.startsWith("warehouse") || name.startsWith("showroom")) {
            const fieldOrder = name.startsWith("warehouse")
                ? ["warehousePlace", "warehouseBlock", "warehouseBuildingName", "warehouseFloor", "warehouseRoomNo", "warehouseRack", "warehouseShelf", "warehouseBox", "warehouseContainer"]
                : ["showroomName", "showroomSection", "showroomFloor", "showroomRack", "showroomShelf", "showroomBox", "showroomContainer"];

            const index = fieldOrder.indexOf(name);
            if (index !== -1) {
                const updates: any = { [name]: value };
                // Reset all subsequent fields in the hierarchy
                for (let i = index + 1; i < fieldOrder.length; i++) {
                    updates[fieldOrder[i]] = "";
                }
                setFormData((prev: any) => ({ ...prev, ...updates }));
            } else {
                setFormData({ ...formData, [name]: value });
            }
        } else if (name === "category") {
            const selectedGroup = categoryGroupsList.find(g => String(g.id) === String(value));
            setFormData(prev => ({ 
                ...prev, 
                category: selectedGroup ? selectedGroup.name : "",
                categoryGroupId: value,
                categoryList: "", // Reset dependent fields
                brand: "",
                product: ""
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            // Find the numeric category ID and name for the backend
            const selectedCat = setupCategories.find((c: any) => String(c.id) === String(formData.categoryList) || c.name === formData.categoryList);
            const categoryIdForBackend = selectedCat ? selectedCat.id : formData.category;
            const categoryNameForBackend = selectedCat ? selectedCat.name : (formData.categoryList || formData.category);

            // Resolve brand name from the brands list
            const selectedBrand = (brands as any[]).find((b: any) =>
                String(b.id) === String(formData.brand) || String(b.name) === String(formData.brand)
            );
            const brandNameForBackend = selectedBrand ? (selectedBrand.name || selectedBrand.brand_name || selectedBrand.brand) : formData.brand;

            // Resolve product name from the products list
            const selectedProduct = (products as any[]).find((p: any) =>
                String(p.id) === String(formData.product) || String(p.name) === String(formData.product)
            );
            const productNameForBackend = selectedProduct ? (selectedProduct.name || selectedProduct.product_name) : formData.product;

            const payload = {
                ...formData,
                product_name: productNameForBackend,
                category_id: categoryIdForBackend,
                brand_id: formData.brand,
                brand_name: brandNameForBackend,
                min_qty: formData.minQty,
                max_qty: formData.maxQty,
                stock_type: stockType,
                // Include category name for reference if needed
                category_name: categoryNameForBackend
            };

            const businessId = localStorage.getItem("business_id");
            const setupId = businessId ? Number(businessId) : 1;

            const allocationPayload = {
                setup_id: setupId,
                category_group_id: Number(formData.categoryGroupId),
                category_id: Number(formData.categoryList),
                brand_id: Number(formData.brand),
                products: [
                    {
                        product_id: Number(formData.product),
                        product_name: productNameForBackend,
                        min_sale_qty: Number(formData.minQty),
                        max_sale_qty: Number(formData.maxQty)
                    }
                ]
            };

            console.log("🚀 Saving Product Allocation:", allocationPayload);

            if (editingId) {
                await updateProduct(editingId, payload);
                showAlert("Successfully saved", 'success');
            } else {
                const response = await saveProductAllocation(allocationPayload);
                if (response.success || response.status) {
                    showAlert("Successfully saved", 'success');
                } else {
                    await createProduct(payload);
                    showAlert("Successfully saved", 'success');
                }
            }
            navigate("/products");
        } catch (error) {
            console.error("Error saving product:", error);
            showAlert("Failed to save product.", 'error');
        }
    };

    return (
        <div className="product-container">
            <div className="product-card">
                <div className="product-header">
                    <h2 className="product-title">{editingId ? "Edit Product" : "Product Entry"}</h2>
                    <button
                        type="button"
                        className="advance-search-btn"
                        onClick={() => navigate("/product/advanced-search")}
                    >
                        Advance Search
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {(!setupSummary || (setupSummary.categoryGroups?.length === 0 && setupSummary.category_groups?.length === 0)) && !loadingMapping && (
                        <div className="setup-warning-banner">
                            ⚠️ Please complete <strong>Business Setup</strong> to enable product entry.
                        </div>
                    )}

                    <div className="form-grid">
                        {/* Category Group */}
                        <div className="form-group custom-dropdown-container" ref={dropdownRef} style={{ position: 'relative', zIndex: showGroupDropdown ? 1000 : 1 }}>
                            <label>Category Group Name</label>
                            <div 
                                className={`custom-select-trigger ${showGroupDropdown ? 'active' : ''}`}
                                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                                style={{ backgroundColor: '#ffffff', opacity: 1 }}
                            >
                                <span className={!formData.category ? 'placeholder' : ''}>
                                    {formData.category || "Select Group"}
                                </span>
                                <LucideChevronDown size={16} className={`chevron ${showGroupDropdown ? 'open' : ''}`} />
                            </div>

                            {showGroupDropdown && (
                                <div className="custom-dropdown-menu scrollbar-custom" style={{ backgroundColor: '#ffffff', opacity: 1, zIndex: 100000 }}>
                                    <div className="dropdown-search-wrapper" style={{ backgroundColor: '#ffffff', opacity: 1 }}>
                                        <LucideSearch size={14} />
                                        <input 
                                            placeholder="Search group..."
                                            value={groupSearch}
                                            onChange={(e) => setGroupSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            style={{ backgroundColor: '#f9fafb', opacity: 1 }}
                                        />
                                    </div>
                                    <div className="dropdown-list" style={{ backgroundColor: '#ffffff', opacity: 1 }}>
                                        <div 
                                            className="dropdown-item option-placeholder"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, categoryGroupId: "", category: "" }));
                                                setShowGroupDropdown(false);
                                                setGroupSearch("");
                                            }}
                                        >
                                            Select Group
                                        </div>
                                        {categoryGroupsList
                                            .filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                                            .map(group => (
                                            <div 
                                                key={group.id} 
                                                className={`dropdown-item ${formData.categoryGroupId === group.id ? 'selected' : ''}`}
                                                onClick={() => {
                                                    const e = { target: { name: 'category', value: group.id } } as any;
                                                    handleChange(e);
                                                    setShowGroupDropdown(false);
                                                    setGroupSearch("");
                                                }}
                                            >
                                                {group.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Category List */}
                        <div className="form-group">
                            <div className="form-group-header">
                                <label>Category List</label>
                                <div className="category-type-switch">
                                    <button
                                        type="button"
                                        className={`type-switch-btn ${stockType === 'Primary' ? 'active' : ''}`}
                                        onClick={() => {
                                            setStockType('Primary');
                                            setFormData((prev: any) => ({ ...prev, categoryList: "", brand: "", product: "", minQty: "", maxQty: "" }));
                                        }}
                                        title="Show Primary Categories"
                                    >
                                        Primary
                                    </button>
                                    <button
                                        type="button"
                                        className={`type-switch-btn ${stockType === 'Secondary' ? 'active' : ''}`}
                                        onClick={() => {
                                            setStockType('Secondary');
                                            setFormData((prev: any) => ({ ...prev, categoryList: "", brand: "", product: "", minQty: "", maxQty: "" }));
                                        }}
                                        title="Show Secondary Categories"
                                    >
                                        Secondary
                                    </button>
                                </div>
                            </div>
                            <select
                                name="categoryList"
                                value={formData.categoryList}
                                onChange={handleChange}
                                disabled={!formData.categoryGroupId || loadingMapping}
                                required
                            >
                                <option value="">{loadingMapping ? "Loading..." : (!formData.categoryGroupId ? "Select Category Group first" : "Select Category")}</option>
                                {categoryOptions
                                    .filter(cat => String(cat.type).toLowerCase() === String(stockType).toLowerCase())
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))
                                }
                            </select>
                        </div>

                        {/* Brand */}
                        <div className="form-group">
                            <label>Brand</label>
                            <select
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                disabled={!formData.categoryList}
                                required
                            >
                                <option value="">{!formData.categoryList ? "Select Category first" : "Select Brand"}</option>
                                {(brands as any[]).map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Product */}
                        <div className="form-group">
                            <label>Product</label>
                            <select
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                required
                                disabled={!formData.brand}
                            >
                                <option value="">
                                    {!formData.brand
                                        ? "Please select brand first"
                                        : "Select Product"}
                                </option>
                                {products.map((prod: any, index: number) => (
                                    <option key={index} value={prod.id || prod.name || prod}>
                                        {prod.name || prod}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Min Qty */}
                        <div className="form-group">
                            <label>Min Qty</label>
                            <input
                                type="text"
                                name="minQty"
                                placeholder="Enter Minimum Quantity"
                                value={formData.minQty}
                                onKeyDown={(e) => {
                                    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
                                    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                        handleChange(e);
                                    }
                                }}
                            />
                        </div>

                        {/* Max Qty */}
                        <div className="form-group">
                            <label>Max Qty</label>
                            <input
                                type="text"
                                name="maxQty"
                                placeholder="Enter Maximum Quantity"
                                value={formData.maxQty}
                                onKeyDown={(e) => {
                                    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
                                    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                        handleChange(e);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-actions" style={{ justifyContent: 'center' }}>
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={!formData.categoryList || !formData.brand || !formData.product || !formData.minQty || !formData.maxQty}
                        >
                            {editingId ? "Update" : "Save"}
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ProductEntry;
