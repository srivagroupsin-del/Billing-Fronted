import { http } from "./base_api/base_api";

export interface BusinessSetupPayload {
    shopTypeIds: number[];
    moduleItemIds: number[];
    categoryGroupIds: number[];
    categoryIds: number[];
    brandIds: number[];
}

/**
 * Lists all businesses for the current user.
 * Endpoint: GET /api/businesses/my-businesses
 */
export const getBusinesses = async (): Promise<any> => {
    try {
        const response = await http("businesses/my-businesses", { method: "GET" }).catch(() => null);
        if (response) return response;

        const altResponse = await http("auth/business", { method: "GET" }).catch(() => null);
        if (altResponse) return altResponse;
    } catch (error) {
        console.error("❌ Failed to fetch businesses:", error);
        return [];
    }
};

/**
 * Creates a new business.
 * Endpoint: POST /api/auth/business-create
 */
export const createBusiness = async (payload: any): Promise<any> => {
    return http("auth/business-create", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Configures operations and activities for the business.
 * Endpoint: POST /api/setup/full
 */
export const saveBusinessSetup = async (payload: BusinessSetupPayload): Promise<any> => {
    return http("setup/full", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Fetches available shop types (Local, Online, Wholesale, etc.).
 * Endpoint: GET /api/setup/shop-types
 */
export const getShopTypes = async (): Promise<any> => {
    try {
        const response = await http("setup/shop-types", { method: "GET" });
        return response || [];
    } catch (error) {
        console.error("❌ Failed to fetch shop types:", error);
        return [];
    }
};

/**
 * Fetches category groups for the selected business.
 * Endpoint: GET /api/businesscategorygroup
 */
export const getBusinessCategoryGroups = async (): Promise<any> => {
    try {
        const response = await http("businesscategorygroup", { method: "GET" });
        return response || { success: false, data: { category_groups: [] } };
    } catch (error) {
        console.error("❌ Failed to fetch business category groups:", error);
        return { success: false, data: { category_groups: [] } };
    }
};

/**
 * Fetches the current setup configuration summary.
 * Endpoint: GET /api/setup/setup
 */
export const getSetupSummary = async (): Promise<any> => {
    try {
        const response = await http("setup/setup", { method: "GET" });
        return response;
    } catch (error) {
        console.error("❌ Failed to fetch setup summary:", error);
        return null;
    }
};

/**
 * Fetches available business modules.
 * Endpoint: GET /api/businessModules/modules
 */
export const getBusinessModules = async (): Promise<any> => {
    try {
        const response = await http("businessModules/modules", { method: "GET" });
        return response;
    } catch (error) {
        console.error("❌ Failed to fetch business modules:", error);
        return { success: false, data: [] };
    }
};

/**
 * Creates a new business module.
 * Endpoint: POST /api/businessModules/modules
 */
export const createBusinessModule = async (payload: { name: string }): Promise<any> => {
    try {
        const response = await http("businessModules/modules", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return response;
    } catch (error) {
        console.error("❌ Failed to create business module:", error);
        return { success: false, message: "API error" };
    }
};

/**
 * Updates an existing business module.
 * Endpoint: PUT /api/businessModules/modules/:id
 */
export const updateBusinessModule = async (id: string | number, payload: { name: string }): Promise<any> => {
    try {
        const response = await http(`businessModules/modules/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        return response;
    } catch (error) {
        console.error(`❌ Failed to update business module ${id}:`, error);
        return { success: false, message: "API error" };
    }
};

/**
 * Deletes a business module.
 * Endpoint: DELETE /api/businessModules/modules/:id
 */
export const deleteBusinessModule = async (id: string | number): Promise<any> => {
    try {
        const response = await http(`businessModules/modules/${id}`, { method: "DELETE" });
        return response;
    } catch (error) {
        console.error(`❌ Failed to delete business module ${id}:`, error);
        return { success: false, message: "API error" };
    }
};

/**
 * Fetches items for a specific business module.
 * Endpoint: GET /api/businessModules/modules/:moduleId/items
 */
export const getModuleItems = async (moduleId: number | string): Promise<any> => {
    try {
        const response = await http(`businessModules/modules/${moduleId}/items`, { method: "GET" });
        return response;
    } catch (error) {
        console.error(`❌ Failed to fetch items for module ${moduleId}:`, error);
        return { success: false, data: [] };
    }
};

/**
 * Creates a new item within a business module.
 * Endpoint: POST /api/businessModules/modules/items
 */
export const createModuleItem = async (payload: { module_id: string | number; name: string }): Promise<any> => {
    try {
        const response = await http("businessModules/modules/items", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return response;
    } catch (error) {
        console.error("❌ Failed to create module item:", error);
        return { success: false, message: "API error" };
    }
};

/**
 * Updates an item within a business module.
 * Endpoint: PUT /api/businessModules/modules/items/:id
 */
export const updateModuleItem = async (id: string | number, payload: { name: string }): Promise<any> => {
    try {
        const response = await http(`businessModules/modules/items/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        return response;
    } catch (error) {
        console.error("❌ Failed to update module item:", error);
        return { success: false, message: "API error" };
    }
};

/**
 * Deletes an item from a business module.
 * Endpoint: DELETE /api/businessModules/modules/items/:id
 */
export const deleteModuleItem = async (id: string | number): Promise<any> => {
    try {
        const response = await http(`businessModules/modules/items/${id}`, {
            method: "DELETE"
        });
        return response;
    } catch (error) {
        console.error("❌ Failed to delete module item:", error);
        return { success: false, message: "API error" };
    }
};
