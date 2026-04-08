import { http } from "./base_api/base_api";

const STORAGE_KEY = "billing_products";

const getStoredProducts = (): any[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [
        { id: 1, product_name: "iPhone 13", category_id: "Electronics", brand_id: "Apple", min_qty: 5, max_qty: 20, storage: "Warehouse", quantity: 10, supplier: "Global Trade Inc" },
        { id: 2, product_name: "Samsung S21", category_id: "Electronics", brand_id: "Samsung", min_qty: 2, max_qty: 15, storage: "Showroom", quantity: 5, supplier: "Quality Goods Ltd" }
    ];
};

const saveProducts = (products: any[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const getProducts = async (): Promise<any> => {
    // API not yet available, directly return stored products to avoid 404 console errors
    return getStoredProducts();
};

export const createProduct = async (product: any): Promise<any> => {
    const products = getStoredProducts();
    const newProduct = {
        ...product,
        id: Date.now(),
        // Prioritize resolved names over raw IDs
        product_name: product.product_name || product.product,
        category_id: product.category_id || product.category,
        category_name: product.category_name || product.category,
        brand_id: product.brand_id || product.brand,
        brand_name: product.brand_name || product.brand,
        min_qty: product.min_qty || product.minQty,
        max_qty: product.max_qty || product.maxQty,
        storage: product.storage
    };
    const updated = [...products, newProduct];
    saveProducts(updated);
    return newProduct;
};

export const updateProduct = async (id: number, product: any): Promise<any> => {
    const products = getStoredProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...product };
        saveProducts(products);
    }
    return products[index];
};

export const deleteProduct = async (id: number): Promise<any> => {
    const products = getStoredProducts();
    const filtered = products.filter(p => p.id !== id);
    saveProducts(filtered);
    return true;
};

export const fetchProductsByBrand = async (brandId: string): Promise<any> => {
    const products = getStoredProducts();
    return products.filter(p => String(p.brand_id) === String(brandId));
};

export const addBranchProduct = async (data: any): Promise<any> => {
    const branchProducts = JSON.parse(localStorage.getItem("branch_products") || "[]");
    const newMapping = { ...data, id: Date.now() };
    branchProducts.push(newMapping);
    localStorage.setItem("branch_products", JSON.stringify(branchProducts));
    return newMapping;
};

export const getBranchProducts = async (params: any): Promise<any> => {
    const branchProducts = JSON.parse(localStorage.getItem("branch_products") || "[]");
    if (params && params.business_id) {
        return branchProducts.filter((bp: any) => String(bp.business_id) === String(params.business_id));
    }
    return branchProducts;
};

export const fetchMappingList = async (): Promise<any> => {
    try {
        const data = await http("category-brand/list", {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching mapping list:", error);
        return [
            { id: 1, category_name: "Electronics", brand_name: "Apple", product_name: "iPhone 13" },
            { id: 2, category_name: "Electronics", brand_name: "Samsung", product_name: "Galaxy S21" },
            { id: 3, category_name: "Clothing", brand_name: "Nike", product_name: "Running Shoes" },
            { id: 4, category_name: "Clothing", brand_name: "Adidas", product_name: "T-Shirt" }
        ];
    }
};
export const fetchGroupCategoryBrandList = async (groupId: string | number): Promise<any> => {
    try {
        const data = await http(`GroupCatgeorybrandallProductList?category_group_id=${groupId}`, {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching group category brand list:", error);
        return null;
    }
};

export const fetchCategoryBrandList = async (groupId: string | number): Promise<any> => {
    try {
        const data = await http(`GroupCatgeorybrandallProductList/categories-brands?category_group_id=${groupId}`, {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching category brand list:", error);
        return null;
    }
};

export const fetchBrandsByCategoryId = async (categoryId: string | number): Promise<any> => {
    try {
        const data = await http(`GroupCatgeorybrandallProductList/categories-brands/${categoryId}`, {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching brands by category:", error);
        return null;
    }
};

export const fetchProductsByBrandId = async (brandId: string | number): Promise<any> => {
    try {
        const data = await http(`GroupCatgeorybrandallProductList/brand-products/${brandId}`, {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching brand products:", error);
        return null;
    }
};

export const fetchProductsByCategoryAndBrand = async (categoryId: string | number, brandId: string | number): Promise<any> => {
    try {
        const data = await http(`GroupCatgeorybrandallProductList/brand-products/${categoryId}/${brandId}`, {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching products by category and brand:", error);
        return null;
    }
};

export const fetchBusinessSuppliers = async (): Promise<any> => {
    try {
        const data = await http("suppliers", {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return null;
    }
};

export const fetchBusinessStock = async (): Promise<any> => {
    try {
        const data = await http("businessStock", {
            method: "GET",
        });
        return data;
    } catch (error) {
        console.error("Error fetching business stock:", error);
        return null;
    }
};

export const createBusinessStock = async (stockData: any): Promise<any> => {
    try {
        const data = await http("businessStock", {
            method: "POST",
            body: JSON.stringify(stockData),
        });
        return data;
    } catch (error) {
        console.error("Error creating business stock:", error);
        throw error;
    }
};

