import { 
  Paper, Typography, Button, TextField, Box, 
  Card, CardContent, Stack, IconButton, Grid, Alert
} from "@mui/material";
import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useAddressFields, useAddressValues, useAddressValueMutation } from "../hooks/useStorage";
import { CommonModal, ConfirmDialog, ErrorSnackbar } from "./common/CommonComponents";
import type { AddressValue } from "../types/storageTypes";

const AddressValuesSection: React.FC<{ storageTypeId: number | null }> = ({ storageTypeId }) => {
  if (!storageTypeId) return null;

  const { data: fields } = useAddressFields(storageTypeId);
  const { data: values, isLoading } = useAddressValues(storageTypeId);
  const { create, update, remove } = useAddressValueMutation(storageTypeId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<number, string>>({});
  const [errorInfo, setErrorInfo] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const getFieldLabel = (id: number) => fields?.find((f: any) => f.id === id)?.field_name || `Field ${id}`;

  const handleOpenForm = (val?: any) => {
    if (val) {
      setEditingId(val.id);
      const res: Record<number, string> = {};
      val.fields.forEach((f: any) => (res[f.field_id] = f.value));
      setFormData(res);
    } else {
      setEditingId(null);
      setFormData({});
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        storage_type_id: storageTypeId,
        fields: Object.entries(formData).map(([id, val]) => ({
          field_id: Number(id),
          value: val
        }))
      };

      if (editingId) {
        await update.mutateAsync({ id: editingId, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch (err: any) {
      setErrorInfo({ open: true, message: err.message || "Failed to save address details" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      setConfirmOpen(false);
    } catch (err: any) {
      setErrorInfo({ open: true, message: err.message || "Delete failed" });
      setConfirmOpen(false);
    }
  };

  return (
    <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }} elevation={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">3) Address Details</Typography>
        <Button 
          startIcon={<Plus size={16} />} 
          variant="outlined" 
          size="small"
          onClick={() => handleOpenForm()}
          disabled={!fields || fields.length === 0}
        >
          New Address
        </Button>
      </Box>

      {(!fields || fields.length === 0) && (
        <Alert severity="info">Please define Address Fields first.</Alert>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {values?.map((v: AddressValue) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={v.id}>
            <Card variant="outlined" sx={{ position: 'relative', '&:hover .actions': { opacity: 1 } }}>
              <Box className="actions" sx={{ position: 'absolute', top: 5, right: 5, opacity: 0, transition: '0.2s', display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => handleOpenForm(v)} sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}><Edit2 size={12} /></IconButton>
                <IconButton size="small" color="error" onClick={() => { setDeleteId(v.id); setConfirmOpen(true); }} sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}><Trash2 size={12} /></IconButton>
              </Box>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack spacing={0.5}>
                  {v.fields.map((f: any) => (
                    <Box key={f.field_id} display="flex" gap={1}>
                      <Typography variant="body2" fontWeight="600" color="text.secondary" sx={{ minWidth: '80px' }}>
                        {getFieldLabel(f.field_id)}:
                      </Typography>
                      <Typography variant="body2">{f.value || "-"}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {isLoading && <Typography variant="body2" sx={{ p: 2 }}>Loading...</Typography>}
      {!isLoading && values?.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No addresses saved yet.</Typography>}

      <CommonModal 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        title={editingId ? "Update Address Details" : "New Address Details"}
        onSave={handleSave}
        saveLabel={editingId ? "Update" : "Save"}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {fields?.map((f: any) => (
            <TextField 
              key={f.id}
              fullWidth
              label={f.field_name}
              value={formData[f.id] || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, [f.id]: e.target.value }))}
              placeholder={`Enter ${f.field_name}`}
              variant="outlined"
            />
          ))}
        </Stack>
      </CommonModal>

      <ConfirmDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleDelete}
        title="Delete Address?"
        message="This action cannot be undone. Products linked to this address may be affected."
      />

      <ErrorSnackbar 
        open={errorInfo.open} 
        message={errorInfo.message} 
        onClose={() => setErrorInfo({ ...errorInfo, open: false })}
      />
    </Paper>
  );
};

export default AddressValuesSection;
