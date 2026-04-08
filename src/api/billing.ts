import { http } from "./base_api/base_api";

export interface CreateBillItem {
    productId: number;
    variantType: string;
    quantity: number;
    shelfId: number;
    stockTypeId: number;
}

export interface CreateBillPayload {
    items: CreateBillItem[];
    paymentMode: "CASH" | "CARD" | "UPI" | "ONLINE";
}

export const createBill = async (payload: CreateBillPayload): Promise<any> => {
    return http("billing/create", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const fetchBills = async (): Promise<any> => {
    return http("billing", {
        method: "GET",
    });
};

export const fetchBillById = async (orderId: number | string): Promise<any> => {
    return http(`billing/${orderId}`, {
        method: "GET",
    });
};
