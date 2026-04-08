import { useEffect, useState } from "react";
import { getAddressFields, createAddressField, getAddressValues, saveAddressValues } from "../../../api/storage";

const AddressSection = ({ storageId }: { storageId: number }) => {
    const [fields, setFields] = useState<any[]>([]);
    const [values, setValues] = useState<any>({});
    const [newField, setNewField] = useState("");

    const fetchFields = async () => {
        const res = await getAddressFields(storageId);
        setFields(res.data);
    };

    const fetchValues = async () => {
        const res = await getAddressValues(storageId);
        // Assuming values come as object or list
        if (res.data) {
            const valObj = res.data.reduce((acc: any, cur: any) => ({ ...acc, [cur.field_id]: cur.value }), {});
            setValues(valObj);
        }
    };

    useEffect(() => {
        if (storageId) {
            fetchFields();
            fetchValues();
        }
    }, [storageId]);

    const handleAddField = async () => {
        await createAddressField({ storage_type_id: storageId, field_name: newField });
        setNewField("");
        fetchFields();
    };

    const handleSaveValues = async () => {
        const payload = {
            storage_type_id: storageId,
            fields: Object.entries(values).map(([id, val]) => ({ field_id: Number(id), value: String(val) }))
        };
        await saveAddressValues(payload);
        alert("Saved!");
    };

    return (
        <div>
            <h3>Address Setup</h3>
            <input value={newField} onChange={e => setNewField(e.target.value)} placeholder="New address field name" />
            <button onClick={handleAddField}>Add Field</button>

            <div style={{ marginTop: 20 }}>
                {fields.map(f => (
                    <div key={f.id}>
                        {f.field_name}: 
                        <input value={values[f.id] || ""} onChange={e => setValues({ ...values, [f.id]: e.target.value })} />
                    </div>
                ))}
                {fields.length > 0 && <button onClick={handleSaveValues}>Save Values</button>}
            </div>
        </div>
    );
};

export default AddressSection;
