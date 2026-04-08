import React, { useEffect, useState } from "react";
import { getStorageTypes, getStructureLevels, getStorageLocations } from "../../../api/storage";
import { Database, MapPin, Layers, Box, AlertCircle } from "lucide-react";

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
    const [allLocations, setAllLocations] = useState<any[]>([]);
    const [selectedRowColGroup, setSelectedRowColGroup] = useState<any>(null);

    const flattenLocations = (nodes: any[], result: any[] = []) => {
        nodes.forEach((node: any) => {
            result.push(node);
            if (node.children) flattenLocations(node.children, result);
        });
        return result;
    };

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

            if (String(selections.storage) !== String(storageId)) {
                const newSel = { storage: String(storageId) };
                setSelections(newSel);
                onSelectionChange(newSel);
                setLevelOptions({});
                setSelectedRowColGroup(null);
            }

            const locRes = await getStorageLocations(storageId);
            const flat = flattenLocations(locRes.data || []);
            setAllLocations(flat);

            if (sortedLevels.length > 0) {
                const rootOptions = flat.filter((l: any) => l.parent_id === null || l.parent_id === 0);
                setLevelOptions({ [sortedLevels[0].id]: rootOptions });
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

    const handleLevelSelect = async (levelOrder: number, value: string) => {
        const newSel = { ...selections, [`level_${levelOrder}`]: value };

        levels.filter(l => l.level_order > levelOrder).forEach(l => {
            delete newSel[`level_${l.level_order}`];
            if (l.is_partitionable) {
                setSelectedRowColGroup(null);
            }
        });

        setSelections(newSel);
        onSelectionChange(newSel);

        const nextLevel = levels.find(l => l.level_order === levelOrder + 1);
        if (nextLevel && value) {
            let options = allLocations.filter(l => String(l.parent_id) === String(value));
            setLevelOptions(prev => ({ ...prev, [nextLevel.id]: options }));
        }
    };

    return (
        <div className="sm-selector animate-fade-in">
            <div className="form-section-title" style={{ border: 'none', marginBottom: '1.5rem', padding: 0 }}>
                <MapPin size={22} className="text-primary" />
                <span>Storage Configuration</span>
            </div>

            <div className="sm-form-group">
                <label className="sm-label">1. Choose Storage Type</label>
                <div className="storage-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                    {storageTypes.map(type => (
                        <div
                            key={type.id}
                            className={`storage-card ${String(selections.storage) === String(type.id) ? 'selected' : ''}`}
                            onClick={() => setSelections({ storage: String(type.id) })}
                            style={{ margin: 0 }}
                        >
                            <div className="card-icon-wrapper" style={{ width: 44, height: 44, marginBottom: 12 }}>
                                <Database size={22} color="white" />
                            </div>
                            <div className="card-title" style={{ fontSize: '0.9rem' }}>{type.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {levels.length > 0 && (
                <div className="levels-container" style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-section-title" style={{ border: 'none', margin: 0, fontSize: '1.1rem', padding: 0 }}>
                        <Layers size={18} className="text-primary" />
                        <span>Define Location Path</span>
                    </div>

                    <div className="levels-grid-responsive">
                        {levels.map((level, index) => {
                            const options = levelOptions[level.id] || [];

                            if (level.is_partitionable) {
                                const rowColValues = allLocations.filter(l => String(l.parent_id) === String(selectedRowColGroup?.id));

                                return (
                                    <React.Fragment key={level.id}>
                                        <div className="sm-form-group" style={{ margin: 0 }}>
                                            <label className="sm-label">{level.name} Group</label>
                                            <div className="input-with-icon">
                                                <Layers className="input-icon" size={18} style={{ left: '1rem' }} />
                                                <select
                                                    className="sm-select"
                                                    value={selectedRowColGroup?.id || ""}
                                                    onChange={(e) => {
                                                        const group = allLocations.find(l => String(l.id) === String(e.target.value));
                                                        setSelectedRowColGroup(group);
                                                        const newSel = { ...selections };
                                                        delete newSel[`level_${level.level_order}`];
                                                        setSelections(newSel);
                                                        onSelectionChange(newSel);
                                                    }}
                                                    disabled={loading || (index > 0 && !selections[`level_${levels[index - 1].level_order}`])}
                                                    style={{ paddingLeft: '2.75rem' }}
                                                >
                                                    <option value="">Select Group</option>
                                                    {options.map(g => (
                                                        <option key={g.id} value={g.id}>{g.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-form-group" style={{ margin: 0 }}>
                                            <label className="sm-label">{level.name} Value</label>
                                            <div className="input-with-icon">
                                                <Box className="input-icon" size={18} style={{ left: '1rem' }} />
                                                <select
                                                    className="sm-select"
                                                    value={selections[`level_${level.level_order}`] || ""}
                                                    onChange={(e) => {
                                                        handleLevelSelect(level.level_order, e.target.value);
                                                    }}
                                                    disabled={!selectedRowColGroup || loading}
                                                    style={{ paddingLeft: '2.75rem' }}
                                                >
                                                    <option value="">Select Value</option>
                                                    {rowColValues.map(v => (
                                                        <option key={v.id} value={v.id}>{v.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            }

                            return (
                                <div key={level.id} className="sm-form-group" style={{ margin: 0 }}>
                                    <label className="sm-label">{level.name}</label>
                                    <div className="input-with-icon">
                                        <Layers className="input-icon" size={18} style={{ left: '1rem' }} />
                                        <select
                                            className="sm-select"
                                            value={selections[`level_${level.level_order}`] || ""}
                                            onChange={(e) => handleLevelSelect(level.level_order, e.target.value)}
                                            disabled={loading || (index > 0 && !selections[`level_${levels[index - 1].level_order}`])}
                                            style={{ paddingLeft: '2.75rem' }}
                                        >
                                            <option value="">Select {level.name}</option>
                                            {options.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid', borderRadius: '50%', borderTopColor: 'transparent' }} />
                    Loading configuration...
                </div>
            )}

            {!loading && selections.storage && levels.length === 0 && (
                <div style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                    <AlertCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>No structure defined for this storage type.</p>
                </div>
            )}
        </div>
    );
};

export default StorageSelection;
