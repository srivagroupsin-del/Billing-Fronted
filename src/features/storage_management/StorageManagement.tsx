import React, { useState } from "react";
import { 
  Box, Container, Grid, Typography, Paper, 
  CssBaseline, ThemeProvider, createTheme,
  Fade,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Breadcrumbs
} from "@mui/material";
import { 
  Warehouse, MapPin, Layers, ChevronRight, 
  Database, HelpCircle
} from "lucide-react";
import WarehouseSection from "./components/WarehouseSection";
import AddressFieldsSection from "./components/AddressFieldsSection";
import AddressValuesSection from "./components/AddressValuesSection";
import StructureSection from "./components/StructureSection";
import LocationTreeSection from "./components/LocationTreeSection";

// Material UI Theme implementation
const storageTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // Classic Blue
    secondary: { main: '#9c27b0' },
    background: { default: '#f5f7fa' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: '8px', fontWeight: 600 }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: '12px' }
      }
    }
  }
});

const StorageManagement: React.FC = () => {
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={storageTheme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          {/* Header Section */}
          <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom color="text.primary">
                Warehouse Configuration & Setup
              </Typography>
              <Breadcrumbs separator={<ChevronRight size={16} />}>
                <Typography variant="body2" color="text.secondary">Inventory</Typography>
                <Typography variant="body2" color="text.secondary">Storage</Typography>
                <Typography variant="body2" color="primary" fontWeight="600">Advanced Management</Typography>
              </Breadcrumbs>
            </Box>
            
            <Tooltip title="Documentation">
              <IconButton><HelpCircle size={20} /></IconButton>
            </Tooltip>
          </Box>

          <Grid container spacing={4}>
            {/* Left Rail: Warehouse Selection */}
            <Grid size={{ xs: 12, md: 3 }}>
              <WarehouseSection 
                onSelect={(id) => {
                  setSelectedStorageId(id);
                  if (activeTab === 0) setActiveTab(1); // Auto-navigate to first config tab
                }} 
                selectedId={selectedStorageId} 
              />
            </Grid>

            {/* Right Content Area: Multi-step Setup */}
            <Grid size={{ xs: 12, md: 9 }}>
              {selectedStorageId ? (
                <Stack spacing={4}>
                  {/* Step Navigation Tabs */}
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    indicatorColor="primary" 
                    textColor="primary"
                    variant="fullWidth"
                    sx={{ bgcolor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    <Tab label="1. Settings & Core" disabled icon={<Warehouse size={18} />} iconPosition="start" />
                    <Tab label="2. Address Setup" icon={<MapPin size={18} />} iconPosition="start" />
                    <Tab label="3. Structure levels" icon={<Layers size={18} />} iconPosition="start" />
                    <Tab label="4. Location Explorer" icon={<Database size={18} />} iconPosition="start" />
                  </Tabs>

                  {/* Tab Panels */}
                  {activeTab === 1 && (
                    <Fade in timeout={500}>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, lg: 5 }}>
                          <AddressFieldsSection storageTypeId={selectedStorageId} />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 7 }}>
                          <AddressValuesSection storageTypeId={selectedStorageId} />
                        </Grid>
                      </Grid>
                    </Fade>
                  )}

                  {activeTab === 2 && (
                    <Fade in timeout={500}>
                       <Box>
                         <StructureSection storageTypeId={selectedStorageId} />
                       </Box>
                    </Fade>
                  )}

                  {activeTab === 3 && (
                    <Fade in timeout={500}>
                      <Box>
                        <LocationTreeSection storageTypeId={selectedStorageId} />
                      </Box>
                    </Fade>
                  )}
                </Stack>
              ) : (
                <Fade in>
                  <Paper 
                    sx={{ 
                      p: 8, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'rgba(25, 118, 210, 0.02)',
                      border: '2px dashed #d1d5db',
                      height: '100%'
                    }}
                    elevation={0}
                  >
                    <Warehouse size={48} style={{ color: '#9ca3af', marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary">
                      No Warehouse Selected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please select a warehouse type from the menu on the left to begin configuration.
                    </Typography>
                  </Paper>
                </Fade>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default StorageManagement;
