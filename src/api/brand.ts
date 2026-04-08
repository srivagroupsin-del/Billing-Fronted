import { http } from "./base_api/base_api";

export const fetchBrands = async (categoryId?: string): Promise<any> => {
    try {
        const url = categoryId ? `brand/list?categoryId=${categoryId}` : "brand/list";
        const response = await http(url, { method: "GET", hideErrorLogging: true }).catch(() => null);

        if (response && (Array.isArray(response) || response.data)) {
            return response.data || response;
        }

        // Mock fallback if API fails
        return [
            { id: 1, brand_name: "Apple", category_id: 1 },
            { id: 2, brand_name: "Samsung", category_id: 1 },
            { id: 3, brand_name: "Nike", category_id: 2 }
        ].filter(b => !categoryId || String(b.category_id) === String(categoryId));
    } catch (error) {
        console.error("❌ Failed to fetch brands:", error);
        return [];
    }
};

/**
 * Fetch brands filtered by multiple category IDs.
 * Reads category IDs selected in the setup flow and returns only those brands.
 */
export const fetchBrandsByCategoryIds = async (categoryIds: number[]): Promise<any[]> => {
    if (!categoryIds || categoryIds.length === 0) {
        console.warn("⚠️ No category IDs provided for brand filtering");
        return [];
    }

    try {
        // Try batch endpoint first: send all category IDs as comma-separated query param
        const idsParam = categoryIds.join(",");
        const response = await http(`brand/list-by-categories?category_ids=${idsParam}`, {
            method: "GET",
            hideErrorLogging: true
        }).catch(() => null);

        if (response) {
            const list = Array.isArray(response) ? response : (response.data || []);
            if (list.length > 0) {
                console.log(`✅ Fetched ${list.length} brands from batch endpoint`);
                return list;
            }
        }
    } catch (error) {
        console.warn("⚠️ Batch brand endpoint failed, trying individual fetches...", error);
    }

    // Fallback: fetch brands for each category individually and merge
    try {
        const allBrands: any[] = [];
        for (const catId of categoryIds) {
            try {
                const response = await http(`brand/list?categoryId=${catId}`, { method: "GET", hideErrorLogging: true }).catch(() => null);
                if (response) {
                    const list = Array.isArray(response) ? response : (response.data || []);
                    allBrands.push(...list);
                }
            } catch {
                // Skip individual errors
            }
        }

        // Deduplicate by brand ID
        const uniqueBrands = Array.from(
            new Map(allBrands.map(b => [b.id || b.brand_id || b.brand_name, b])).values()
        );

        if (uniqueBrands.length > 0) {
            console.log(`✅ Fetched ${uniqueBrands.length} brands from individual category fetches`);
            return uniqueBrands;
        }
    } catch (error) {
        console.error("❌ Individual brand fetches also failed:", error);
    }

    return [];
};
