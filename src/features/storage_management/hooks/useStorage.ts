import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/storageApi";

/* ----------------------------------------------------
   Warehouse Type Hooks
   ---------------------------------------------------- */
export const useWarehouses = () => {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: api.getTypes,
  });
};

export const useWarehouseMutation = () => {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: api.createType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateType(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
  });

  const remove = useMutation({
    mutationFn: api.deleteType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
  });

  return { create, update, remove };
};

/* ----------------------------------------------------
   Address Field Hooks
   ---------------------------------------------------- */
export const useAddressFields = (storageTypeId: number) => {
  return useQuery({
    queryKey: ["address-fields", storageTypeId],
    queryFn: () => api.getAddressFields(storageTypeId),
    enabled: !!storageTypeId,
  });
};

export const useAddressFieldMutation = (storageTypeId: number) => {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: api.createAddressField,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["address-fields", storageTypeId] }),
  });

  return { create };
};

/* ----------------------------------------------------
   Address Value Hooks
   ---------------------------------------------------- */
export const useAddressValues = (storageTypeId: number) => {
  return useQuery({
    queryKey: ["address-values", storageTypeId],
    queryFn: () => api.getAddressValues(storageTypeId),
    enabled: !!storageTypeId,
  });
};

export const useAddressValueMutation = (storageTypeId: number) => {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: api.createAddressValue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["address-values", storageTypeId] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateAddressValue(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["address-values", storageTypeId] }),
  });

  const remove = useMutation({
    mutationFn: api.deleteAddressValue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["address-values", storageTypeId] }),
  });

  return { create, update, remove };
};

/* ----------------------------------------------------
   Structure Hooks
   ---------------------------------------------------- */
export const useStructure = (storageTypeId: number) => {
  return useQuery({
    queryKey: ["structure", storageTypeId],
    queryFn: () => api.getStructure(storageTypeId),
    enabled: !!storageTypeId,
  });
};

export const useStructureMutation = (storageTypeId: number) => {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: api.createStructure,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["structure", storageTypeId] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateStructure(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["structure", storageTypeId] }),
  });

  const remove = useMutation({
    mutationFn: api.deleteStructure,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["structure", storageTypeId] }),
  });

  return { create, update, remove };
};

/* ----------------------------------------------------
   Location Hooks
   ---------------------------------------------------- */
export const useLocations = (storageTypeId: number) => {
  return useQuery({
    queryKey: ["locations", storageTypeId],
    queryFn: () => api.getLocations(storageTypeId),
    enabled: !!storageTypeId,
  });
};

export const useLocationMutation = (storageTypeId: number) => {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: api.createLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations", storageTypeId] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateLocation(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations", storageTypeId] }),
  });

  const remove = useMutation({
    mutationFn: api.deleteLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations", storageTypeId] }),
  });

  return { create, update, remove };
};
