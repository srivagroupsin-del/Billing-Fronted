import { http } from "./base_api/base_api";

export interface ProductAllocationProduct {
    product_id: number;
    product_name: string;
    min_sale_qty: number;
    max_sale_qty: number;
}

export interface ProductAllocationPayload {
    setup_id: number;
    category_group_id: number;
    category_id: number;
    brand_id: number;
    products: ProductAllocationProduct[];
}

export interface AllocationResponse {
    success?: boolean;
    status: boolean;
    message: string;
    data?: any;
}

/**
 * Creates product allocation.
 * Endpoint: POST /api/productAllocation
 */
export const saveProductAllocation = async (payload: ProductAllocationPayload): Promise<AllocationResponse> => {
    return http("productAllocation", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Lists all product allocations.
 * Endpoint: GET /api/productAllocation
 */
export const listProductAllocations = async (): Promise<any> => {
    return http("productAllocation", {
        method: "GET",
    });
};
/**
 * Deletes a product allocation.
 * Endpoint: DELETE /api/productAllocation/:id
 */
export const deleteProductAllocation = async (id: string | number): Promise<AllocationResponse> => {
    return http(`productAllocation/${id}`, {
        method: "DELETE",
    });
};
