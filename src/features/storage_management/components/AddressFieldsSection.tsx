import React, { useState } from "react";
import { 
  Paper, Typography, Button, List, ListItem, 
  ListItemText, Box, TextField, Select, MenuItem, FormControl, InputLabel,
  Divider,
  Stack
} from "@mui/material";
import { Plus } from "lucide-react";
import { useAddressFields, useAddressFieldMutation } from "../hooks/useStorage";
import { CommonModal, ErrorSnackbar } from "./common/CommonComponents";
import type { AddressField } from "../types/storageTypes";

const AddressFieldsSection: React.FC<{ storageTypeId: number | null }> = ({ storageTypeId }) => {
  if (!storageTypeId) return null;

  const { data: fields, isLoading } = useAddressFields(storageTypeId);
  const { create } = useAddressFieldMutation(storageTypeId);

  const [modalOpen, setModalOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [insertAfterId, setInsertAfterId] = useState<number | string>("none");
  const [errorInfo, setErrorInfo] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  // Sorting fields by order
  const sortedFields = [...(fields || [])].sort((a, b) => a.field_order - b.field_order);

  const handleSave = async () => {
    try {
      // Calculate order based on "Insert After" selection
      let order = 1;
      if (insertAfterId !== "none") {
        const afterField = fields?.find((f: AddressField) => f.id === Number(insertAfterId));
        if (afterField) order = afterField.field_order + 1;
      }

      await create.mutateAsync({
        storage_type_id: storageTypeId,
        field_name: fieldName,
        field_order: order
      });
      setModalOpen(false);
      setFieldName("");
      setInsertAfterId("none");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add field";
      setErrorInfo({ open: true, message });
    }
  };

  return (
    <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }} elevation={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">2) Address Fields</Typography>
        <Button 
          startIcon={<Plus size={16} />} 
          variant="contained" 
          size="small"
          onClick={() => setModalOpen(true)}
        >
          Add Field
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List dense sx={{ maxHeight: '300px', overflow: 'auto' }}>
        {sortedFields.map((field: AddressField, idx: number) => (
          <ListItem key={field.id} sx={{ mb: 1, border: '1px dashed #e0e0e0', borderRadius: '4px' }}>
            <ListItemText 
              primary={`${idx + 1}. ${field.field_name}`} 
              secondary={`Order: ${field.field_order}`}
            />
          </ListItem>
        ))}
        {isLoading && <Typography variant="body2">Loading fields...</Typography>}
        {!isLoading && sortedFields.length === 0 && <Typography variant="body2" color="text.secondary">No fields defined yet.</Typography>}
      </List>

      <CommonModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Add Dynamic Address Field"
        onSave={handleSave}
      >
        <Stack spacing={3}>
          <TextField 
            fullWidth 
            label="Field Name" 
            value={fieldName} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldName(e.target.value)} 
            placeholder="e.g. Landmark, Pincode"
            autoFocus
          />

          <FormControl fullWidth>
            <InputLabel>Insert After</InputLabel>
            <Select
              value={insertAfterId}
              label="Insert After"
              onChange={(e: any) => setInsertAfterId(e.target.value)}
            >
              <MenuItem value="none">Beginning (Position 1)</MenuItem>
              {sortedFields.map((f: AddressField) => (
                <MenuItem key={f.id} value={f.id}>{f.field_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </CommonModal>

      <ErrorSnackbar 
        open={errorInfo.open} 
        message={errorInfo.message} 
        onClose={() => setErrorInfo({ ...errorInfo, open: false })}
      />
    </Paper>
  );
};

export default AddressFieldsSection;
