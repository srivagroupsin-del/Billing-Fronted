import { http } from "./base_api/base_api";

export const generateBill = async (data: any): Promise<any> => {
    return http("sales/bill", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const fetchSalesBills = async (): Promise<any> => {
    return http("sales/bills", {
        method: "GET",
    });
};

export const fetchSalesBillById = async (id: number | string): Promise<any> => {
    return http(`sales/bill/${id}`, {
        method: "GET",
    });
};

export const fetchSalesBillDetails = async (id: number | string): Promise<any> => {
    return http(`sales/bill/details/${id}`, {
        method: "GET",
    });
};
