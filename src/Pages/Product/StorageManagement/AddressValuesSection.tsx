import { useEffect, useState } from "react";
import {
    getAddressFields,
    getAddressValues,
    saveAddressValues,
    updateAddressValue
} from "../../../api/storage";
import { Save, CheckCircle, Info, Loader2 } from "lucide-react";

interface Props {
    storageTypeId: number;
    showToast?: (message: string, type?: 'success' | 'error') => void;
}

const AddressValuesSection = ({ storageTypeId, showToast }: Props) => {
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [formValues, setFormValues] = useState<Record<number, string>>({});
    const [editingGroup, setEditingGroup] = useState<number | null>(null);
    const [tempValues, setTempValues] = useState<Record<number, string>>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fieldRes, valueRes] = await Promise.all([
                getAddressFields(storageTypeId),
                getAddressValues(storageTypeId)
            ]);

            const sortedFields = (fieldRes.data || []).sort(
                (a: any, b: any) => a.field_order - b.field_order
            );

            setFields(sortedFields);

            const initialValues: Record<number, string> = {};
            sortedFields.forEach((f: any) => initialValues[f.id] = "");

            setFormValues(initialValues);

            if (valueRes.data && valueRes.data.length > 0) {
                const grouped: any = {};

                valueRes.data.forEach((row: any) => {
                    const groupId = row.address_group_id;
                    if (!grouped[groupId]) {
                        grouped[groupId] = {
                            id: groupId,
                            fields: {},
                            valueIds: {} // fieldId -> rowId
                        };
                    }

                    grouped[groupId].fields[row.field_name] = row.field_value;
                    grouped[groupId].valueIds[row.field_id] = row.id;
                });
                setAddresses(Object.values(grouped));
            }

        } catch (error) {
            console.error("Fetch Data failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGroup = async (addr: any) => {
        setSaving(true);
        try {
            const updates = [];
            for (const field of fields) {
                const newValue = tempValues[field.id];
                const valueId = addr.valueIds[field.id];
                if (valueId && newValue !== addr.fields[field.field_name]) {
                    updates.push(updateAddressValue(valueId, newValue));
                }
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                showToast?.("Address group updated successfully", "success");
                setSavedSuccessfully(true);
                setTimeout(() => setSavedSuccessfully(false), 3000);
            }
            setEditingGroup(null);
            setTimeout(() => {
                fetchData();
            }, 300);
        } catch (error) {
            console.error("Update Group Error", error);
            showToast?.("Failed to update some address fields.", 'error');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (storageTypeId) fetchData();
    }, [storageTypeId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                storage_type_id: storageTypeId,
                fields: Object.entries(formValues)
                    .filter(([_, val]) => val !== undefined && val !== null)
                    .map(([fid, val]) => ({
                        field_id: Number(fid),
                        value: String(val).trim()
                    }))
                    .filter(f => f.value !== "") // 🔥 IMPORTANT
            };

            if (payload.fields.length === 0) {
                showToast?.("Please enter at least one value", "error");
                return;
            }

            await saveAddressValues(payload);
            showToast?.("Address saved successfully", "success");
            setSavedSuccessfully(true);
            await fetchData(); // Refetch after save to sync UI
            setTimeout(() => setSavedSuccessfully(false), 3000);
        } catch (error: any) {
            console.error("Save Error", error);
            const msg = error?.response?.data?.message || "DUPLICATE_ENTRY" || "Save failed";
            showToast?.(msg === "DUPLICATE_ENTRY" ? "Duplicate Code/Address detected" : msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading && fields.length === 0) {
        return (
            <div className="sm-address-values empty">
                <Loader2 className="animate-spin" size={24} color="#3b82f6" />
                <p style={{ marginTop: 12 }}>Loading address configuration...</p>
            </div>
        );
    }

    if (fields.length === 0 && !loading) {
        return (
            <div className="sm-address-values empty">
                <div className="sm-form-footer" style={{ border: 'none', justifyContent: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: 13, background: '#f8fafc', padding: '10px 20px', borderRadius: 12 }}>
                        <Info size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Define address fields (Step 1) to start filling values
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="sm-address-values">
            <header className="sm-section-header">
                <h3>2. Setup <span>Address Values</span></h3>
            </header>

            <div className="sm-form-grid-2">
                {fields.map(f => (
                    <div key={f.id} className="sm-form-group">
                        <label className="sm-label">{f.field_name}</label>
                        <input
                            className="sm-input"
                            value={formValues[f.id] || ""}
                            onChange={e =>
                                setFormValues({ ...formValues, [f.id]: e.target.value })
                            }
                            disabled={saving}
                        />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 32 }}>
                <h4 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} color="#10b981" />
                    Saved Address Groups
                </h4>

                <div className="sm-address-list">
                    {addresses.map((addr: any) => {
                        const isEditing = editingGroup === addr.id;

                        return (
                            <div key={addr.id} className={`sm-address-card ${isEditing ? 'editing' : ''}`} style={{
                                border: "1px solid #e2e8f0",
                                padding: 16,
                                borderRadius: 12,
                                marginBottom: 12,
                                background: isEditing ? '#f8fafc' : 'white',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, flex: 1 }}>
                                        {fields.map(f => {
                                            const val = addr.fields[f.field_name] || "";
                                            // Handle update logic needs field_id. The addresses data seems to have field_name.
                                            // I need to map field_name back to field_id or ensure the API returns it.
                                            // Looking at the fetchData, row.field_name is used.
                                            // Let's assume the API returns enough info or we find by name.
                                            return (
                                                <div key={f.id}>
                                                    <label className="sm-label" style={{ fontSize: 11, color: '#64748b' }}>{f.field_name}</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="sm-input"
                                                            style={{ padding: '4px 8px', height: 32 }}
                                                            value={tempValues[f.id] || ""}
                                                            onChange={(e) => setTempValues({ ...tempValues, [f.id]: e.target.value })}
                                                        />
                                                    ) : (
                                                        <p style={{ fontSize: 13, fontWeight: 500 }}>{val || '—'}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ marginLeft: 16 }}>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    className="sm-btn sm-btn-primary"
                                                    style={{ padding: '6px 12px', height: 'auto', fontSize: 12 }}
                                                    onClick={() => handleUpdateGroup(addr)}
                                                    disabled={saving}
                                                >
                                                    {saving ? <Loader2 className="animate-spin" size={14} /> : "Save"}
                                                </button>
                                                <button
                                                    className="sm-btn sm-btn-secondary"
                                                    style={{ padding: '6px 12px', height: 'auto', fontSize: 12 }}
                                                    onClick={() => setEditingGroup(null)}
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="sm-btn sm-btn-secondary"
                                                style={{ padding: '6px 12px', height: 'auto', fontSize: 12 }}
                                                onClick={() => {
                                                    setEditingGroup(addr.id);
                                                    const initial: Record<number, string> = {};
                                                    fields.forEach(f => initial[f.id] = addr.fields[f.field_name]);
                                                    setTempValues(initial);
                                                }}
                                                disabled={saving}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <footer className="sm-form-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {savedSuccessfully && (
                        <div className="sm-badge text-green" style={{ background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={14} />
                            Saved Successfully
                        </div>
                    )}
                </div>
                <button
                    className="sm-btn sm-btn-primary"
                    onClick={handleSave}
                    disabled={saving || loading}
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {"Save Address"}

                </button>
            </footer>
        </div>
    );
};

export default AddressValuesSection;
