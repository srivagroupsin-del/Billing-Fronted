import { useEffect, useState } from "react";
import { 
    getAddressFields, 
    createAddressField 
} from "../../../api/storage";
import { Hash, PlusCircle, Loader2 } from "lucide-react";

interface Props {
    storageTypeId: number;
    showToast?: (message: string, type?: 'success' | 'error') => void;
}

const AddressFieldsSection = ({ storageTypeId, showToast }: Props) => {
    const [fields, setFields] = useState<any[]>([]);
    const [fieldName, setFieldName] = useState("");
    const [insertAfterId, setInsertAfterId] = useState<number | string>("");
    const [loading, setLoading] = useState(false);

    const fetchFields = async () => {
        setLoading(true);
        try {
            const res = await getAddressFields(storageTypeId);
            // Sort by field_order ascending
            const sorted = (res.data || []).sort((a: any, b: any) => a.field_order - b.field_order);
            setFields(sorted);
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        if(storageTypeId) fetchFields(); 
    }, [storageTypeId]);

    const handleAddField = async () => {
        if (!fieldName) return;
        
        const payload: any = {
            storage_type_id: storageTypeId,
            field_name: fieldName
        };

        // Only send field_order if inserting after a specific field
        if (insertAfterId) {
            const afterIndex = fields.findIndex(f => f.id === Number(insertAfterId));
            if (afterIndex !== -1) {
                // If it's the last one, order+1, else between orders
                payload.field_order = fields[afterIndex].field_order + 0.5;
            }
        }

        try {
            setLoading(true);
            await createAddressField(payload);
            showToast?.("Field added successfully", "success");
            setFieldName("");
            setInsertAfterId("");
            await fetchFields(); // Refresh immediately
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Error adding field";
            showToast?.(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sm-address-fields">
            <header className="sm-section-header">
                <h3>1. Setup <span>Address Fields</span></h3>
            </header>

            <div className="sm-form-grid-2">
                <div className="sm-form-group">
                    <label className="sm-label">Field Name</label>
                    <input 
                        className="sm-input" 
                        value={fieldName} 
                        onChange={e => setFieldName(e.target.value)} 
                        placeholder="e.g. Row, Drawer, Bin"
                        disabled={loading}
                    />
                </div>
                <div className="sm-form-group">
                    <label className="sm-label">Insert After</label>
                    <select 
                        className="sm-select"
                        value={insertAfterId} 
                        onChange={e => setInsertAfterId(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">At the end</option>
                        {fields.map(f => (
                            <option key={f.id} value={f.id}>{f.field_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button className="sm-btn sm-btn-primary" onClick={handleAddField} disabled={loading || !fieldName}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                Add Address Field
            </button>

            <div className="mt-32">
                <label className="sm-label">Format Preview</label>
                <div className="sm-structure-chain">
                    {fields.map((f, i) => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="sm-level-box" style={{ minWidth: 120 }}>
                                <div className="sm-level-top">
                                    <Hash size={10} />
                                    Order: {f.field_order}
                                </div>
                                <div className="sm-level-name">{f.field_name}</div>
                            </div>
                            {i < fields.length - 1 && <span className="sm-chain-arrow">→</span>}
                        </div>
                    ))}
                    {fields.length === 0 && !loading && (
                        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No fields defined yet</p>
                    )}
                    {loading && fields.length === 0 && (
                        <p style={{ color: '#2563eb' }}>Loading fields...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressFieldsSection;
