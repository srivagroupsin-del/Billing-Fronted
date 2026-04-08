import { useEffect, useState } from "react";
import { getStorageTypes, getStructureLevels, getStorageLocations } from "../../../api/storage";
import { Database } from "lucide-react";

interface Props {
    onSelectionChange: (data: any) => void;
    initialData?: any;
}

const StorageSelection = ({ onSelectionChange, initialData }: Props) => {
    const [storageTypes, setStorageTypes] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [selections, setSelections] = useState<any>(initialData || {});
    const [loading, setLoading] = useState(false);
    const [levelOptions, setLevelOptions] = useState<Record<number, any[]>>({});

    useEffect(() => {
        const fetchTypes = async () => {
            const res = await getStorageTypes();
            setStorageTypes(res.data || []);
        };
        fetchTypes();
    }, []);

    const fetchHierarchy = async (storageId: number) => {
        setLoading(true);
        try {
            const res = await getStructureLevels(storageId);
            const sortedLevels = (res.data || []).sort((a: any, b: any) => a.level_order - b.level_order);
            setLevels(sortedLevels);

            // If selecting new storage, clear old levels
            if (String(selections.storage) !== String(storageId)) {
                const newSel = { storage: String(storageId) };
                setSelections(newSel);
                onSelectionChange(newSel);
                setLevelOptions({});
            }

            // Fetch level 1 options
            if (sortedLevels.length > 0) {
                const locRes = await getStorageLocations(storageId);
                // The tree comes from getStorageLocations
                // For a flat selector, we might need a different API or flatten it
                setLevelOptions({ [sortedLevels[0].id]: locRes.data || [] });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selections.storage) {
            fetchHierarchy(Number(selections.storage));
        }
    }, [selections.storage]);

    const handleLevelSelect = async (levelId: number, levelOrder: number, value: string) => {
        const newSel = { ...selections, [`level_${levelOrder}`]: value };

        // Clear deeper levels
        levels.filter(l => l.level_order > levelOrder).forEach(l => {
            delete newSel[`level_${l.level_order}`];
        });

        setSelections(newSel);
        onSelectionChange(newSel);

        // Fetch options for the next level
        const nextLevel = levels.find(l => l.level_order === levelOrder + 1);
        if (nextLevel && value) {
            const currentLevelOptions = levelOptions[levelId] || [];
            const selectedNode = currentLevelOptions.find(n => String(n.id) === String(value));
            if (selectedNode && selectedNode.children) {
                setLevelOptions(prev => ({ ...prev, [nextLevel.id]: selectedNode.children }));
            }
        }
    };

    return (
        <div className="sm-selector">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Select Storage Location</h3>

            <div className="sm-form-group">
                <label className="sm-label">Storage Type</label>
                <div className="storage-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                    {storageTypes.map(type => (
                        <div
                            key={type.id}
                            className={`storage-card ${String(selections.storage) === String(type.id) ? 'selected' : ''}`}
                            style={{ padding: 16, cursor: 'pointer', minHeight: 'auto' }}
                            onClick={() => setSelections({ storage: String(type.id) })}
                        >
                            <div className="card-icon-wrapper" style={{ width: 40, height: 40, marginBottom: 12 }}>
                                <Database size={20} color="white" />
                            </div>
                            <div className="card-title" style={{ fontSize: 14 }}>{type.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {levels.map((level, index) => (
                <div key={level.id} className="sm-form-group" style={{ marginTop: 16 }}>
                    <label className="sm-label">{level.name}</label>
                    <select
                        className="sm-select"
                        value={selections[`level_${level.level_order}`] || ""}
                        onChange={(e) => handleLevelSelect(level.id, level.level_order, e.target.value)}
                        disabled={loading || (index > 0 && !selections[`level_${levels[index - 1].level_order}`])}
                    >
                        <option value="">Select {level.name}</option>
                        {(levelOptions[level.id] || []).map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                </div>
            ))}

            {loading && <p style={{ fontSize: 12, color: '#3b82f6' }}>Loading structure...</p>}
        </div>
    );
};

export default StorageSelection;
