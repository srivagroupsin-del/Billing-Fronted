import { useState } from "react";
import StorageSection from "./StorageSection";
import AddressFieldsSection from "./AddressFieldsSection";
import AddressValuesSection from "./AddressValuesSection";
import StructureSection from "./StructureSection";
import LocationTreeSection from "./LocationTreeSection";
import "./StorageManagement.css";
import { 
    Database, 
    MapPin,
    Layers, 
    Navigation, 
    ChevronRight,
    ArrowRight,
    X
} from "lucide-react";

const STEPS = [
    { title: "Storage", icon: <Database size={18} /> },
    { title: "Address Setup", icon: <MapPin size={18} /> },
    { title: "Structure Design", icon: <Layers size={18} /> },
    { title: "Location Builder", icon: <Navigation size={18} /> }
];

const StorageManagement = () => {
    const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null);
    const [selectedStorageName, setSelectedStorageName] = useState<string>("");
    const [activeStep, setActiveStep] = useState(0);
    const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

    const handleSelectStorage = (id: number, name: string) => {
        setSelectedStorageId(id);
        setSelectedStorageName(name);
        if (activeStep === 0) setActiveStep(1);
    };

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    return (
        <div className="sm-container">
            {toast && (
                <div className={`sm-toast ${toast.type}`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)}><X size={14} /></button>
                </div>
            )}

            <header className="sm-header">
                <div>
                    <h1 className="sm-title">Storage Management</h1>
                    <p className="sm-subtitle">Configure and build your storage hierarchy</p>
                </div>
                {selectedStorageId && (
                    <div className="sm-storage-badge">
                        <Database size={16} />
                        Active: {selectedStorageName}
                    </div>
                )}
            </header>

            <nav className="sm-stepper">
                {STEPS.map((step, index) => (
                    <button 
                        key={step.title}
                        className={`sm-step ${activeStep === index ? 'active' : ''} ${selectedStorageId && index < activeStep ? 'completed' : ''}`}
                        onClick={() => {
                            if (selectedStorageId || index === 0) {
                                setActiveStep(index);
                            } else {
                                showToast("Please select or create a storage first");
                            }
                        }}
                    >
                        <span className="sm-step-icon">{index + 1}</span>
                        {step.icon}
                        {step.title}
                        {index < STEPS.length - 1 && <ChevronRight size={14} className="sm-chain-arrow" />}
                    </button>
                ))}
            </nav>

            <div className="sm-card">
                <div className="sm-step-content">
                    {activeStep === 0 && (
                        <StorageSection 
                            onSelect={handleSelectStorage} 
                            selectedId={selectedStorageId} 
                        />
                    )}

                    {selectedStorageId ? (
                        <>
                            {activeStep === 1 && (
                                <div className="sm-address-grid">
                                    <AddressFieldsSection storageTypeId={selectedStorageId} showToast={showToast} />
                                    <div className="mt-32">
                                        <AddressValuesSection storageTypeId={selectedStorageId} showToast={showToast} />
                                    </div>
                                </div>
                            )}

                            {activeStep === 2 && (
                                <StructureSection storageTypeId={selectedStorageId} showToast={showToast} />
                            )}

                            {activeStep === 3 && (
                                <LocationTreeSection storageTypeId={selectedStorageId} showToast={showToast} />
                            )}
                        </>
                    ) : activeStep > 0 && (
                        <div className="sm-empty">
                            <Database size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <p>Please select a storage first</p>
                            <button className="sm-btn sm-btn-primary" onClick={() => setActiveStep(0)}>
                                Go to Storage Selection
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedStorageId && activeStep < 3 && (
                <footer className="sm-nav-footer">
                    <button 
                        className="sm-btn sm-btn-secondary" 
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep(prev => prev - 1)}
                    >
                        Previous Step
                    </button>
                    <button 
                        className="sm-btn sm-btn-primary"
                        onClick={() => setActiveStep(prev => prev + 1)}
                    >
                        Next Step: {STEPS[activeStep + 1].title}
                        <ArrowRight size={16} />
                    </button>
                </footer>
            )}
        </div>
    );
};

export default StorageManagement;