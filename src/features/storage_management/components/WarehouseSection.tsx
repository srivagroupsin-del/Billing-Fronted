import React, { useState } from "react";
import { 
  Paper, Typography, Button, List, ListItem, 
  ListItemText, IconButton, Box, TextField,
  Divider, 
  Stack
} from "@mui/material";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useWarehouses, useWarehouseMutation } from "../hooks/useStorage";
import { CommonModal, ConfirmDialog, ErrorSnackbar } from "./common/CommonComponents";
import type { StorageType } from "../types/storageTypes";

const WarehouseSection: React.FC<{ onSelect: (id: number) => void; selectedId: number | null }> = ({ onSelect, selectedId }) => {
  const { data: warehouses, isLoading } = useWarehouses();
  const { create, update, remove } = useWarehouseMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const handleOpenModal = (wh?: StorageType) => {
    if (wh) {
      setEditId(wh.id);
      setName(wh.name);
    } else {
      setEditId(null);
      setName("");
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, data: { name } });
      } else {
        await create.mutateAsync({ name });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save warehouse";
      setErrorInfo({ open: true, message });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      setConfirmOpen(false);
    } catch (err: unknown) {
      let msg = "Delete failed";
      if ((err as any)?.error_type === "STRUCTURE_IN_USE") msg = "Cannot delete warehouse. Structure levels exist.";
      setErrorInfo({ open: true, message: msg });
      setConfirmOpen(false);
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%', border: '1px solid #e0e0e0' }} elevation={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">1) Warehouses</Typography>
        <Button 
          startIcon={<Plus size={16} />} 
          variant="contained" 
          size="small"
          onClick={() => handleOpenModal()}
        >
          Add
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />

      <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
        {warehouses?.map((wh: StorageType) => (
          <ListItem 
            key={wh.id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={() => handleOpenModal(wh)}><Edit2 size={14} /></IconButton>
                <IconButton size="small" color="error" onClick={() => { setDeleteId(wh.id); setConfirmOpen(true); }}><Trash2 size={14} /></IconButton>
              </Stack>
            }
            disablePadding
          >
            <ListItemText 
              primary={
                <Button 
                  fullWidth 
                  variant={selectedId === wh.id ? "contained" : "text"}
                  onClick={() => onSelect(wh.id)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1 }}
                >
                  {wh.name}
                </Button>
              }
            />
          </ListItem>
        ))}
        {isLoading && <Typography variant="body2" sx={{ p: 2 }}>Loading...</Typography>}
        {!isLoading && warehouses?.length === 0 && <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>No warehouses found.</Typography>}
      </List>

      <CommonModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editId ? "Edit Warehouse" : "Add Warehouse"}
        onSave={handleSave}
      >
        <TextField 
          fullWidth 
          label="Warehouse Name" 
          value={name} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
          placeholder="e.g. Main Warehouse"
          variant="outlined"
          autoFocus
        />
      </CommonModal>

      <ConfirmDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleDelete}
        title="Delete Warehouse?"
        message="This will permanently remove this warehouse type. Continue?"
      />

      <ErrorSnackbar 
        open={errorInfo.open} 
        message={errorInfo.message} 
        onClose={() => setErrorInfo({ ...errorInfo, open: false })}
      />
    </Paper>
  );
};

export default WarehouseSection;
