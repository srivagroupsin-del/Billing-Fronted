import { useEffect, useState } from "react";
import {
    getStructureLevels,
    createStructureLevel,
    updateStructureLevel,
    deleteStructureLevel,
    updateStructureOrder,
    getStorageLocations
} from "../../../api/storage";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Trash2, ArrowRight, Layers } from "lucide-react";

interface Props {
    storageTypeId: number;
    showToast?: (message: string, type?: 'success' | 'error') => void;
}

const SortableItem = ({ level, onDelete, onRename }: { level: any, onDelete: (id: number) => void, onRename: (level: any) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: level.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="sm-level-box">
            <div className="sm-level-top">
                <span {...attributes} {...listeners} style={{ cursor: 'grab', padding: '4px' }}>
                    <GripVertical size={14} />
                </span>
                Level: {level.level_order}
            </div>
            <div className="sm-level-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {level.name}
            </div>
            {level.is_partitionable && <div className="sm-level-meta">Partitionable</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="sm-btn sm-btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onRename(level)}>Rename</button>
                <button className="sm-btn-icon text-red" onClick={() => onDelete(level.id)}>
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

const StructureSection = ({ storageTypeId, showToast }: Props) => {
    const [levels, setLevels] = useState<any[]>([]);
    const [levelName, setLevelName] = useState("");
    const [isPartitionable, setIsPartitionable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingLevel, setEditingLevel] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await getStructureLevels(storageTypeId);
            setLevels(res.data.sort((a: any, b: any) => a.level_order - b.level_order) || []);
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, [storageTypeId]);

    const handleAdd = async () => {
        if (!levelName) return;
        try {
            await createStructureLevel({
                storage_type_id: storageTypeId,
                name: levelName,
                level_order: levels.length + 1,
                parent_id: null,
                is_partitionable: isPartitionable
            });
            setLevelName("");
            setIsPartitionable(false);
            showToast?.("Level added successfully", "success");
            fetch();
        } catch (error) {
            showToast?.("Error adding level", 'error');
        }
    };

    const handleRename = async () => {
        if (!editingLevel || !levelName) return;
        try {
            await updateStructureLevel(editingLevel.id, { name: levelName });
            showToast?.("Renamed successfully", "success");
            setEditingLevel(null);
            setLevelName("");
            fetch();
        } catch (error: any) {
            showToast?.(error?.response?.data?.message || "Rename failed", 'error');
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = levels.findIndex(i => i.id === active.id);
        const newIndex = levels.findIndex(i => i.id === over.id);

        const newArray = arrayMove(levels, oldIndex, newIndex);

        const updatedArray = newArray.map((l, i) => ({
            id: l.id,
            level_order: i + 1
        }));

        // ✅ UI update first (smooth)
        setLevels(newArray);

        try {
            // ✅ CALL CORRECT API (ONLY ONCE)
            await updateStructureOrder({
                structure: updatedArray
            });
            await getStorageLocations(storageTypeId);

        } catch (error) {
            console.error("DRAG ERROR", error);
            fetch(); // rollback
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? Cannot delete if locations already exist for this level.")) return;
        try {
            await deleteStructureLevel(id);
            showToast?.("Deleted successfully", "success");
            fetch();
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Delete failed";
            showToast?.(msg, 'error');
        }
    };

    return (
        <div className="sm-structure-section">
            <header className="sm-section-header">
                <h3>3. Structure <span>Design</span></h3>
            </header>

            <div className="sm-form-group">
                <label className="sm-label">{editingLevel ? `Rename Level: ${editingLevel.name}` : 'Add Structure Level'}</label>
                <div className="sm-field-row" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <input
                            className="sm-input"
                            value={levelName}
                            onChange={e => setLevelName(e.target.value)}
                            placeholder="e.g. Block, Building, Floor, Rack"
                            autoFocus={!!editingLevel}
                        />
                        {!editingLevel && (
                            <label className="sm-checkbox-row">
                                <input type="checkbox" checked={isPartitionable} onChange={e => setIsPartitionable(e.target.checked)} />
                                <span className="sm-label" style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Support Partition (Rows/Cols)</span>
                            </label>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {editingLevel && (
                            <button className="sm-btn sm-btn-secondary" onClick={() => { setEditingLevel(null); setLevelName(""); }} style={{ height: 50 }}>
                                Cancel
                            </button>
                        )}
                        <button className="sm-btn sm-btn-primary" onClick={editingLevel ? handleRename : handleAdd} style={{ height: 50 }}>
                            {editingLevel ? "Update Name" : <><Plus size={18} /> Add Level</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-32">
                <label className="sm-label">Visual Model (Drag to Reorder)</label>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="sm-structure-chain">
                        <SortableContext
                            items={levels.map(l => l.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {levels.map((level, index) => (
                                <div key={level.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <SortableItem
                                        level={level}
                                        onDelete={handleDelete}
                                        onRename={(l) => { setEditingLevel(l); setLevelName(l.name); }}
                                    />
                                    {index < levels.length - 1 && <ArrowRight className="sm-chain-arrow" size={24} />}
                                </div>
                            ))}
                        </SortableContext>
                    </div>
                </DndContext>

                {!loading && levels.length === 0 && (
                    <div className="sm-empty">
                        <Layers size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                        <p>No storage structures defined. Start by adding your first level.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StructureSection;
