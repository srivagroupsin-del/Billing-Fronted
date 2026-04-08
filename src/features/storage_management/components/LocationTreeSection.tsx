import React, { useState } from "react";
import { 
  Paper, Typography, Button, Box, Collapse, List, 
  ListItem, ListItemText, IconButton, Divider, Stack,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Alert
} from "@mui/material";
import { 
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, 
  Home, Box as BoxIcon, Layers
} from "lucide-react";
import { useLocations, useLocationMutation, useStructure } from "../hooks/useStorage";
import { CommonModal, ConfirmDialog, ErrorSnackbar } from "./common/CommonComponents";
import type { Location, StructureLevel } from "../types/storageTypes";

// Recursive Tree Node Component
const TreeNode: React.FC<{ 
  node: any; 
  onAddChild: (node: any) => void;
  onEdit: (node: any) => void;
  onDelete: (id: number) => void;
  depth?: number;
}> = ({ node, onAddChild, onEdit, onDelete, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 1); // Expand first level by default
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <ListItem 
        sx={{ 
          pl: depth * 3 + 1, 
          py: 0.5,
          borderBottom: '1px solid #f0f0f0',
          '&:hover .actions': { opacity: 1 },
          bgcolor: open ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
        }}
        disablePadding
      >
        <IconButton size="small" onClick={() => setOpen(!open)} sx={{ visibility: hasChildren ? 'visible' : 'hidden' }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </IconButton>
        
        <Box display="flex" alignItems="center" gap={1.5} flex={1}>
           <BoxIcon size={16} color="#1976d2" />
           <ListItemText 
            primary={node.name} 
            secondary={node.code} 
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </Box>

        <Box className="actions" sx={{ opacity: 0, transition: '0.2s', display: 'flex', gap: 0.5, mr: 1 }}>
          <IconButton size="small" color="primary" onClick={() => onAddChild(node)} title="Add Child"><Plus size={14} /></IconButton>
          <IconButton size="small" onClick={() => onEdit(node)} title="Edit"><Edit2 size={12} /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(node.id)} title="Delete"><Trash2 size={12} /></IconButton>
        </Box>
      </ListItem>
      
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map((child: any) => (
              <TreeNode 
                key={child.id} 
                node={child} 
                onAddChild={onAddChild} 
                onEdit={onEdit} 
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const LocationTreeSection: React.FC<{ storageTypeId: number | null }> = ({ storageTypeId }) => {
  if (!storageTypeId) return null;

  const { data: locations, isLoading } = useLocations(storageTypeId);
  const { data: structure } = useStructure(storageTypeId);
  const { create, update, remove } = useLocationMutation(storageTypeId);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [parentId, setParentId] = useState<number | null>(null);
  const [levelId, setLevelId] = useState<number | string>("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [errorInfo, setErrorInfo] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const buildTree = (list: Location[]) => {
    const map: any = {};
    const tree: any[] = [];
    list.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });
    list.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });
    return tree;
  };

  const treeData = buildTree(locations || []);

  const handleOpenAdd = (parent?: any) => {
    setEditId(null);
    setName("");
    setCode("");
    setParentId(parent ? parent.id : null);
    
    // Auto-select next level id if possible
    if (parent) {
      const parentLvl = structure?.find((s: StructureLevel) => s.id === parent.level_id);
      if (parentLvl) {
        const nextLvl = structure?.find((s: StructureLevel) => s.level_order === parentLvl.level_order + 1);
        if (nextLvl) setLevelId(nextLvl.id);
      }
    } else if (structure && structure.length > 0) {
      const firstLvl = [...structure].sort((a,b) => a.level_order - b.level_order)[0];
      setLevelId(firstLvl.id);
    }

    setModalOpen(true);
  };

  const handleOpenEdit = (node: any) => {
    setEditId(node.id);
    setName(node.name);
    setCode(node.code);
    setParentId(node.parent_id);
    setLevelId(node.level_id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        storage_type_id: storageTypeId,
        parent_id: parentId,
        level_id: Number(levelId),
        name,
        code
      };

      if (editId) {
        await update.mutateAsync({ id: editId, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save location";
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
      const errorData = err as any;
      if (errorData.error_type === "LOCATION_IN_USE") msg = "Locations cannot be deleted if products are assigned.";
      if (errorData.error_type === "HAS_CHILDREN") msg = "Delete child locations first.";
      setErrorInfo({ open: true, message: msg });
      setConfirmOpen(false);
    }
  };

  return (
    <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }} elevation={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">5) Location Tree</Typography>
        <Button 
          startIcon={<Plus size={16} />} 
          variant="contained" 
          size="small"
          onClick={() => handleOpenAdd()}
          disabled={!structure || structure.length === 0}
        >
          Add Root
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List dense sx={{ maxHeight: '600px', overflow: 'auto', bgcolor: '#fff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
        {treeData.map(node => (
          <TreeNode 
            key={node.id} 
            node={node} 
            onAddChild={handleOpenAdd} 
            onEdit={handleOpenEdit} 
            onDelete={(id: number) => { setDeleteId(id); setConfirmOpen(true); }}
          />
        ))}
        {isLoading && <Typography variant="body2" sx={{ p: 2 }}>Loading tree...</Typography>}
        {!isLoading && treeData.length === 0 && (
          <Box p={4} textAlign="center" color="text.secondary">
            <Layers size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <Typography variant="body2">No locations found. Add your first root location (e.g. Block A).</Typography>
          </Box>
        )}
      </List>

      <CommonModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editId ? "Edit Location" : "Add New Location"}
        onSave={handleSave}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {parentId && (
             <Alert severity="info" icon={<Home size={18} />}>
               Parent: {locations?.find((l: Location) => l.id === parentId)?.name}
             </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Target Level</InputLabel>
            <Select 
              value={levelId} 
              label="Target Level" 
              onChange={(e: any) => setLevelId(e.target.value)}
            >
              {structure?.map((l: StructureLevel) => (
                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField 
            fullWidth label="Location Name" 
            value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
            placeholder="e.g. Rack-1, Shelf-A"
            autoFocus
          />

          <TextField 
            fullWidth label="Location Code" 
            value={code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} 
            placeholder="e.g. R1-S A"
          />
        </Stack>
      </CommonModal>

      <ConfirmDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleDelete}
        title="Delete Location?"
        message="This will remove the location and ALL its child structures. This operation is permanent. Continue?"
      />

      <ErrorSnackbar 
        open={errorInfo.open} 
        message={errorInfo.message} 
        onClose={() => setErrorInfo({ ...errorInfo, open: false })}
      />
    </Paper>
  );
};

export default LocationTreeSection;
