import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getBusinesses, saveBusinessSetup, getShopTypes, getBusinessCategoryGroups, getSetupSummary, getModuleItems, createBusinessModule, getBusinessModules, updateBusinessModule, deleteBusinessModule, createModuleItem, updateModuleItem, deleteModuleItem, type BusinessSetupPayload } from "../../api/business";
import { fetchGroupCategoryBrandList, fetchCategoryBrandList } from "../../api/product";
import { getStorageTypes } from "../../api/storage";
import { selectBusiness } from "../../api/auth";
import {
    Briefcase, Store, ShoppingCart, Wrench, ArrowRight, ArrowLeft, Check,
    Globe, Package, Truck, Ship, Warehouse, Layers, Search, Building, X, Plus, Trash2, Pencil
} from "lucide-react";
import "./nu_setup.css";

// Icon mapping for shop types
const SHOP_ICONS: Record<string, any> = {
    "local": Store,
    "online": Globe,
    "wholesale": Package,
    "import": Ship,
    "export": Truck,
};

const getShopIcon = (name: string) => {
    const lower = name.toLowerCase();
    for (const key of Object.keys(SHOP_ICONS)) {
        if (lower.includes(key)) return SHOP_ICONS[key];
    }
    return Store;
};

const ICON_COLORS = ["blue", "green", "purple", "orange", "rose", "teal"];

const NewUserSetup = () => {
    const navigate = useNavigate();

    // Data
    const [businessList, setBusinessList] = useState<any[]>([]);
    const [shopOperations, setShopOperations] = useState<any[]>([]);
    const [categoryGroups, setCategoryGroups] = useState<any[]>([]);
    const [categoryList, setCategoryList] = useState<any[]>([]);
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryTypeFilter, setCategoryTypeFilter] = useState<"primary" | "secondary">("primary");

    // Step flow (6 steps: Business → Shop → Category → Category List → Storage → Mode)
    const [currentStep, setCurrentStep] = useState(1);

    // Selections
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
    const [selectedBusinessName, setSelectedBusinessName] = useState<string>("");
    const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
    const [selectedShopNames, setSelectedShopNames] = useState<string[]>([]);
    const [selectedCategoryGroupIds, setSelectedCategoryGroupIds] = useState<string[]>([]);
    const [selectedCategoryGroupNames, setSelectedCategoryGroupNames] = useState<string[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

    const [selectedStorageIds, setSelectedStorageIds] = useState<number[]>([]);
    const [storageOptions, setStorageOptions] = useState<any[]>([]);

    const [brandList, setBrandList] = useState<any[]>([]);
    const [brandSearch, setBrandSearch] = useState("");
    const [brandTypeFilter, setBrandTypeFilter] = useState<"primary" | "secondary">("primary");
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
    const [selectedBrandNames, setSelectedBrandNames] = useState<string[]>([]);

    const [selectedBusinessModes, setSelectedBusinessModes] = useState<string[]>([]);
    const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);

    // Loading & Toast
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const selectAllCategoryGroups = () => {
        const allIds = categoryGroups.map(cat => String(cat.id || cat.category_group_id));
        const allNames = categoryGroups.map(cat => cat.name || cat.category_group_name || "Unnamed");
        setSelectedCategoryGroupIds(allIds);
        setSelectedCategoryGroupNames(allNames);
    };

    const removeAllCategoryGroups = () => {
        setSelectedCategoryGroupIds([]);
        setSelectedCategoryGroupNames([]);
    };

    const selectAllCategories = () => {
        const filtered = categoryList.filter(cat => 
            cat.type === categoryTypeFilter && 
            (cat.name || "").toLowerCase().includes(categorySearch.toLowerCase())
        );
        const filteredIds = filtered.map(cat => cat.id);
        setSelectedCategoryIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    };

    const removeAllCategories = () => {
        const filteredIds = categoryList.filter(cat => 
            cat.type === categoryTypeFilter && 
            (cat.name || "").toLowerCase().includes(categorySearch.toLowerCase())
        ).map(cat => cat.id);
        setSelectedCategoryIds(prev => prev.filter(id => !filteredIds.includes(id)));
    };

    const selectAllBrands = () => {
        const filtered = brandList.filter(b => 
            b.type === brandTypeFilter && 
            (b.name || "").toLowerCase().includes(brandSearch.toLowerCase())
        );
        const filteredIds = filtered.map(b => b.id);
        const filteredNames = filtered.map(b => b.name);
        
        setSelectedBrandIds(prev => Array.from(new Set([...prev, ...filteredIds])));
        setSelectedBrandNames(prev => {
            const newNames = [...prev];
            filteredNames.forEach(name => {
                 if (!newNames.includes(name)) newNames.push(name);
            });
            return newNames;
        });
    };

    const removeAllBrands = () => {
        const filteredIds = brandList.filter(b => 
            b.type === brandTypeFilter && 
            (b.name || "").toLowerCase().includes(brandSearch.toLowerCase())
        ).map(b => b.id);
        const filteredNames = brandList.filter(b => 
            b.type === brandTypeFilter && 
            (b.name || "").toLowerCase().includes(brandSearch.toLowerCase())
        ).map(b => b.name);
        
        setSelectedBrandIds(prev => prev.filter(id => !filteredIds.includes(id)));
        setSelectedBrandNames(prev => prev.filter(name => !filteredNames.includes(name)));
    };

    const selectAllStorage = () => {
        const filteredIds = storageOptions
            .map(opt => opt.id);
        setSelectedStorageIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    };

    const removeAllStorage = () => {
        const filteredIds = storageOptions
            .map(opt => opt.id);
        setSelectedStorageIds(prev => prev.filter(id => !filteredIds.includes(id)));
    };

    const selectAllShops = () => {
        const allIds = shopOperations.map(shop => String(shop.id || shop.operation_id));
        const allNames = shopOperations.map(shop => shop.operation_name || shop.name || "Unnamed");
        setSelectedShopIds(allIds);
        setSelectedShopNames(allNames);
    };

    const removeAllShops = () => {
        setSelectedShopIds([]);
        setSelectedShopNames([]);
    };

    const selectAllModes = () => setSelectedBusinessModes(availableModules.map(m => m.id));

    const removeAllModes = () => {
        setSelectedBusinessModes([]);
    };

    const selectAllActivities = () => {
        const allIds: number[] = [];
        Object.values(moduleItemsMap).forEach(items => {
            items.forEach(item => {
                allIds.push(Number(item.id || item.item_id));
            });
        });
        setSelectedActivityIds(allIds);
    };

    const removeAllActivities = () => {
        setSelectedActivityIds([]);
    };

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Module Modal States
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [selectedModuleIdForItem, setSelectedModuleIdForItem] = useState<string>("");
    const [newModule, setNewModule] = useState({ name: "", type: "sale", description: "" });
    const [availableModules, setAvailableModules] = useState(() => {
        const storedCustom = localStorage.getItem("custom_business_modules");
        const custom = storedCustom ? JSON.parse(storedCustom) : [];
        
        // Re-map icons because functions/components can't be stored in JSON
        const mappedCustom = custom.map((m: any) => ({
            ...m,
            icon: m.type === 'service' ? Wrench : (m.type === 'sale' ? ShoppingCart : Package)
        }));

        return [
            ...mappedCustom
        ];
    });

    const handleCreateModule = async () => {
        if (!newModule.name) return;
        
        setIsLoading(true);
        try {
            if (currentStep === 8) {
                if (editingItemId) {
                    // UPDATE ITEM
                    const res = await updateModuleItem(editingItemId, { name: newModule.name });
                    if (res?.success) {
                        showToast(`Item updated successfully!`, "success");
                        // Target module for refresh
                        const modId = selectedModuleIdForItem;
                        if (modId) {
                            const resItems = await getModuleItems(modId);
                            if (resItems?.success && Array.isArray(resItems.data)) {
                                setModuleItemsMap(prev => ({ ...prev, [modId]: resItems.data }));
                            }
                        }
                    } else {
                        showToast(res?.message || "Failed to update item", "error");
                        setIsLoading(false);
                        return;
                    }
                } else {
                    // CREATE ITEM
                    const targetModId = selectedModuleIdForItem || (availableModules.find(m => selectedBusinessModes.includes(m.id))?.id);
                    if (!targetModId) { showToast("Select a module to add items to", "error"); setIsLoading(false); return; }

                    const res = await createModuleItem({ module_id: targetModId, name: newModule.name });
                    if (res?.success) {
                        showToast(`Item "${newModule.name}" created!`, "success");
                        const resItems = await getModuleItems(targetModId);
                        if (resItems?.success && Array.isArray(resItems.data)) {
                            setModuleItemsMap(prev => ({ ...prev, [targetModId]: resItems.data }));
                        }
                    } else {
                        showToast(res?.message || "Failed to create item", "error");
                        setIsLoading(false);
                        return;
                    }
                }
            } else if (editingModuleId) {
                const res = await updateBusinessModule(editingModuleId, {
                    name: newModule.name
                });

                if (res?.success) {
                    setAvailableModules(prev => prev.map(m => 
                        m.id === editingModuleId ? { ...m, name: newModule.name } : m
                    ));
                    
                    const updated = availableModules.map(m => 
                        m.id === editingModuleId ? { ...m, name: newModule.name } : m
                    );
                    const customOnly = updated.filter(m => m.type === 'custom');
                    localStorage.setItem("custom_business_modules", JSON.stringify(customOnly));
                    
                    showToast(`Module updated successfully!`, "success");
                } else {
                    showToast(res?.message || "Failed to update module", "error");
                    setIsLoading(false);
                    return;
                }
            } else {
                const res = await createBusinessModule({
                    name: newModule.name
                });

                if (res?.success) {
                    const moduleId = String(res.data?.id || (res.data && res.data[0]?.id) || newModule.name.toLowerCase().replace(/\s+/g, '-'));
                    const newMod = {
                        id: moduleId,
                        name: newModule.name,
                        desc: newModule.description || `Custom business operation module`,
                        icon: Package,
                        colorClass: "blue", // Using a neutral blue for custom
                        type: 'custom'
                    };

                    const updated = [...availableModules, newMod];
                    setAvailableModules(updated);
                    
                    const customOnly = updated.filter(m => m.type === 'custom');
                    localStorage.setItem("custom_business_modules", JSON.stringify(customOnly));

                    showToast(`Module "${newModule.name}" created successfully!`, "success");
                } else {
                    showToast(res?.message || "Failed to create module", "error");
                    setIsLoading(false);
                    return;
                }
            }
            
            setIsModuleModalOpen(false);
            setEditingModuleId(null);
            setEditingItemId(null);
            setSelectedModuleIdForItem("");
            setNewModule({ name: "", type: "sale", description: "" });
        } catch (error) {
            console.error("❌ Failed to save item/module:", error);
            showToast("Server error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteModule = async (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this module?")) return;
        
        try {
            const res = await deleteBusinessModule(id);
            if (res?.success) {
                setAvailableModules(prev => prev.filter(m => m.id !== String(id)));
                const updated = availableModules.filter(m => m.id !== String(id));
                const customOnly = updated.filter(m => m.type === 'custom');
                localStorage.setItem("custom_business_modules", JSON.stringify(customOnly));
                showToast("Module deleted successfully", "success");
            } else {
                showToast(res?.message || "Failed to delete module", "error");
            }
        } catch (error) {
            showToast("Error deleting module", "error");
        }
    };

    const startEditingItem = (item: any, moduleId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItemId(String(item.id || item.item_id));
        setEditingModuleId(null);
        setSelectedModuleIdForItem(moduleId);
        setNewModule({ name: item.name || item.item_name || item.label, type: "sale", description: "" });
        setIsModuleModalOpen(true);
    };

    const handleDeleteItem = async (itemId: string | number, moduleId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await deleteModuleItem(itemId);
            if (res?.success) {
                showToast("Item deleted successfully", "success");
                const resItems = await getModuleItems(moduleId);
                if (resItems?.success && Array.isArray(resItems.data)) {
                    setModuleItemsMap(prev => ({ ...prev, [moduleId]: resItems.data }));
                }
            } else {
                showToast(res?.message || "Failed to delete item", "error");
            }
        } catch (error) {
            showToast("Error deleting item", "error");
        }
    };

    const startEditingModule = (module: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingModuleId(module.id);
        setNewModule({ name: module.name, type: module.type || 'sale', description: module.desc || "" });
        setIsModuleModalOpen(true);
    };


    const location = useLocation();

    // Fetch businesses on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const busResponse = await getBusinesses();
                if (Array.isArray(busResponse)) {
                    setBusinessList(busResponse);
                } else if (busResponse?.data && Array.isArray(busResponse.data)) {
                    setBusinessList(busResponse.data);
                }
            } catch (error) {
                console.error("❌ Failed to fetch businesses:", error);
            }
        };
        fetchData();
    }, []);

    // Check for resumeStep in navigation state and initialize IDs from localStorage
    useEffect(() => {
        if (location.state?.resumeStep) {
            console.log(`📌 [NewUserSetup] Resuming from Step: ${location.state.resumeStep}`);
            setCurrentStep(location.state.resumeStep);
        }

        // Restore basic selections from localStorage on mount
        const storedBusId = localStorage.getItem("business_id");
        if (storedBusId) setSelectedBusinessId(storedBusId);

        const storedBusName = localStorage.getItem("business_name");
        if (storedBusName) setSelectedBusinessName(storedBusName);

        const storedGroupIds = localStorage.getItem("selected_category_group_id");
        if (storedGroupIds) setSelectedCategoryGroupIds(JSON.parse(storedGroupIds));

        const storedGroupNames = localStorage.getItem("selected_category_group_name");
        if (storedGroupNames) setSelectedCategoryGroupNames(storedGroupNames.split(", "));

        const storedCatIds = localStorage.getItem("selected_category_ids");
        if (storedCatIds) setSelectedCategoryIds(JSON.parse(storedCatIds));

        const storedBrandIds = localStorage.getItem("selected_brand_ids");
        if (storedBrandIds) setSelectedBrandIds(JSON.parse(storedBrandIds));

        const storedStorageIds = localStorage.getItem("selected_storage_ids");
        if (storedStorageIds) setSelectedStorageIds(JSON.parse(storedStorageIds));

        const storedShopIds = localStorage.getItem("selected_shop_ids");
        if (storedShopIds) setSelectedShopIds(JSON.parse(storedShopIds));
    }, [location.state]);

    // Fetch Business Modules automatically when at step 7
    useEffect(() => {
        if (currentStep === 7 && availableModules.length === 0) {
            const fetchModules = async () => {
                setIsLoading(true);
                try {
                    console.log("🔌 [NewUserSetup] Auto-fetching business modules...");
                    const res = await getBusinessModules();
                    if (res) {
                        const rawData = Array.isArray(res) ? res : (res.data || (typeof res === 'object' ? (Object.values(res).find(v => Array.isArray(v)) || []) : []));
                        const finalData = Array.isArray(rawData) ? rawData : [rawData];
                        
                        const mappedModules = finalData.map((m: any) => {
                            const type = m.type || (m.is_custom ? 'custom' : 'sale');
                            return {
                                id: String(m.id || m.module_id),
                                name: m.name || m.module_name || "Unnamed Module",
                                desc: m.description || m.desc || "Custom business operational mode",
                                icon: type === 'service' ? Wrench : (type === 'sale' ? ShoppingCart : Package),
                                colorClass: type === 'service' ? 'service' : (type === 'sale' ? 'sales' : 'blue'),
                                type: (m.id === 1 || m.id === 4 || m.module_id === 1 || m.module_id === 4) ? 'system' : 'custom'
                            };
                        });

                        if (mappedModules.length > 0) {
                            setAvailableModules(mappedModules);
                        }
                    }
                } catch (error) {
                    console.error("❌ Failed to fetch business modules:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchModules();
        }
    }, [currentStep, availableModules.length]);

    const [activeSummary, setActiveSummary] = useState<any>(null);

    // Fetch Setup Summary to populate ACTIVE SELECTION SUMMARY
    const fetchActiveSummary = async () => {
        try {
            const res = await getSetupSummary();
            if (res?.success && res.data) {
                setActiveSummary(res.data);
            }
        } catch (error) {
            console.warn("⚠️ Failed to fetch active selection summary:", error);
        }
    };

    useEffect(() => {
        fetchActiveSummary();
    }, [currentStep]);

    const [moduleItemsMap, setModuleItemsMap] = useState<Record<string, any[]>>({});

    // Fetch module items for Step 8 (Final Configuration)
    useEffect(() => {
        if (currentStep === 8) {
            const fetchModuleItems = async () => {
                setIsLoading(true);
                const newMap: Record<string, any[]> = {};
                
                try {
                    await Promise.all(selectedBusinessModes.map(async (moduleId) => {
                        const res = await getModuleItems(moduleId);
                        if (res?.success && Array.isArray(res.data)) {
                            newMap[moduleId] = res.data;
                        } else {
                            newMap[moduleId] = [];
                        }
                    }));
                    setModuleItemsMap(newMap);
                } catch (error) {
                    console.error("❌ Failed to fetch module items:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchModuleItems();
        }
    }, [currentStep, selectedBusinessModes]);


    // ===================== STEP HELPERS =====================
    const getStepClass = (step: number) => {
        if (step < currentStep) return "completed";
        if (step === currentStep) return "active";
        return "";
    };

    const resetFromStep = (step: number) => {
        if (step <= 2) { setSelectedCategoryGroupIds([]); setSelectedCategoryGroupNames([]); }
        if (step <= 3) { setSelectedCategoryIds([]); setCategorySearch(""); }
        if (step <= 4) { setSelectedBrandIds([]); setSelectedBrandNames([]); }
        if (step <= 5) { setSelectedStorageIds([]); }
        if (step <= 6) { setSelectedShopIds([]); setSelectedShopNames([]); }
        if (step <= 7) { setSelectedBusinessModes([]); setSelectedActivityIds([]); }
        if (step <= 8) { /* Finalize step */ }
    };

    // ===================== STEP 1: Business =====================
    const handleBusinessContinue = async () => {
        if (!selectedBusinessId) return;

        setIsLoading(true);
        try {
            console.log(`🔌 [NewUserSetup] Step 1: Selecting Business ID: ${selectedBusinessId}`);
            const response = await selectBusiness({ business_id: selectedBusinessId });

            localStorage.setItem("business_id", selectedBusinessId);

            const businessToken = response.token || response?.data?.token;
            if (businessToken) {
                localStorage.setItem("token", businessToken);
                localStorage.setItem("business_name", selectedBusinessName);
                console.log("🎟️ [NewUserSetup] Business token and name saved");
            }

            // Fetch category groups for step 2
            const catResponse = await getBusinessCategoryGroups();
            console.log("📂 [NewUserSetup] Category Groups Response:", catResponse);

            let groups: any[] = [];
            if (catResponse?.success && catResponse.data) {
                groups = Array.isArray(catResponse.data) ? catResponse.data : (catResponse.data.category_groups || catResponse.data.categoryGroups || catResponse.data.category_group || catResponse.data.list || []);
            } else if (Array.isArray(catResponse)) {
                groups = catResponse;
            } else if (catResponse?.category_groups || catResponse?.categoryGroups || catResponse?.category_group || catResponse?.data) {
                groups = catResponse.category_groups || catResponse.categoryGroups || catResponse.category_group || (Array.isArray(catResponse.data) ? catResponse.data : []);
            }

            // Fallback for root property extraction
            if (groups.length === 0 && typeof catResponse === 'object' && catResponse !== null) {
                const firstArray = Object.values(catResponse).find(v => Array.isArray(v));
                if (firstArray) groups = firstArray as any[];
            }

            setCategoryGroups(groups);

            showToast(`Business "${selectedBusinessName}" selected`, "success");
            setCurrentStep(2);
        } catch (error: any) {
            console.error("❌ [SelectBusiness] API Error:", error);
            showToast("Failed to select business: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ===================== STEP 2: Category Group =====================
    const toggleCategoryGroupSelection = (id: string, name: string) => {
        if (selectedCategoryGroupIds.includes(id)) {
            const index = selectedCategoryGroupIds.indexOf(id);
            if (index !== -1) {
                setSelectedCategoryGroupIds(prev => prev.filter(i => i !== id));
                setSelectedCategoryGroupNames(prev => prev.filter((_, i) => i !== index));
            }
        } else {
            setSelectedCategoryGroupIds(prev => [...prev, id]);
            setSelectedCategoryGroupNames(prev => [...prev, name]);
        }
    };

    const handleCategoryContinue = async () => {
        if (selectedCategoryGroupIds.length === 0) return;

        setIsLoading(true);
        try {
            console.log(`📑 [NewUserSetup] Fetching categories for Group IDs: ${selectedCategoryGroupIds}`);

            let allFlattened: any[] = [];

            // Fetch categories for each selected group
            for (let i = 0; i < selectedCategoryGroupIds.length; i++) {
                const groupId = selectedCategoryGroupIds[i];
                const groupName = selectedCategoryGroupNames[i];
                const response = await fetchGroupCategoryBrandList(groupId);
                console.log(`📑 [NewUserSetup] Category List Response for Group ${groupId}:`, response);

                if (response) {
                    const rawList = Array.isArray(response) ? response : (response.data || (typeof response === 'object' ? (Object.values(response).find(v => Array.isArray(v)) || [response]) : []));
                    const finalRawList = Array.isArray(rawList) ? rawList : [rawList];

                    const processItems = (items: any, type: "primary" | "secondary" = "primary") => {
                        const itemsArray = Array.isArray(items) ? items : (items ? [items] : []);
                        itemsArray.forEach((item: any) => {
                            if (!item) return;
                            const id = item.id || item.category_id || item.category_group_id || item.category_list_id || item.business_category_id;
                            const name = item.name || item.category_name || item.sub_category_name || item.category_list_name || item.item_name;

                            // Only add if it has both an ID and a Name
                            if (id && name) {
                                allFlattened.push({ id, name, type, groupName });
                            }

                            // Check for nested children
                            const primaryChildren = item.primary_categories || item.categories;
                            if (primaryChildren && Array.isArray(primaryChildren)) {
                                processItems(primaryChildren, "primary");
                            }
                            const secondaryChildren = item.secondary_categories || item.sub_categories;
                            if (secondaryChildren && Array.isArray(secondaryChildren)) {
                                processItems(secondaryChildren, "secondary");
                            }
                        });
                    };

                    processItems(finalRawList);
                }
            }

            // Deduplicate and filter out any "Unnamed" remnants
            const uniqueFlattened = Array.from(new Map(
                allFlattened
                    .filter(item => item.name && item.name.toLowerCase() !== "unnamed")
                    .map(item => [`${item.id}-${item.groupName}`, item])
            ).values());

            setCategoryList(uniqueFlattened);

            const displayNames = Array.from(new Set(selectedCategoryGroupNames)).join(", ");
            localStorage.setItem("selected_category_group_name", displayNames);
            localStorage.setItem("selected_category_group_names", JSON.stringify(Array.from(new Set(selectedCategoryGroupNames))));
            showToast(`Category Groups selected: ${displayNames}`, "success");
            setCurrentStep(3); // Go to Category List
        } catch (error) {
            console.error("❌ [FetchCategoryList] Error:", error);
            showToast("Failed to fetch category list", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ===================== STEP 3: Category List =====================
    const toggleCategorySelection = (id: number) => {
        setSelectedCategoryIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleBrandSelection = (id: string, name: string) => {
        if (selectedBrandIds.includes(id)) {
            const index = selectedBrandIds.indexOf(id);
            if (index !== -1) {
                setSelectedBrandIds(prev => prev.filter(i => i !== id));
                setSelectedBrandNames(prev => prev.filter((_, i) => i !== index));
            }
        } else {
            setSelectedBrandIds(prev => [...prev, id]);
            setSelectedBrandNames(prev => [...prev, name]);
        }
    };

    const handleCategoryListContinue = async () => {
        const selectedCategories = categoryList.filter(cat => selectedCategoryIds.includes(cat.id));
        const selectedNames = selectedCategories.map(cat => cat.name);
        const selectedTypes = selectedCategories.map(cat => cat.type);

        localStorage.setItem("selected_category_group_id", JSON.stringify(selectedCategoryGroupIds));
        localStorage.setItem("selected_category_ids", JSON.stringify(selectedCategoryIds));
        localStorage.setItem("selected_category_names", JSON.stringify(selectedNames));
        localStorage.setItem("selected_category_types", JSON.stringify(selectedTypes));

        setIsLoading(true);
        try {
            console.log(`📑 [NewUserSetup] Fetching brands for Group IDs: ${selectedCategoryGroupIds}`);
            let allBrands: any[] = [];

            for (const groupId of selectedCategoryGroupIds) {
                const response = await fetchCategoryBrandList(groupId);
                if (response) {
                    const rawData = Array.isArray(response) ? response : (response.data || (typeof response === 'object' ? (Object.values(response).find(v => Array.isArray(v)) || [response]) : []));
                    const finalRawData = Array.isArray(rawData) ? rawData : [rawData];
                    
                    const processBrands = (items: any, parentCategoryName: string | null, parentCategoryId: number | string | null) => {
                        const itemsArray = Array.isArray(items) ? items : (items ? [items] : []);
                        itemsArray.forEach(item => {
                            if (!item) return;
                            let currentCategoryName = parentCategoryName;
                            let currentCategoryId = parentCategoryId;

                            // Basic check if it's a brand object directly
                            const isBrandObj = !!(item.brand_name || item.brand) && !item.secondary_categories && !item.primary_categories;

                            const iterName = item.name || item.category_name || item.category_list_name;
                            const iterId = item.id || item.category_id;

                            if (iterName && iterId && !isBrandObj) {
                                currentCategoryName = iterName;
                                currentCategoryId = iterId;
                            }

                            // If we have a category context, check if it's in our selected categories
                            if (currentCategoryId && selectedCategoryIds.includes(Number(currentCategoryId))) {
                                const matchedCat = categoryList.find(c => c.id === currentCategoryId);
                                const currentCategoryType = matchedCat ? matchedCat.type : "primary";

                                const brandName = item.brand_name || item.brand;
                                const brandId = item.brand_id || (brandName ? item.id : null);
                                
                                if (brandName && brandId) {
                                    allBrands.push({ id: String(brandId), name: brandName, groupName: currentCategoryName || "Other", type: currentCategoryType });
                                }

                                if (item.brands && Array.isArray(item.brands)) {
                                    item.brands.forEach((b: any) => {
                                        const bName = typeof b === 'string' ? b : (b.name || b.brand_name || b.brand);
                                        const bId = typeof b === 'string' ? null : (b.id || b.brand_id);
                                        if (bName && bId) allBrands.push({ id: String(bId), name: bName, groupName: currentCategoryName || "Other", type: currentCategoryType });
                                    });
                                }
                            }

                            // Recursively check deeper levels
                            const children = item.primary_categories || item.categories || item.secondary_categories || item.sub_categories || item.items || item.products;
                            if (children) {
                                processBrands(children, currentCategoryName, currentCategoryId);
                            }
                        });
                    };
                    processBrands(finalRawData, null, null);
                }
            }

            const uniqueMap = new Map();
            allBrands.forEach(b => {
                if (!uniqueMap.has(b.id)) {
                    uniqueMap.set(b.id, b);
                }
            });
            const uniqueBrands = Array.from(uniqueMap.values());
            setBrandList(uniqueBrands);

            showToast(`${selectedCategoryIds.length} categories selected`, "success");
            setCurrentStep(4);
        } catch (error: any) {
            console.error("❌ [FetchBrands] API Error:", error);
            showToast("Failed to fetch brands", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ===================== STEP 4: Brand List =====================
    const handleBrandContinue = async () => {
        if (selectedBrandIds.length === 0) return;
        localStorage.setItem("selected_brand_ids", JSON.stringify(selectedBrandIds));
        localStorage.setItem("selected_brand_names", JSON.stringify(selectedBrandNames));
        
        setIsLoading(true);
        try {
            console.log("🔌 [NewUserSetup] Fetching storage types for Step 5...");
            const res = await getStorageTypes();
            const defaultStaticTypes = [
                { id: 1, name: "Warehouse", desc: "Bulk storage and regional inventory", icon: Warehouse, category: "primary" },
                { id: 4, name: "Main Building", desc: "Corporate headquarters storage", icon: Building, category: "primary" }
            ];
            
            if (res.success && res.data) {
                const types = res.data;
                const mappedOptions = types.length > 0 ? types.map((t: any, idx: number) => ({
                    id: t.id,
                    name: t.name,
                    desc: "Manage storage, levels and items",
                    icon: idx % 2 === 0 ? Warehouse : Building,
                    category: "primary"
                })) : defaultStaticTypes;
                setStorageOptions(mappedOptions);
            } else {
                setStorageOptions(defaultStaticTypes);
            }
            
            showToast(`${selectedBrandIds.length} brands selected`, "success");
            setCurrentStep(5);
        } catch (error) {
            console.error("❌ [FetchStorageTypes] API Error:", error);
            showToast("Failed to fetch storage types", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ===================== STEP 4: Shop =====================
    const toggleShopSelection = (id: string, name: string) => {
        setSelectedShopIds(prev => {
            const isSelected = prev.includes(id);
            const newIds = isSelected ? prev.filter(i => i !== id) : [...prev, id];

            // Update names accordingly
            setSelectedShopNames(prevNames => {
                if (isSelected) return prevNames.filter(n => n !== name);
                return [...prevNames, name];
            });

            return newIds;
        });
    };

    const handleShopContinue = () => {
        if (selectedShopIds.length === 0) return;
        localStorage.setItem("shop_names", JSON.stringify(selectedShopNames));
        showToast(`${selectedShopIds.length} shop types selected`, "success");
        setCurrentStep(7);
    };

    // ===================== STEP 5: Storage Type =====================

    useEffect(() => {
        if (currentStep === 5 && storageOptions.length === 0) {
            const fetchStorageOpts = async () => {
                setIsLoading(true);
                try {
                    const res = await getStorageTypes();
                    const defaultStaticTypes = [
                        { id: 1, name: "Warehouse", desc: "Bulk storage and regional inventory", icon: Warehouse, category: "primary" },
                        { id: 4, name: "Main Building", desc: "Corporate headquarters storage", icon: Building, category: "primary" }
                    ];
                    if (res.success && res.data) {
                        const types = res.data;
                        const mappedOptions = types.length > 0 ? types.map((t: any, idx: number) => ({
                            id: t.id,
                            name: t.name,
                            desc: "Manage storage, levels and items",
                            icon: idx % 2 === 0 ? Warehouse : Building,
                            category: "primary"
                        })) : defaultStaticTypes;
                        setStorageOptions(mappedOptions);
                    } else {
                        setStorageOptions(defaultStaticTypes);
                    }
                } catch (error) {
                    console.error("❌ Failed to fetch storage options:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchStorageOpts();
        }
    }, [currentStep, storageOptions.length]);

    // Fetch Shop Types automatically when at step 6
    useEffect(() => {
        if (currentStep === 6 && shopOperations.length === 0) {
            const fetchShops = async () => {
                setIsLoading(true);
                try {
                    console.log("🔌 [NewUserSetup] Auto-fetching shop types for Step 6...");
                    const res = await getShopTypes();
                    if (Array.isArray(res)) {
                        setShopOperations(res);
                    } else if (res?.data && Array.isArray(res.data)) {
                        setShopOperations(res.data);
                    }
                } catch (error) {
                    console.error("❌ Failed to auto-fetch shop operations:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchShops();
        }
    }, [currentStep, shopOperations.length]);

    // Fetch Category Groups automatically when at step 2
    useEffect(() => {
        if (currentStep === 2 && categoryGroups.length === 0) {
            const fetchCategoryGroups = async () => {
                setIsLoading(true);
                try {
                    const res = await getBusinessCategoryGroups();
                    let groups: any[] = [];
                    if (res?.success && res.data) {
                        groups = Array.isArray(res.data) ? res.data : (res.data.category_groups || res.data.categoryGroups || res.data.category_group || res.data.list || []);
                    } else if (Array.isArray(res)) {
                        groups = res;
                    } else if (res?.category_groups || res?.categoryGroups || res?.category_group || res?.data) {
                        groups = res.category_groups || res.categoryGroups || res.category_group || (Array.isArray(res.data) ? res.data : []);
                    }
                    
                    // Fallback for root property extraction
                    if (groups.length === 0 && typeof res === 'object' && res !== null) {
                        const firstArray = Object.values(res).find(v => Array.isArray(v));
                        if (firstArray) groups = firstArray as any[];
                    }

                    setCategoryGroups(groups);
                } catch (error) {
                    console.error("❌ Failed to auto-fetch category groups:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCategoryGroups();
        }
    }, [currentStep, categoryGroups.length]);

    // Fetch Category List automatically when at step 3
    useEffect(() => {
        if (currentStep === 3 && categoryList.length === 0 && selectedCategoryGroupIds.length > 0) {
            const fetchCategories = async () => {
                setIsLoading(true);
                try {
                    console.log(`🔌 [NewUserSetup] Auto-fetching categories for Groups:`, selectedCategoryGroupIds);
                    let allFlattened: any[] = [];
                    for (const groupId of selectedCategoryGroupIds) {
                        const response = await fetchGroupCategoryBrandList(groupId);
                        console.log(`📑 [NewUserSetup] Raw API Response for Group ${groupId}:`, response);
                        
                        if (response) {
                            const rawList = Array.isArray(response) ? response : (response.data || (typeof response === 'object' ? (Object.values(response).find(v => Array.isArray(v)) || [response]) : []));
                            // Ensure rawList is an array if we extracted from an object
                            const finalRawList = Array.isArray(rawList) ? rawList : [rawList];

                            const processItems = (items: any, type: "primary" | "secondary" = "primary") => {
                                const itemsArray = Array.isArray(items) ? items : (items ? [items] : []);
                                itemsArray.forEach((item: any) => {
                                    if (!item) return;
                                    const id = item.id || item.category_id || item.category_group_id || item.category_list_id || item.business_category_id;
                                    const name = item.name || item.category_name || item.sub_category_name || item.category_list_name || item.item_name;
                                    
                                    if (id && name) {
                                        allFlattened.push({ id, name, type, groupName: item.groupName || item.category_group_name || "" });
                                    }
                                    
                                    // Deeply nested categories
                                    const primaryChildren = item.primary_categories || item.categories || item.category_list;
                                    if (primaryChildren) processItems(primaryChildren, "primary");
                                    
                                    const secondaryChildren = item.secondary_categories || item.sub_categories || item.sub_category_list;
                                    if (secondaryChildren) processItems(secondaryChildren, "secondary");
                                });
                            };
                            processItems(finalRawList);
                        }
                    }
                    const uniqueFlattened = Array.from(new Map(
                        allFlattened.filter(item => item.name && item.name.toLowerCase() !== "unnamed")
                            .map(item => [`${item.id}-${item.groupName}`, item])
                    ).values());
                    
                    console.log("✅ [NewUserSetup] Processed Categories:", uniqueFlattened);
                    setCategoryList(uniqueFlattened);
                } catch (error) {
                    console.error("❌ Failed to auto-fetch category list:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCategories();
        }
    }, [currentStep, categoryList.length, selectedCategoryGroupIds.length]);

    // Fetch Brands automatically when at step 4
    useEffect(() => {
        if (currentStep === 4 && brandList.length === 0 && selectedCategoryGroupIds.length > 0) {
             const fetchBrands = async () => {
                setIsLoading(true);
                try {
                    console.log("🔌 [NewUserSetup] Auto-fetching brands for Groups:", selectedCategoryGroupIds);
                    let allBrands: any[] = [];
                    for (const groupId of selectedCategoryGroupIds) {
                        const response = await fetchCategoryBrandList(groupId);
                        console.log(`🏷️ [NewUserSetup] Raw Brand API Response for Group ${groupId}:`, response);
                        
                        if (response) {
                            const rawData = Array.isArray(response) ? response : (response.data || (typeof response === 'object' ? (Object.values(response).find(v => Array.isArray(v)) || [response]) : []));
                            const finalRawData = Array.isArray(rawData) ? rawData : [rawData];

                            const processBrands = (items: any, parentCategoryName: string | null, parentCategoryId: number | string | null) => {
                                const itemsArray = Array.isArray(items) ? items : (items ? [items] : []);
                                itemsArray.forEach(item => {
                                    if (!item) return;
                                    let currentCategoryName = parentCategoryName || (item.name || item.category_name || item.category_list_name);
                                    let currentCategoryId = parentCategoryId || (item.id || item.category_id || item.category_list_id);
                                    
                                    const brandName = item.brand_name || item.brand;
                                    const brandId = item.brand_id || (brandName ? item.id : null);
                                    
                                    if (brandName && brandId) {
                                        allBrands.push({ id: String(brandId), name: brandName, groupName: currentCategoryName || "Other" });
                                    }

                                    const children = item.primary_categories || item.categories || item.secondary_categories || item.sub_categories || item.brands || item.product;
                                    if (children) processBrands(children, currentCategoryName, currentCategoryId);
                                });
                            };
                            processBrands(finalRawData, null, null);
                        }
                    }
                    const uniqueBrands = Array.from(new Map(allBrands.map(b => [b.id, b])).values());
                    console.log("✅ [NewUserSetup] Processed Brands:", uniqueBrands);
                    setBrandList(uniqueBrands);
                } catch (error) {
                    console.error("❌ Failed to auto-fetch brand list:", error);
                } finally {
                    setIsLoading(false);
                }
             };
             fetchBrands();
        }
    }, [currentStep, brandList.length, selectedCategoryGroupIds.length]);

    const toggleStorageSelection = (id: number) => {
        setSelectedStorageIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleStorageContinue = async () => {
        if (selectedStorageIds.length === 0) return;

        const selectedNames = storageOptions
            .filter(opt => selectedStorageIds.includes(opt.id))
            .map(opt => opt.name)
            .join(", ");

        localStorage.setItem("branch_name", selectedNames);
        
        setIsLoading(true);
        try {
            console.log("🔌 [NewUserSetup] Fetching shop types for Step 6...");
            const opsResponse = await getShopTypes();
            if (Array.isArray(opsResponse)) {
                setShopOperations(opsResponse);
            } else if (opsResponse?.data && Array.isArray(opsResponse.data)) {
                setShopOperations(opsResponse.data);
            }
            showToast(`Storage: ${selectedNames}`, "success");
            setCurrentStep(6);
        } catch (error) {
            console.error("❌ [FetchShops] API Error:", error);
            showToast("Failed to fetch shops", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeContinue = () => {
        if (selectedBusinessModes.length === 0) return;
        localStorage.setItem("business_mode", JSON.stringify(selectedBusinessModes));
        setCurrentStep(8);
    };

    // ===================== STEP 7: Mode Filtering & Final Save =====================
    const hasModeSelected = selectedBusinessModes.length > 0;

    const handleFinalSave = async () => {
        if (!hasModeSelected) return;

        setIsLoading(true);
        try {
            const finalModuleIds = selectedActivityIds.length > 0 ? selectedActivityIds : [
                ...(selectedBusinessModes.includes("sale") ? [1] : []),
                ...(selectedBusinessModes.includes("service") ? [4] : [])
            ];

            const payload: BusinessSetupPayload = {
                shopTypeIds: selectedShopIds.map(Number),
                moduleItemIds: finalModuleIds.length > 0 ? finalModuleIds : [1, 2, 3],
                categoryGroupIds: selectedCategoryGroupIds.map(Number),
                categoryIds: selectedCategoryIds,
                brandIds: selectedBrandIds.map(Number)
            };

            console.log("🚀 [NewUserSetup] Final Save Payload:", payload);
            await saveBusinessSetup(payload);

            showToast("Setup completed successfully!", "success");
            setTimeout(() => navigate("/analytics"), 1000);
        } catch (error: any) {
            console.error("❌ [NewUserSetup] Setup failed:", error);
            showToast("Setup failed: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ===================== BREADCRUMB =====================
    const renderBreadcrumb = (...items: (any | null | undefined)[]) => {
        // Build items from activeSummary if available
        const apiSummaryItems: any[] = [];
        if (activeSummary) {
            if (activeSummary.shop_types?.length) {
                apiSummaryItems.push({ icon: "🏬", label: activeSummary.shop_types.map((s: any) => s.operation_name || s.name).join(", ") });
            }
            if (activeSummary.category_groups?.length) {
                apiSummaryItems.push({ icon: "📂", label: activeSummary.category_groups.map((cg: any) => cg.name).join(", ") });
            }
            if (activeSummary.categories?.length) {
                apiSummaryItems.push({ icon: "🛒", label: `${activeSummary.categories.length} Categories` });
            }
            if (activeSummary.brands?.length) {
                apiSummaryItems.push({ icon: "🏷️", label: `${activeSummary.brands.length} Brands` });
            }
        }

        // Use passed items if apiSummary is empty (to maintain UX during first-time setup before any saves)
        const displayItems = apiSummaryItems.length > 0 ? apiSummaryItems : items.filter(item => item && item.label);

        return (
            <div className="nu-summary-wrapper">
                <div className="nu-summary-label">
                    <Check size={12} /> Active Selection Summary
                </div>
                <div className="nu-selected-badge">
                    {displayItems.map((item, i) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            {i > 0 && <span style={{ margin: "0 6px", color: "#94a3b8", opacity: 0.5 }}>•</span>}
                            <span className="badge-icon">{item.icon}</span>
                            <span className="badge-text">{item.label}</span>
                        </span>
                    ))}
                    <span className="badge-change" onClick={() => {
                        const prev = currentStep - 1;
                        setCurrentStep(prev);
                        resetFromStep(prev);
                    }}>
                        Change
                    </span>
                </div>
            </div>
        );
    };

    // ===================== RENDER =====================
    return (
        <div className="nu-container">
            <div className="nu-wrapper">

                {/* Step Progress Bar */}
                <div className="nu-step-progress">
                    {[
                        { num: 1, label: "Business" },
                        { num: 2, label: "Category Group" },
                        { num: 3, label: "Category List" },
                        { num: 4, label: "Brand List" },
                        { num: 5, label: "Storage" },
                        { num: 6, label: "Shop" },
                        { num: 7, label: "Mode" },
                        { num: 8, label: "Finalize" },
                    ].map((step, i, arr) => (
                        <span key={step.num} style={{ display: "contents" }}>
                            <div className={`nu-step-indicator ${getStepClass(step.num)}`}>
                                <span className="nu-step-num">
                                    {step.num < currentStep ? <Check size={14} /> : step.num}
                                </span>
                                {step.label}
                            </div>
                            {i < arr.length - 1 && (
                                <div className={`nu-step-connector ${step.num < currentStep ? "completed" : ""}`} />
                            )}
                        </span>
                    ))}
                </div>

                {/* ======= STEP 1: Business ======= */}
                {currentStep === 1 && (
                    <div className="nu-step-panel" key="step1">
                        <div className="nu-step-header">
                            <h2>Select Your Business</h2>
                            <p>Choose the business you want to configure</p>
                        </div>

                        <div className="nu-selection-grid">
                            {businessList.map((biz, index) => {
                                const id = String(biz.id || biz.business_id);
                                const name = biz.business_name || biz.name || "Unnamed";
                                const desc = biz.description || biz.business_type || "Business";
                                return (
                                    <div
                                        key={id}
                                        className={`nu-selection-card ${selectedBusinessId === id ? "selected" : ""}`}
                                        onClick={() => { setSelectedBusinessId(id); setSelectedBusinessName(name); }}
                                    >
                                        <div className={`nu-card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                            <Briefcase size={22} />
                                        </div>
                                        <div className="nu-card-title">{name}</div>
                                        <div className="nu-card-subtitle">{desc}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {businessList.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>Loading businesses...</p>
                        )}

                        <div className="nu-step-actions">
                            <div />
                            <div className="nu-step-actions-right">
                                <button className="nu-btn-step nu-btn-primary" disabled={!selectedBusinessId || isLoading} onClick={handleBusinessContinue}>
                                    {isLoading ? <><div className="nu-spinner" /> Connecting...</> : <>Save & Continue <ArrowRight size={16} /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 2: Category Group ======= */}
                {currentStep === 2 && (
                    <div className="nu-step-panel" key="step2">
                        <div className="nu-step-header">
                            <h2>Select Category Group</h2>
                            <p>Choose the product category for this business</p>
                        </div>

                        {renderBreadcrumb(
                            { icon: "🏢", label: selectedBusinessName },
                            selectedCategoryGroupNames.length > 0 ? { icon: "📂", label: Array.from(new Set(selectedCategoryGroupNames)).join(", ") } : null
                        )}

                        <div className="nu-select-actions">
                            <button className="nu-action-btn select-all" onClick={selectAllCategoryGroups}>
                                <div className="icon"><Check size={12} /></div>
                                Select All
                            </button>
                            <button className="nu-action-btn remove-all" onClick={removeAllCategoryGroups}>
                                <div className="icon"><X size={12} /></div>
                                Remove All
                            </button>
                        </div>

                        <div className="nu-selection-grid">
                            {categoryGroups.map((cat, index) => {
                                const id = String(cat.id || cat.category_group_id || index);
                                const name = cat.name || cat.category_group_name || "Unnamed";
                                const isSelected = selectedCategoryGroupIds.includes(id);
                                return (
                                    <div
                                        key={id}
                                        className={`nu-selection-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => toggleCategoryGroupSelection(id, name)}
                                    >
                                        <div className={`nu-card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                            <Layers size={22} />
                                        </div>
                                        <div className="nu-card-title">{name}</div>
                                        {isSelected && (
                                            <div className="nu-card-check">
                                                <Check size={14} color="white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {categoryGroups.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>No category groups found for this business.</p>
                        )}

                        <div className="nu-step-actions">
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => { setCurrentStep(1); resetFromStep(2); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="nu-step-actions-right">
                                <button className="nu-btn-step nu-btn-primary" disabled={selectedCategoryGroupIds.length === 0 || isLoading} onClick={handleCategoryContinue}>
                                    {isLoading ? <div className="nu-spinner" /> : <>Save & Continue <ArrowRight size={16} /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 3: Category List (Multi-Select) ======= */}
                {currentStep === 3 && (
                    <div className="nu-step-panel" key="step3">
                        <div className="nu-step-header">
                            <h2>Select Categories</h2>
                            <p>Choose specific categories for your inventory</p>
                        </div>

                        {renderBreadcrumb(
                            { icon: "🏢", label: selectedBusinessName },
                            { icon: "📂", label: Array.from(new Set(selectedCategoryGroupNames)).join(", ") }
                        )}

                        <div className="nu-search-filter-row">
                            <div className="nu-search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                />
                            </div>

                            <div className="nu-type-filters">
                                <button
                                    className={`nu-filter-pill ${categoryTypeFilter === 'primary' ? 'active' : ''}`}
                                    onClick={() => setCategoryTypeFilter('primary')}
                                >
                                    Primary Categories
                                </button>
                                <button
                                    className={`nu-filter-pill ${categoryTypeFilter === 'secondary' ? 'active' : ''}`}
                                    onClick={() => setCategoryTypeFilter('secondary')}
                                >
                                    Secondary Categories
                                </button>
                            </div>
                        </div>

                        <div className="nu-select-actions">
                            <button className="nu-action-btn select-all" onClick={selectAllCategories}>
                                <div className="icon"><Check size={12} /></div>
                                Select All
                            </button>
                            <button className="nu-action-btn remove-all" onClick={removeAllCategories}>
                                <div className="icon"><X size={12} /></div>
                                Remove All
                            </button>
                        </div>

                        <div className="nu-grouped-categories">
                            {Array.from(new Set(categoryList.map(c => c.groupName))).map(groupName => {
                                const groupItems = categoryList
                                    .filter(cat => cat.groupName === groupName && cat.type === categoryTypeFilter)
                                    .filter(cat => (cat.name || "").toLowerCase().includes(categorySearch.toLowerCase()));

                                if (groupItems.length === 0) return null;

                                return (
                                    <div key={groupName} className="nu-category-group-section">
                                        <div className="nu-group-header">
                                            <Layers size={18} />
                                            <span>{groupName}</span>
                                        </div>
                                        <div className="nu-selection-grid">
                                            {groupItems.map((cat, index) => {
                                                const id = cat.id || index;
                                                const name = cat.name || "Unnamed";
                                                const isSelected = selectedCategoryIds.includes(id);
                                                return (
                                                    <div
                                                        key={`${id}-${groupName}`}
                                                        className={`nu-selection-card ${isSelected ? "selected" : ""}`}
                                                        onClick={() => toggleCategorySelection(id)}
                                                    >
                                                        <div className={`nu-card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                                            <ShoppingCart size={22} />
                                                        </div>
                                                        <div className="nu-card-title">{name}</div>
                                                        <div className="nu-card-subtitle"><span className="nu-group-tag">{groupName}</span> • {categoryTypeFilter === 'primary' ? 'Primary' : 'Secondary'}</div>
                                                        {isSelected && (
                                                            <div className="nu-card-check">
                                                                <Check size={14} color="white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {categoryList.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>No categories available.</p>
                        )}

                        <div className="nu-step-actions">
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => { setCurrentStep(2); resetFromStep(3); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="nu-step-actions-right">
                                <button className="nu-btn-step nu-btn-primary" disabled={selectedCategoryIds.length === 0} onClick={handleCategoryListContinue}>
                                    Save & Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 4: Brand List (Multi-Select) ======= */}
                {currentStep === 4 && (
                    <div className="nu-step-panel" key="step4">
                        <div className="nu-step-header">
                            <h2>Select Brands</h2>
                            <p>Choose brands associated with your selections</p>
                        </div>

                        {renderBreadcrumb(
                            { icon: "🏢", label: selectedBusinessName },
                            { icon: "📂", label: Array.from(new Set(selectedCategoryGroupNames)).join(", ") },
                            { icon: "📑", label: `${selectedCategoryIds.length} categories` }
                        )}

                        <div className="nu-search-filter-row">
                            <div className="nu-search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={brandSearch}
                                    onChange={(e) => setBrandSearch(e.target.value)}
                                />
                            </div>

                            <div className="nu-type-filters">
                                <button
                                    className={`nu-filter-pill ${brandTypeFilter === 'primary' ? 'active' : ''}`}
                                    onClick={() => setBrandTypeFilter('primary')}
                                >
                                    Primary Categories
                                </button>
                                <button
                                    className={`nu-filter-pill ${brandTypeFilter === 'secondary' ? 'active' : ''}`}
                                    onClick={() => setBrandTypeFilter('secondary')}
                                >
                                    Secondary Categories
                                </button>
                            </div>
                        </div>

                        <div className="nu-select-actions">
                            <button className="nu-action-btn select-all" onClick={selectAllBrands}>
                                <div className="icon"><Check size={12} /></div>
                                Select All
                            </button>
                            <button className="nu-action-btn remove-all" onClick={removeAllBrands}>
                                <div className="icon"><X size={12} /></div>
                                Remove All
                            </button>
                        </div>

                        <div className="nu-grouped-categories">
                            {Array.from(new Set(brandList.map(b => b.groupName))).map(groupName => {
                                const groupBrands = brandList
                                    .filter(b => b.groupName === groupName && b.type === brandTypeFilter)
                                    .filter(b => (b.name || "").toLowerCase().includes(brandSearch.toLowerCase()));

                                if (groupBrands.length === 0) return null;
                                return (
                                    <div key={groupName} className="nu-category-group-section">
                                        <div className="nu-group-header">
                                            <div className="nu-header-dot" />
                                            <span className="nu-mode-pill">{groupName}</span>
                                        </div>
                                        <div className="nu-selection-grid">
                                            {groupBrands.map((brand, index) => {
                                                const id = brand.id;
                                                const name = brand.name;
                                                const isSelected = selectedBrandIds.includes(id);
                                                return (
                                                    <div
                                                        key={id}
                                                        className={`nu-selection-card ${isSelected ? "selected" : ""}`}
                                                        onClick={() => toggleBrandSelection(id, name)}
                                                    >
                                                        <div className={`nu-card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                                            <Package size={22} />
                                                        </div>
                                                        <div className="nu-card-title">{name}</div>
                                                        {isSelected && (
                                                            <div className="nu-card-check">
                                                                <Check size={14} color="white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {brandList.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>No brands found for these categories.</p>
                        )}

                        <div className="nu-step-actions">
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => { setCurrentStep(3); resetFromStep(4); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="nu-step-actions-right">
                                <button className="nu-btn-step nu-btn-primary" disabled={selectedBrandIds.length === 0} onClick={handleBrandContinue}>
                                    Save & Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 5: Storage Type (Multi-Select) ======= */}
                {currentStep === 5 && (
                    <div className="nu-step-panel" key="step5">
                        <div className="nu-step-header">
                            <h2>Select Storage Type</h2>
                            <p>Choose one or more storage types for your operations</p>
                        </div>

                        {renderBreadcrumb(
                            { icon: "🏢", label: selectedBusinessName },
                            { icon: "📂", label: Array.from(new Set(selectedCategoryGroupNames)).join(", ") },
                            { icon: "🏷️", label: `${selectedBrandIds.length} brands` }
                        )}


                        <div className="nu-select-actions" style={{ justifyContent: 'center' }}>
                            <button className="nu-action-btn select-all" onClick={selectAllStorage}>
                                <div className="icon"><Check size={12} /></div>
                                Select All
                            </button>
                            <button className="nu-action-btn remove-all" onClick={removeAllStorage}>
                                <div className="icon"><X size={12} /></div>
                                Remove All
                            </button>
                        </div>

                        <div className="nu-selection-grid">
                            {storageOptions
                                .map((opt, index) => {
                                    const isSelected = selectedStorageIds.includes(opt.id);
                                    const IconComp = opt.icon;
                                    return (
                                        <div
                                            key={opt.id}
                                            className={`nu-selection-card ${isSelected ? "selected" : ""}`}
                                            onClick={() => toggleStorageSelection(opt.id)}
                                        >
                                            <div className={`nu-card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                                <IconComp size={22} />
                                            </div>
                                            <div className="nu-card-title">{opt.name}</div>
                                            <div className="nu-card-subtitle">{opt.desc}</div>
                                            {isSelected && (
                                                <div className="nu-card-check">
                                                    <Check size={14} color="white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="nu-step-actions">
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => { setCurrentStep(4); resetFromStep(5); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="nu-step-actions-right">
                                <button className="nu-btn-step nu-btn-primary" disabled={selectedStorageIds.length === 0} onClick={handleStorageContinue}>
                                    Save & Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 6: Shop ======= */}
                {currentStep === 6 && (
                    <div className="nu-step-panel" key="step6">
                        <div className="nu-step-header">
                            <h2>Select Shop</h2>
                            <p>Choose the shop type for your business</p>
                        </div>

                        {renderBreadcrumb(
                            { icon: "🏢", label: selectedBusinessName },
                            { icon: "📂", label: Array.from(new Set(selectedCategoryGroupNames)).join(", ") },
                            { icon: "🏗️", label: storageOptions.filter(o => selectedStorageIds.includes(o.id)).map(o => o.name).join(", ") }
                        )}

                        <div className="nu-select-actions">
                            <button className="nu-action-btn select-all" onClick={selectAllShops}>
                                <div className="icon"><Check size={12} /></div>
                                Select All
                            </button>
                            <button className="nu-action-btn remove-all" onClick={removeAllShops}>
                                <div className="icon"><X size={12} /></div>
                                Remove All
                            </button>
                        </div>

                        <div className="nu-selection-grid">
                            {shopOperations.map((shop, index) => {
                                const id = String(shop.id || shop.operation_id);
                                const name = shop.operation_name || shop.name || "Unnamed";
                                const location = shop.location || shop.description || "";
                                const IconComp = getShopIcon(name);
                                const isSelected = selectedShopIds.includes(id);
                                return (
                                    <div
                                        key={id}
                                        className={`nu-selection-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => toggleShopSelection(id, name)}
                                    >
                                        <div className={`nu-card-icon ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                                            <IconComp size={22} />
                                        </div>
                                        <div className="nu-card-title">{name}</div>
                                        {location && <div className="nu-card-subtitle">{location}</div>}
                                        {isSelected && (
                                            <div className="nu-card-check">
                                                <Check size={14} color="white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {shopOperations.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>Loading shops...</p>
                        )}

                        <div className="nu-step-actions">
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => { setCurrentStep(5); resetFromStep(6); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="nu-step-actions-right">
                                <button className="nu-btn-step nu-btn-primary" disabled={selectedShopIds.length === 0} onClick={handleShopContinue}>
                                    Save & Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 7: Business Mode (Multi-Select) ======= */}
                {currentStep === 7 && (
                    <div className="nu-step-panel" key="step7">
                        <div className="nu-step-header">
                            <h2>Select Business Mode</h2>
                            <p>Choose one or more modes for your business operations</p>
                        </div>

                        {renderBreadcrumb(
                            { icon: "🏢", label: selectedBusinessName },
                            { icon: "📂", label: Array.from(new Set(selectedCategoryGroupNames)).join(", ") },
                            { icon: "🏬", label: Array.from(new Set(selectedShopNames)).join(", ") },
                            { icon: "🏗️", label: storageOptions.filter(o => selectedStorageIds.includes(o.id)).map(o => o.name).join(", ") }
                        )}

                        <div className="nu-select-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="nu-action-btn select-all" onClick={selectAllModes}>
                                    <div className="icon"><Check size={12} /></div>
                                    Select All
                                </button>
                                <button className="nu-action-btn remove-all" onClick={removeAllModes}>
                                    <div className="icon"><X size={12} /></div>
                                    Remove All
                                </button>
                            </div>
                            <button className="nu-action-btn create-module" onClick={() => { setEditingModuleId(null); setNewModule({name: "", type: "sale", description: ""}); setIsModuleModalOpen(true); }} style={{ color: '#3b82f6', border: '1px solid #dbeafe', background: '#f0f9ff' }}>
                                <Plus size={16} /> Create Item
                            </button>
                        </div>

                        <div className="nu-mode-grid">
                            {availableModules.map(module => {
                                const IconComp = module.icon;
                                const isSelected = selectedBusinessModes.includes(module.id);
                                return (
                                    <div
                                        key={module.id}
                                        className={`nu-mode-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => {
                                            setSelectedBusinessModes(prev => 
                                                prev.includes(module.id) ? prev.filter(m => m !== module.id) : [...prev, module.id]
                                            );
                                        }}
                                    >
                                        <div className={`nu-mode-icon ${module.colorClass}`}>
                                            <IconComp size={26} />
                                        </div>
                                        <div className="nu-mode-title">{module.name}</div>
                                        <div className="nu-mode-desc">{module.desc}</div>
                                        {isSelected && (
                                            <div className="nu-card-check">
                                                <Check size={14} color="white" />
                                            </div>
                                        )}
                                        {module.type === 'custom' && (
                                            <div className="nu-card-actions">
                                                <button className="action-icon edit" onClick={(e) => startEditingModule(module, e)}>
                                                    <Pencil size={12} />
                                                </button>
                                                <button className="action-icon delete" onClick={(e) => handleDeleteModule(module.id, e)}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="nu-step-actions">
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => { setCurrentStep(6); resetFromStep(7); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="nu-step-actions-right">
                                <button
                                    className="nu-btn-step nu-btn-primary"
                                    disabled={selectedBusinessModes.length === 0}
                                    onClick={handleModeContinue}
                                >
                                    Save & Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======= STEP 8: Final Filtering & Confirmation ======= */}
                {currentStep === 8 && (
                    <div className="nu-step-panel" key="step8">
                        <div className="nu-step-header">
                            <h2>{selectedBusinessModes.length > 1 ? "Final Configuration" : (selectedBusinessModes.includes("sale") ? "Sales Storage List" : "Service Storage List")}</h2>
                            <p>Review and finalize your {selectedBusinessModes.join(" & ")} configuration</p>
                        </div>

                        {renderBreadcrumb(
                            { icon: "🏢", label: selectedBusinessName },
                            { icon: "📂", label: Array.from(new Set(selectedCategoryGroupNames)).join(", ") },
                            { icon: "🏬", label: Array.from(new Set(selectedShopNames)).join(", ") },
                            { icon: "🏗️", label: storageOptions.filter(o => selectedStorageIds.includes(o.id)).map(o => o.name).join(", ") },
                            { icon: "⚡", label: selectedBusinessModes.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ") }
                        )}

                        <div className="nu-select-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="nu-action-btn select-all" onClick={selectAllActivities}>
                                    <div className="icon"><Check size={12} /></div>
                                    Select All
                                </button>
                                <button className="nu-action-btn remove-all" onClick={removeAllActivities}>
                                    <div className="icon"><X size={12} /></div>
                                    Remove All
                                </button>
                            </div>
                            <button className="nu-action-btn create-module" onClick={() => { setEditingModuleId(null); setNewModule({name: "", type: "sale", description: ""}); setIsModuleModalOpen(true); }} style={{ color: '#3b82f6', border: '1px solid #dbeafe', background: '#f0f9ff' }}>
                                <Plus size={16} /> Create Item
                            </button>
                        </div>

                        <div className="nu-grouped-categories" style={{ marginTop: "24px" }}>
                            {selectedBusinessModes.map(moduleId => {
                                const module = availableModules.find(m => m.id === moduleId);
                                const filtered = moduleItemsMap[moduleId] || [];

                                if (filtered.length === 0) return null;

                                return (
                                    <div key={moduleId} className="nu-category-group-section">
                                        <div className="nu-group-header">
                                            <div className="nu-header-dot" />
                                            <span className="nu-mode-pill">{module?.name || "Module"}</span>
                                        </div>
                                        <div className="nu-selection-grid">
                                            {filtered.map((item, idx) => {
                                                const itemId = Number(item.id || item.item_id);
                                                const isSelected = selectedActivityIds.includes(itemId);
                                                return (
                                                    <div
                                                        key={`${itemId}-${idx}`}
                                                        className={`nu-selection-card ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setSelectedActivityIds(prev =>
                                                                prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]
                                                            );
                                                        }}
                                                    >
                                                        <div className={`nu-card-icon ${module?.colorClass || 'blue'}`}>
                                                            {moduleId === "4" ? <Wrench size={20} /> : (moduleId === "1" ? <ShoppingCart size={20} /> : <Package size={20} />)}
                                                        </div>
                                                        <div className="nu-card-title">{item.name || item.item_name || item.label}</div>
                                                        <div className="nu-card-actions">
                                                            <button className="action-icon edit" onClick={(e) => startEditingItem(item, moduleId, e)}>
                                                                <Pencil size={12} />
                                                            </button>
                                                            <button className="action-icon delete" onClick={(e) => handleDeleteItem(item.id || item.item_id, moduleId, e)}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="nu-card-check">
                                                                 <Check size={14} color="white" />
                                                             </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="nu-step-actions" style={{ marginTop: "40px" }}>
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => setCurrentStep(7)}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="nu-step-actions-right">
                                <button className="nu-btn-step nu-btn-primary" disabled={isLoading} onClick={handleFinalSave}>
                                    {isLoading ? <><div className="nu-spinner" /> Saving...</> : <>Complete Setup <Check size={16} /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {
                toast && (
                    <div className={`nu-toast ${toast.type}`}>
                        {toast.type === "success" ? "✅" : "❌"} {toast.message}
                    </div>
                )
            }

            {/* ======= MODAL: Create Module/Item ======= */}
            {isModuleModalOpen && (
                <div className="nu-modal-overlay">
                    <div className="nu-modal-content">
                        <div className="nu-modal-header">
                            <div className="header-icon">
                                {(editingModuleId || editingItemId) ? <Pencil size={24} /> : <Plus size={24} />}
                            </div>
                            <div className="header-text">
                                <h3>{(editingModuleId || editingItemId) ? "Edit" : "Create New"}</h3>
                                <p>{(editingModuleId || editingItemId) ? "Update your customized details" : "Add a customized operational mode to your business"}</p>
                            </div>
                            <button className="close-btn" onClick={() => { setIsModuleModalOpen(false); setEditingModuleId(null); setEditingItemId(null); }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="nu-modal-body">
                            {currentStep === 8 && (
                                <div className="nu-form-group">
                                    <label>Select Module</label>
                                    <select 
                                        className="nu-form-select"
                                        value={selectedModuleIdForItem}
                                        onChange={(e) => setSelectedModuleIdForItem(e.target.value)}
                                    >
                                        <option value="">Select a Module...</option>
                                        {availableModules.filter(m => selectedBusinessModes.includes(m.id)).map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="nu-form-group">
                                <label>Item Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Wholesale, Repair Center..." 
                                    value={newModule.name}
                                    onChange={(e) => setNewModule({...newModule, name: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="nu-modal-footer">
                            <button className="nu-btn-step nu-btn-secondary" onClick={() => { setIsModuleModalOpen(false); setEditingModuleId(null); setEditingItemId(null); }}>
                                Cancel
                            </button>
                            <button className="nu-btn-step nu-btn-primary" onClick={handleCreateModule} disabled={!newModule.name}>
                                {(editingModuleId || editingItemId) ? "Update" : "Create"} {(editingModuleId || editingItemId) ? <Check size={16} /> : <Plus size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewUserSetup;