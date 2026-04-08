import { http } from "./base_api/base_api";

export const fetchCategories = async (): Promise<any> => {
    // API is currently 404, returning mock data only.
    return [
        { id: 1, category_name: "Computer" },
        { id: 2, category_name: "Laptop" },
        { id: 3, category_name: "Mobile" }
    ];
};

export const fetchBusinessCategoryGroups = async (): Promise<any> => {
    return http("businesscategorygroup", {
        method: "GET",
    });
};
