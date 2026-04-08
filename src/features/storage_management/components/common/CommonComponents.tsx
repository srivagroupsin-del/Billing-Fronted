import React from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  IconButton, 
  Typography,
  Snackbar,
  Alert
} from "@mui/material";
import { X } from "lucide-react";

/* ----------------------------------------------------
   1) Reusable Modal Component
   ---------------------------------------------------- */
interface CommonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const CommonModal: React.FC<CommonModalProps> = ({ 
  open, onClose, title, children, onSave, 
  saveLabel = "Save", cancelLabel = "Cancel",
  maxWidth = 'sm'
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h6">{title}</Typography>
      <IconButton onClick={onClose}><X size={20} /></IconButton>
    </DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="inherit">{cancelLabel}</Button>
      {onSave && (
        <Button onClick={onSave} variant="contained" color="primary">{saveLabel}</Button>
      )}
    </DialogActions>
  </Dialog>
);

/* ----------------------------------------------------
   2) Reusable Confirm Dialog
   ---------------------------------------------------- */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  open, onClose, onConfirm, title, message 
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>No</Button>
      <Button onClick={onConfirm} color="error" variant="contained">Yes, Delete</Button>
    </DialogActions>
  </Dialog>
);

/* ----------------------------------------------------
   3) Global Error Snackbar
   ---------------------------------------------------- */
interface ErrorSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
  severity?: 'error' | 'warning' | 'info' | 'success';
}

export const ErrorSnackbar: React.FC<ErrorSnackbarProps> = ({ 
  open, message, onClose, severity = 'error' 
}) => (
  <Snackbar 
    open={open} 
    autoHideDuration={6000} 
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);
