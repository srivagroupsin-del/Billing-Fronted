import { useEffect, useState } from "react";
import { 
    getStorageTypes, 
    createStorageType, 
    updateStorageType, 
    deleteStorageType 
} from "../../../api/storage";
import { Plus, Edit2, Trash2, Database } from "lucide-react";

interface StorageSectionProps {
    onSelect: (id: number, name: string) => void;
    selectedId: number | null;
}

const StorageSection = ({ onSelect, selectedId }: StorageSectionProps) => {
    const [storages, setStorages] = useState<any[]>([]);
    const [modal, setModal] = useState<{ open: boolean, data?: any }>({ open: false });
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await getStorageTypes();
            setStorages(res.data || []);
        } catch (error) {
            console.error("Failed to fetch storage types", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const handleSave = async () => {
        if (!name) return;
        try {
            if (modal.data) {
                await updateStorageType(modal.data.id, { name });
            } else {
                await createStorageType({ name });
            }
            setModal({ open: false });
            setName("");
            fetch();
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This may fail if levels exist.")) return;
        try {
            await deleteStorageType(id);
            fetch();
        } catch (error) {
            alert("Cannot delete. Check console for details.");
        }
    };

    const openModal = (data?: any) => {
        setModal({ open: true, data });
        setName(data ? data.name : "");
    };

    return (
        <div className="sm-storage-section">
            <header className="sm-section-header">
                <h3>Select <span>Storage</span></h3>
                <button className="sm-btn sm-btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    New Storage
                </button>
            </header>

            <div className="sm-list">
                {storages.map(s => (
                    <div 
                        key={s.id} 
                        className={`sm-list-item ${selectedId === s.id ? 'active-border' : ''}`}
                    >
                        <div className="sm-item-info" onClick={() => onSelect(s.id, s.name)}>
                            <Database size={20} color={selectedId === s.id ? "#2563eb" : "#94a3b8"} />
                            <span className="sm-item-name">{s.name}</span>
                            {selectedId === s.id && <span className="sm-badge">Active</span>}
                        </div>
                        <div className="sm-item-actions">
                            <button className="sm-btn-icon" onClick={() => openModal(s)} title="Edit">
                                <Edit2 size={16} />
                            </button>
                            <button className="sm-btn-icon text-red" onClick={() => handleDelete(s.id)} title="Delete">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {!loading && storages.length === 0 && (
                    <div className="sm-empty">
                        <Database size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                        <p>No storage types created yet.</p>
                        <button className="sm-btn sm-btn-secondary" onClick={() => openModal()}>
                            Add First Storage
                        </button>
                    </div>
                )}
            </div>

            {modal.open && (
                <div className="sm-modal-overlay" onClick={() => setModal({ open: false })}>
                    <div className="sm-modal" onClick={e => e.stopPropagation()}>
                        <h2 className="sm-modal-title">{modal.data ? "Edit" : "Create"} Storage</h2>
                        <div className="sm-form-group">
                            <label className="sm-label">Storage Name</label>
                            <input 
                                className="sm-input" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                autoFocus
                                placeholder="e.g. Rack System, Warehouse Block"
                            />
                        </div>
                        <div className="sm-modal-footer">
                            <button className="sm-btn sm-btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
                            <button className="sm-btn sm-btn-primary" onClick={handleSave}>
                                {modal.data ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageSection;
