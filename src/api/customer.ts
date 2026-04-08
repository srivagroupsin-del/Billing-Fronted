import { http } from "./base_api/base_api";

export const getCustomers = async (): Promise<any> => {
    try {
        const res = await http("customer/list", { method: "GET" }).catch(() => []);
        return res;
    } catch (e) {
        return [];
    }
};

export const getCustomerByBusiness = async (number: string): Promise<any> => {
    try {
        const response = await http(`customer/getCustomerBybusiness?number=${number}`, { 
            method: "GET",
            hideErrorLogging: true 
        });
        return response;
    } catch (error) {
        return null;
    }
};

export const addCustomer = async (data: any): Promise<any> => {
    try {
        return await http("customer/create", { method: "POST", body: JSON.stringify(data) });
    } catch (e) {
        console.error("Failed to add customer:", e);
        throw e;
    }
};

export const createCustomer = async (data: any): Promise<any> => {
    return addCustomer(data);
};
