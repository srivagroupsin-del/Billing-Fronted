import { http } from "./base_api/base_api";

export interface StockVariant {
    variant_id: number;
    buying_price: number;
    profit_margin: number;
    selling_price: number;
    qty: number;
}

export interface StockType {
    stock_type_id: number;
    qty: number;
}

export interface StockPayload {
    product_id: number;
    supplier_id: number;
    is_self_produced: boolean;
    storage_location_id: number;
    variants: StockVariant[];
    stock_types: StockType[];
}

export interface StockResponse {
    status: boolean;
    message: string;
    data?: any;
    success?: boolean; // Added for consistency with other APIs
}

/**
 * Adds product stock to a location.
 * Endpoint: POST /api/businessStock/
 */
export const addStock = async (payload: StockPayload): Promise<StockResponse> => {
    return http("businessStock", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Lists all stock items.
 * Endpoint: GET /api/businessStock/
 */
export const listStock = async (): Promise<any> => {
    return http("businessStock", {
        method: "GET",
    });
};

/**
 * Lists all distributed stock items (stock available on shelves for billing).
 * Endpoint: GET /api/stockDistribution/
 */
export const fetchDistributedStock = async (): Promise<any> => {
    return http("stockDistribution", {
        method: "GET",
    });
};

/**
 * Creates new stock entry.
 * Endpoint: POST /api/stocks
 */
export const createStock = async (payload: any): Promise<StockResponse> => {
    return http("stocks", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};
/**
 * Fetches all stock entries.
 * Endpoint: GET /api/stocks
 */
export const getStocks = async (): Promise<StockResponse> => {
    return http("stocks", {
        method: "GET"
    });
};

/**
 * Deletes a stock entry.
 * Endpoint: DELETE /api/stocks/:id
 */
export const deleteStock = async (id: number): Promise<StockResponse> => {
    return http(`stocks/${id}`, {
        method: "DELETE"
    });
};

/**
 * Fetches a single stock entry by ID.
 * Endpoint: GET /api/stocks/:id
 */
export const getStockById = async (id: number | string): Promise<StockResponse> => {
    return http(`stocks/${id}`, {
        method: "GET"
    });
};

/**
 * Updates an existing stock entry.
 * Endpoint: PUT /api/stocks/:id
 */
export const updateStock = async (id: number | string, payload: any): Promise<StockResponse> => {
    return http(`stocks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

/**
 * Fetches stock types (distribution) for a given stock ID.
 * Endpoint: GET /api/stockTypes/by-stock?stock_id=:id
 */
export const getStockTypesByStockId = async (stockId: number | string): Promise<any> => {
    return http(`stockTypes/by-stock?stock_id=${stockId}`, {
        method: "GET"
    });
};

