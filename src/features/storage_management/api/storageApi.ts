import axios, { AxiosError } from "axios";
import type { 
  StorageType, 
  AddressField, 
  AddressValue, 
  StructureLevel, 
  Location, 
  StorageErrorResponse 
} from "../types/storageTypes";

const BASE_URL = "http://localhost:3000/api/storage";

// Create Axios Instance
const storageApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor for Bearer Token
// Placeholder token retrieval (replace with your auth provider logic)
storageApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token") || "DEMO_TOKEN";
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for Backend Error Types
storageApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<StorageErrorResponse>) => {
    // Pass specific error structure to consumer if available
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

/* ====================================================
   1) WAREHOUSE (Storage Type)
   ==================================================== */
export const getTypes = () => storageApi.get<StorageType[]>("/types").then(res => res.data);
export const createType = (data: { name: string }) => 
  storageApi.post<StorageType>("/type", data).then(res => res.data);
export const updateType = (id: number, data: { name: string }) => 
  storageApi.put<StorageType>(`/type/${id}`, data).then(res => res.data);
export const deleteType = (id: number) => storageApi.delete(`/type/${id}`);

/* ====================================================
   2) ADDRESS FIELDS
   ==================================================== */
export const getAddressFields = (storageTypeId: number) => 
  storageApi.get<AddressField[]>(`/address-fields/${storageTypeId}`).then(res => res.data);
export const createAddressField = (data: any) => 
  storageApi.post<AddressField>("/address-field", data).then(res => res.data);

/* ====================================================
   3) ADDRESS VALUES
   ==================================================== */
export const getAddressValues = (storageTypeId: number) => 
  storageApi.get<AddressValue[]>(`/address-values/${storageTypeId}`).then(res => res.data);
export const createAddressValue = (data: any) => 
  storageApi.post<AddressValue>("/address-value", data).then(res => res.data);
export const updateAddressValue = (id: number, data: any) => 
  storageApi.put<AddressValue>(`/address-value/${id}`, data).then(res => res.data);
export const deleteAddressValue = (id: number) => storageApi.delete(`/address-value/${id}`);

/* ====================================================
   4) STRUCTURE
   ==================================================== */
export const getStructure = (storageTypeId: number) => 
  storageApi.get<StructureLevel[]>(`/structure/${storageTypeId}`).then(res => res.data);
export const createStructure = (data: any) => 
  storageApi.post<StructureLevel>("/structure", data).then(res => res.data);
export const updateStructure = (id: number, data: any) => 
  storageApi.put<StructureLevel>(`/structure/${id}`, data).then(res => res.data);
export const deleteStructure = (id: number) => storageApi.delete(`/structure/${id}`);

/* ====================================================
   5) LOCATION (Tree)
   ==================================================== */
export const getLocations = (storageTypeId: number) => 
  storageApi.get<Location[]>(`/locations/${storageTypeId}`).then(res => res.data);
export const createLocation = (data: any) => 
  storageApi.post<Location>("/location", data).then(res => res.data);
export const updateLocation = (id: number, data: any) => 
  storageApi.put<Location>(`/location/${id}`, data).then(res => res.data);
export const deleteLocation = (id: number) => storageApi.delete(`/location/${id}`);

export default storageApi;
