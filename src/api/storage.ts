import { http } from "./base_api/base_api";

export interface StoragePayload {
    storage_type_id?: number;
    location_type_id?: number;
    name?: string;
    parent_id?: number | null;
    address?: string;
    landmark?: string;
    pincode?: string;
    [key: string]: any;
}

export interface StorageResponse {
    status: boolean;
    success?: boolean;
    message: string;
    data?: any;
}

/**
 * Creates a new storage location.
 * Endpoint: POST /api/storage/
 */
export const createStorage = async (payload: StoragePayload): Promise<StorageResponse> => {
    return http("storage", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Returns hierarchical location tree.
 * Endpoint: GET /api/storage/tree
 */
export const getLocationTree = async (storageTypeId?: number): Promise<any> => {
    const url = storageTypeId ? `storage/locations/${storageTypeId}` : "storage/tree";
    return http(url, {
        method: "GET",
    });
};

// --- New Storage Module APIs ---

export const createStorageType = async (payload: { name: string }): Promise<StorageResponse> => {
    return http("storage/type", {
        method: "POST",
        body: JSON.stringify(payload)
    });
};

export const getStorageTypes = async (): Promise<StorageResponse> => {
    return http("storage/types", {
        method: "GET"
    });
};

export const deleteStorageType = async (id: number): Promise<StorageResponse> => {
    return http(`storage/type/${id}`, {
        method: "DELETE"
    });
};

export const updateStorageType = async (id: number, payload: { name: string }): Promise<StorageResponse> => {
    return http(`storage/type/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
};

export const createAddressField = async (payload: { storage_type_id: number, field_name: string }): Promise<StorageResponse> => {
    return http("storage/address-field", {
        method: "POST",
        body: JSON.stringify(payload)
    });
};

export const getAddressFields = async (storageTypeId: number): Promise<StorageResponse> => {
    return http(`storage/address-fields/${storageTypeId}`, {
        method: "GET"
    });
};

export interface StructureLevelPayload {
    storage_type_id: number;
    name: string;
    parent_id: number | null;
    level_order: number;
    is_partitionable: boolean;
    partition_rows?: number;
    partition_columns?: number;
}

export const createStructureLevel = async (payload: StructureLevelPayload): Promise<StorageResponse> => {
    return http("storage/structure", {
        method: "POST",
        body: JSON.stringify(payload)
    });
};

export const getStructureLevels = async (storageTypeId: number): Promise<StorageResponse> => {
    return http(`storage/structure/${storageTypeId}`, {
        method: "GET"
    });
};

export const updateStorageTypeStructure = async (typeId: number, payload: any): Promise<StorageResponse> => {
    return http(`storage/structure/${typeId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
};

export const updateStructureLevel = async (id: number, payload: Partial<StructureLevelPayload>): Promise<StorageResponse> => {
    return http(`storage/structure/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
};

export const deleteStructureLevel = async (id: number): Promise<StorageResponse> => {
    return http(`storage/structure/${id}`, {
        method: "DELETE"
    });
};

export const updateStructureOrder = async (payload: { structure: any[] }) => {
    return http(`/storage/structure/reorder`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
};

export interface StorageLocationPayload {
    storage_type_id: number;
    parent_id: number | null;
    level_id: number;
    code: string;
    name: string;
    address_id?: number | null;
}

export const createStorageLocation = async (payload: StorageLocationPayload): Promise<StorageResponse> => {
    return http("storage/location", {
        method: "POST",
        body: JSON.stringify(payload)
    });
};

export const getStorageLocations = async (storageTypeId: number): Promise<StorageResponse> => {
    return http(`storage/locations/${storageTypeId}`, {
        method: "GET"
    });
};

export const deleteStorageLocation = async (id: number): Promise<StorageResponse> => {
    return http(`storage/location/${id}`, {
        method: "DELETE"
    });
};

export const updateStorageLocation = async (id: number, payload: Partial<StorageLocationPayload>): Promise<StorageResponse> => {
    return http(`storage/location/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
};

/**
 * Saves address values for a storage type.
 * Endpoint: POST /api/storage/address-values
 */
export interface AddressValuePayload {
    storage_type_id: number;
    fields: {
        field_id: number;
        value: string;
    }[];
}

export const saveAddressValues = async (payload: AddressValuePayload): Promise<StorageResponse> => {
    return http("storage/address-value", {
        method: "POST",
        body: JSON.stringify(payload)
    });
};

/**
 * Updates an existing address value record.
 * Endpoint: PUT /api/storage/address-value/:id
 */
export const updateAddressValue = async (id: number | string, value: string): Promise<StorageResponse> => {
    return http(`storage/address-value/${id}`, {
        method: "PUT",
        body: JSON.stringify({ value })
    });
};

/**
 * Fetches saved address values for a storage type.
 * Endpoint: GET /api/storage/address-values/:storageTypeId
 */
export const getAddressValues = async (storageTypeId: number): Promise<StorageResponse> => {
    return http(`storage/address-values/${storageTypeId}`, {
        method: "GET"
    });
};

export const deleteAddressValue = async (id: number | string): Promise<StorageResponse> => {
    return http(`storage/address-value/${id}`, {
        method: "DELETE"
    });
};

