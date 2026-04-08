import React, { useState } from "react";
import { 
  Paper, Typography, Button, List, ListItem, ListItemText, ListItemSecondaryAction,
  Box, TextField, Select, MenuItem, FormControl, InputLabel, Divider, Stack,
  IconButton, Checkbox, FormControlLabel, Grid, Chip
} from "@mui/material";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useStructure, useStructureMutation } from "../hooks/useStorage";
import { CommonModal, ConfirmDialog, ErrorSnackbar } from "./common/CommonComponents";
import type { StructureLevel } from "../types/storageTypes";

const StructureSection: React.FC<{ storageTypeId: number | null }> = ({ storageTypeId }) => {
  if (!storageTypeId) return null;

  const { data: structure, isLoading } = useStructure(storageTypeId);
  const { create, update, remove } = useStructureMutation(storageTypeId);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [insertAfterId, setInsertAfterId] = useState<number | string>("none");
  const [isPartitionable, setIsPartitionable] = useState(false);
  const [rows, setRows] = useState<number>(0);
  const [cols, setCols] = useState<number>(0);
  const [errorInfo, setErrorInfo] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const sortedLevels = [...(structure || [])].sort((a, b) => a.level_order - b.level_order);

  const handleOpenModal = (lvl?: StructureLevel) => {
    if (lvl) {
      setEditId(lvl.id);
      setName(lvl.name);
      setInsertAfterId("none");
      setIsPartitionable(lvl.is_partitionable);
      setRows(lvl.partition_rows || 0);
      setCols(lvl.partition_columns || 0);
    } else {
      setEditId(null);
      setName("");
      setInsertAfterId("none");
      setIsPartitionable(false);
      setRows(0);
      setCols(0);
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      let order = 1;
      if (insertAfterId !== "none") {
        const after = structure?.find((s: StructureLevel) => s.id === Number(insertAfterId));
        if (after) order = after.level_order + 1;
      }

      const payload = {
        storage_type_id: storageTypeId,
        name,
        level_order: order,
        is_partitionable: isPartitionable,
        partition_rows: isPartitionable ? Number(rows) : 0,
        partition_columns: isPartitionable ? Number(cols) : 0
      };

      if (editId) {
        await update.mutateAsync({ id: editId, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save level";
      setErrorInfo({ open: true, message });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      setConfirmOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setErrorInfo({ open: true, message });
      setConfirmOpen(false);
    }
  };

  return (
    <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }} elevation={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">4) Structure Levels</Typography>
        <Button 
          startIcon={<Plus size={16} />} 
          variant="contained" 
          size="small"
          onClick={() => handleOpenModal()}
        >
          Add Level
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List dense sx={{ maxHeight: '400px', overflow: 'auto' }}>
        {sortedLevels.map((lvl: StructureLevel, idx: number) => (
          <ListItem key={lvl.id} sx={{ mb: 1,bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <ListItemText 
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label={idx + 1} size="small" variant="outlined" />
                  <Typography variant="subtitle2" fontWeight="600">{lvl.name}</Typography>
                  {lvl.is_partitionable && <Chip label="Partitioned" size="small" color="primary" variant="outlined" />}
                </Box>
              }
              secondary={lvl.is_partitionable ? `Grid: ${lvl.partition_rows} x ${lvl.partition_columns}` : null}
            />
            <ListItemSecondaryAction>
              <IconButton size="small" onClick={() => handleOpenModal(lvl)}><Edit2 size={14} /></IconButton>
              <IconButton size="small" color="error" onClick={() => { setDeleteId(lvl.id); setConfirmOpen(true); }}><Trash2 size={14} /></IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {isLoading && <Typography variant="body2">Loading structure...</Typography>}
        {!isLoading && sortedLevels.length === 0 && <Typography variant="body2" color="text.secondary">No structure defined.</Typography>}
      </List>

      <CommonModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editId ? "Update Structure Level" : "Build Structure Level"}
        onSave={handleSave}
      >
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField 
            fullWidth label="Level Name" 
            value={name} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
            placeholder="e.g. Block, Rack, Floor"
            autoFocus
          />

          {!editId && (
            <FormControl fullWidth>
              <InputLabel>Insert After</InputLabel>
              <Select value={insertAfterId} label="Insert After" onChange={(e: any) => setInsertAfterId(e.target.value)}>
                <MenuItem value="none">Beginning (Position 1)</MenuItem>
                {sortedLevels.map((l: StructureLevel) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Divider />

          <Box>
            <FormControlLabel 
              control={<Checkbox checked={isPartitionable} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPartitionable(e.target.checked)} />} 
              label="Allow Partitions (e.g. Rows & Columns)"
            />
            
            {isPartitionable && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={6}>
                  <TextField 
                    fullWidth type="number" 
                    label="Default Rows" 
                    value={rows} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRows(Number(e.target.value))} 
                  />
                </Grid>
                <Grid size={6}>
                  <TextField 
                    fullWidth type="number" 
                    label="Default Columns" 
                    value={cols} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCols(Number(e.target.value))} 
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </Stack>
      </CommonModal>

      <ConfirmDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleDelete}
        title="Delete Structure Level?"
        message="All child locations within this level will be removed. Products assigned to these locations may be orphaned. Continue?"
      />

      <ErrorSnackbar 
        open={errorInfo.open} 
        message={errorInfo.message} 
        onClose={() => setErrorInfo({ ...errorInfo, open: false })}
      />
    </Paper>
  );
};

export default StructureSection;
