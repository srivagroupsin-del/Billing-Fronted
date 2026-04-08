export interface StorageType {
  id: number;
  name: string;
}

export interface AddressField {
  id: number;
  storage_type_id: number;
  field_name: string;
  field_order: number;
}

export interface AddressValueField {
  field_id: number;
  value: string;
}

export interface AddressValue {
  id: number;
  storage_type_id: number;
  fields: AddressValueField[];
}

export interface StructureLevel {
  id: number;
  storage_type_id: number;
  name: string;
  level_order: number;
  is_partitionable: boolean;
  partition_rows: number;
  partition_columns: number;
}

export interface Location {
  id: number;
  storage_type_id: number;
  parent_id: number | null;
  level_id: number;
  code: string;
  name: string;
  children?: Location[];
}

export type StorageErrorType =
  | 'LOCATION_IN_USE'
  | 'STRUCTURE_IN_USE'
  | 'HAS_CHILDREN'
  | 'INVALID_UPDATE'
  | 'VALIDATION_ERROR';

export interface StorageErrorResponse {
  error_type: StorageErrorType;
  message: string;
}
