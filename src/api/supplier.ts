import { http } from "./base_api/base_api";

export interface SupplierPayload {
    supplier_details: {
        supplier_name: string;
        company_name: string;
        phone_number: string;
        email_id?: string;
        pan_number: string;
        gst_status: {
            with_gst: boolean;
            gst_number: string;
        };
    };
    branches: Array<{
        branch_name: string;
        phone: string;
    }>;
    addresses: {
        permanent_address: {
            address_line_1: string;
            address_line_2: string;
            city: string;
            state: string;
            pincode: string;
        };
        current_address: {
            address_line_1: string;
            address_line_2: string;
            city: string;
            state: string;
            pincode: string;
        };
    };
}

export interface SupplierResponse {
    status: boolean;
    message: string;
    data?: any;
}

/**
 * Creates a new supplier.
 * Endpoint: POST /api/suppliers/
 */
export const createSupplier = async (payload: SupplierPayload): Promise<SupplierResponse> => {
    return http("suppliers/", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const listSuppliers = async (): Promise<any> => {
    return http("suppliers/", {
        method: "GET",
    });
};

export const updateSupplier = async (id: number | string, payload: SupplierPayload): Promise<SupplierResponse> => {
    return http(`suppliers/${id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteSupplier = async (id: number | string): Promise<SupplierResponse> => {
    return http(`suppliers/${id}/`, {
        method: "DELETE",
    });
};
