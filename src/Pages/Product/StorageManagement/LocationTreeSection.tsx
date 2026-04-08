import { useEffect, useState } from "react";
import {
    getStorageLocations,
    createStorageLocation,
    deleteStorageLocation,
    getStructureLevels,
    updateStorageLocation
} from "../../../api/storage";
import {
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    Grid as GridIcon,
    Layers,
    Loader2,
    Edit2,
    Move
} from "lucide-react";
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
    storageTypeId: number;
    showToast?: (message: string, type?: 'success' | 'error') => void;
}

const LocationTreeSection = ({ storageTypeId, showToast }: Props) => {
    const [locations, setLocations] = useState<any[]>([]);
    const [structure, setStructure] = useState<any[]>([]);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [modal, setModal] = useState<{ open: boolean, parent?: any, nextLevel?: any }>({ open: false });
    const [form, setForm] = useState({ name: "", code: "", rows: 0, cols: 0 });
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locRes, strRes] = await Promise.all([
                getStorageLocations(storageTypeId),
                getStructureLevels(storageTypeId)
            ]);
            setLocations(locRes.data || []);
            setStructure(strRes.data.sort((a: any, b: any) => a.level_order - b.level_order) || []);
        } catch (error) {
            console.error("Fetch Data failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (storageTypeId) fetchData();
    }, [storageTypeId]);


    const handleCreate = async () => {
        const { parent, nextLevel } = modal;
        if (!nextLevel) return;

        if (form.rows * form.cols > 200) {
            showToast?.("Partition size exceeded! Max 200 (Rows × Columns)", "error");
            return;
        }

        const payload: any = {
            storage_type_id: storageTypeId,
            parent_id: parent ? parent.id : null,
            level_id: nextLevel.id,
            name: form.name
        };

        // Fix Issue 4: DUPLICATE_CODE error when code is empty
        if (form.code && form.code.trim() !== "") {
            payload.code = form.code.trim();
        }

        if (form.rows > 0 && form.cols > 0) {
            payload.partition_rows = form.rows;
            payload.partition_columns = form.cols;
        }

        setCreating(true);
        try {
            const newLocation = await createStorageLocation(payload);

            // 👉 instant UI update
            setLocations(prev => {
                const updated = JSON.parse(JSON.stringify(prev));

                const addChild = (nodes: any[]) => {
                    for (let node of nodes) {
                        if (node.id === payload.parent_id) {
                            node.children = node.children || [];
                            node.children.push({
                                id: newLocation.data?.id || Date.now(),
                                ...payload,
                                children: []
                            });
                            return true;
                        }

                        if (node.children && addChild(node.children)) return true;
                    }
                    return false;
                };

                if (payload.parent_id) {
                    addChild(updated);
                } else {
                    updated.push({
                        id: newLocation.data?.id || Date.now(),
                        ...payload,
                        children: []
                    });
                }

                return updated;
            });
            setExpanded(prev => ({
                ...prev,
                [payload.parent_id || newLocation.data.id]: true
            }));
            setTimeout(() => {
                fetchData();
            }, 300);

            // Reset UI
            setModal({ open: false });
            setForm({ name: "", code: "", rows: 0, cols: 0 });
        } catch (error: any) {
            const msg = error?.response?.data?.message || "DUPLICATE_CODE" || "Creation failed";
            showToast?.(msg === "DUPLICATE_CODE" ? "Duplicate Location Code detected" : msg, 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will delete all child locations.")) return;
        try {
            await deleteStorageLocation(id);
            showToast?.("Deleted successfully", "success");
            await fetchData();
        } catch (error: any) {
            const errorType = error?.response?.data?.error_type;
            if (errorType === 'LOCATION_IN_USE') showToast?.("Cannot delete: Products are assigned to this location.", 'error');
            else if (errorType === 'HAS_CHILDREN') showToast?.("Delete child items first.", 'error');
            else showToast?.("Delete failed.", 'error');
        }
    };

    const toggleExpand = (id: number) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        if (locations.length > 0) {
            const expandedMap: any = {};
            locations.forEach((loc: any) => {
                expandedMap[loc.id] = true;
            });
            setExpanded(expandedMap);
        }
    }, [locations]);

    const [editingNode, setEditingNode] = useState<any>(null);
    const [originalPartition, setOriginalPartition] = useState({ rows: 0, cols: 0 });

    const handleEdit = (node: any) => {
        setEditingNode(node);
        setForm({
            name: node.name,
            code: node.code || "",
            rows: node.partition_rows || 0,
            cols: node.partition_columns || 0
        });
        setOriginalPartition({
            rows: node.partition_rows || 0,
            cols: node.partition_columns || 0
        });
        setModal({ open: true, parent: null, nextLevel: structure.find(s => s.id === node.level_id) });
    };

    const handleUpdate = async () => {
        if (!editingNode) return;

        if (form.rows * form.cols > 200) {
            showToast?.("Partition size exceeded! Max 200 (Rows × Columns)", "error");
            return;
        }

        const payload: any = {
            name: form.name
        };

        if (form.code && form.code.trim() !== "") {
            payload.code = form.code.trim();
        }

        if (form.rows > 0 && form.cols > 0) {
            payload.partition_rows = form.rows;
            payload.partition_columns = form.cols;
        }

        const partitionChanged = form.rows !== originalPartition.rows || form.cols !== originalPartition.cols;
        if (partitionChanged && !confirm("Updating rows/columns will reset all partitions. Continue?")) {
            return;
        }

        setCreating(true);
        try {
            await updateStorageLocation(editingNode.id, payload);
            showToast?.("Updated successfully", "success");
            
            // Optimistic update for the edited node
            setLocations(prev => {
                const updated = JSON.parse(JSON.stringify(prev));
                const updateNode = (nodes: any[]) => {
                    for (let node of nodes) {
                        if (node.id === editingNode.id) {
                            node.name = payload.name;
                            node.code = payload.code || "";
                            node.partition_rows = payload.partition_rows;
                            node.partition_columns = payload.partition_columns;
                            return true;
                        }
                        if (node.children && updateNode(node.children)) return true;
                    }
                    return false;
                };
                updateNode(updated);
                return updated;
            });

            setTimeout(() => {
                fetchData();
            }, 300);

            setModal({ open: false });
            setEditingNode(null);
            setForm({ name: "", code: "", rows: 0, cols: 0 });
        } catch (error: any) {
            const errorType = error?.response?.data?.error_type;
            const msg = error?.response?.data?.message || "Update failed";
            if (errorType === 'DUPLICATE_CODE') showToast?.("Code already exists", 'error');
            else if (errorType === 'INVALID_UPDATE') showToast?.("Cannot modify. Data locked", 'error');
            else if (errorType === 'LOCATION_IN_USE') showToast?.("Cannot update: Location or its partitions are in use.", 'error');
            else showToast?.(msg, 'error');
        } finally {
            setCreating(false);
        }
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const [draggingNode, setDraggingNode] = useState<any>(null);

    const handleDragStart = (event: any) => {
        setDraggingNode(event.active.data.current.node);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setDraggingNode(null);

        if (!over || active.id === over.id) return;
 
        const overNode = over.data.current.node;

        // Determine if we are changing parent
        // In this implementation, we'll allow dropping ON a node to make it a child
        const newParentId = overNode.id;

        // Optimistic Update
        const oldLocations = JSON.parse(JSON.stringify(locations));
        setLocations(prev => {
            const updated = JSON.parse(JSON.stringify(prev));
            const removeNode = (nodes: any[], id: number) => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === id) {
                        const removed = nodes.splice(i, 1)[0];
                        return removed;
                    }
                    if (nodes[i].children) {
                        const removed: any = removeNode(nodes[i].children, id);
                        if (removed) return removed;
                    }
                }
                return null;
            };

            const nodeToMove = removeNode(updated, active.id);
            if (!nodeToMove) return prev;

            const addNode = (nodes: any[], targetId: number, node: any) => {
                for (let n of nodes) {
                    if (n.id === targetId) {
                        n.children = n.children || [];
                        n.children.push(node);
                        return true;
                    }
                    if (n.children && addNode(n.children, targetId, node)) return true;
                }
                return false;
            };

            addNode(updated, newParentId, nodeToMove);
            return updated;
        });

        try {
            const res = await updateStorageLocation(active.id, { parent_id: newParentId });
            if (!res.status) throw new Error("Update failed");
            showToast?.("Moved successfully", "success");
            
            // Delay fetchData to prevent snap-back during animation
            setTimeout(() => {
                fetchData();
            }, 500); 
        } catch (error) {
            showToast?.("Failed to move location. Reverting...", 'error');
            setLocations(oldLocations);
        }
    };

    const SortableNode = ({ node }: { node: any }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
            id: node.id,
            data: { node }
        });

        const style = {
            transform: CSS.Translate.toString(transform),
            transition,
            opacity: isDragging ? 0.4 : 1,
        };

        return (
            <div ref={setNodeRef} style={style}>
                {renderNode(node, attributes, listeners)}
            </div>
        );
    };

    const renderNode = (node: any, attributes?: any, listeners?: any) => {
        const nodeLevel = structure.find(s => s.id === node.level_id);
        const nextLevel = structure.find(s => s.level_order === (nodeLevel?.level_order + 1));
        const isOpen = expanded[node.id];

        const children = node.children || [];

        return (
            <div key={node.id} className="sm-tree-node-container">
                <div className={`sm-tree-node-row ${draggingNode?.id === node.id ? 'dragging' : ''}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: '4px 8px', borderRadius: 6, transition: 'all 0.2s', background: 'white', border: '1px solid #e2e8f0', marginBottom: 4 }}>

                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} style={{ cursor: "grab", color: '#94a3b8' }}>
                        <Move size={14} />
                    </div>

                    {/* Expand */}
                    <div onClick={() => toggleExpand(node.id)} style={{ cursor: "pointer", width: 20, display: 'flex', justifyContent: 'center' }}>
                        {children.length > 0 ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <div style={{ width: 14 }} />}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                        {nodeLevel?.name}: {node.name} <span style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>({node.code || 'No Code'})</span>
                    </div>

                    <div className="sm-node-actions" style={{ display: 'flex', gap: 6 }}>
                        {/* ✏️ EDIT */}
                        <button
                            onClick={() => handleEdit(node)}
                            className="sm-btn-icon"
                            style={{ padding: '4px' }}
                            title="Edit Location"
                        >
                            <Edit2 size={14} />
                        </button>

                        {/* ➕ ADD CHILD */}
                        {nextLevel && (
                            <button
                                onClick={() => {
                                    setEditingNode(null);
                                    setForm({ name: "", code: "", rows: 0, cols: 0 });
                                    setModal({ open: true, parent: node, nextLevel });
                                }}
                                className="sm-btn-icon text-blue"
                                style={{ padding: '4px' }}
                                title={`Add ${nextLevel.name}`}
                            >
                                <Plus size={14} />
                            </button>
                        )}

                        {/* 🗑 DELETE */}
                        <button
                            onClick={() => handleDelete(node.id)}
                            className="sm-btn-icon text-red"
                            style={{ padding: '4px' }}
                            title="Delete Location"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                </div>

                {isOpen && children.length > 0 && (
                    <div className="sm-tree-children" style={{ marginLeft: 20, borderLeft: '1px dashed #cbd5e1', paddingLeft: 12 }}>
                        {children.map((child: any) => (
                            <SortableNode key={child.id} node={child} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const firstLevel = structure.find(l => l.level_order === 1);

    return (
        <div className="sm-location-builder">
            <header className="sm-section-header">
                <h3>4. Location <span>Builder</span></h3>
                {firstLevel && (
                    <button
                        className="sm-btn sm-btn-primary"
                        onClick={() => setModal({ open: true, nextLevel: firstLevel })}
                        disabled={loading}
                    >
                        <Plus size={18} />
                        Add {firstLevel.name}
                    </button>
                )}
            </header>

            <div className="sm-tree">
                {loading && locations.length === 0 && (
                    <div className="sm-empty" style={{ padding: '40px 20px' }}>
                        <Loader2 className="animate-spin" size={32} color="#3b82f6" />
                        <p style={{ marginTop: 12 }}>Loading locations...</p>
                    </div>
                )}
                {!loading && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={locations.map(n => n.id)} strategy={verticalListSortingStrategy}>
                            {locations.map(node => (
                                <SortableNode key={node.id} node={node} />
                            ))}
                        </SortableContext>
                        <DragOverlay>
                            {draggingNode ? (
                                <div style={{ background: 'white', padding: '8px 16px', borderRadius: 8, border: '2px solid #3b82f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', opacity: 0.9 }}>
                                    {draggingNode.name}
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}

                {!loading && locations.length === 0 && (
                    <div className="sm-empty" style={{ padding: '40px 20px' }}>
                        <Layers size={32} style={{ opacity: 0.1, marginBottom: 12 }} />
                        <p style={{ fontSize: 13 }}>No locations built yet. Start by adding a root node.</p>
                    </div>
                )}
            </div>

            {modal.open && (
                <div className="sm-modal-overlay" onClick={() => setModal({ ...modal, open: false })}>
                    <div className="sm-modal" onClick={e => e.stopPropagation()}>
                        <h2 className="sm-modal-title">
                            {editingNode ? `Edit ${editingNode.name}` : `Add ${modal.nextLevel?.name}`}
                            <span style={{ fontSize: 13, color: '#64748b', display: 'block', fontWeight: 500, marginTop: 4 }}>
                                {editingNode ? `Level: ${modal.nextLevel?.name}` : (modal.parent ? `Inside: ${modal.parent.name}` : "Primary Level")}
                            </span>
                        </h2>

                        <div className="sm-form-grid-2">
                            <div className="sm-form-group">
                                <label className="sm-label">Location Name</label>
                                <input
                                    className="sm-input"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder={`e.g. ${modal.nextLevel?.name} 1`}
                                    autoFocus
                                    disabled={creating}
                                />
                            </div>
                            <div className="sm-form-group">
                                <label className="sm-label">Unique Code (Optional)</label>
                                <input
                                    className="sm-input"
                                    value={form.code}
                                    onChange={e => setForm({ ...form, code: e.target.value })}
                                    placeholder="Leave blank for auto-gen"
                                    disabled={creating}
                                />
                            </div>
                        </div>

                        {modal.nextLevel?.is_partitionable && (
                            <div className="sm-partition-grid">
                                <div style={{ gridColumn: '1 / span 2', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <GridIcon size={16} color="#2563eb" />
                                        <span className="sm-label" style={{ margin: 0 }}>Partition Setup</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>This level supports auto-partitioning.</p>
                                </div>
                                <div className="sm-form-group" style={{ margin: 0 }}>
                                    <label className="sm-label">Rows</label>
                                    <input
                                        type="number"
                                        className="sm-input"
                                        value={form.rows}
                                        onChange={e => setForm({ ...form, rows: Number(e.target.value) })}
                                        disabled={creating}
                                    />
                                </div>
                                <div className="sm-form-group" style={{ margin: 0 }}>
                                    <label className="sm-label">Columns</label>
                                    <input
                                        type="number"
                                        className="sm-input"
                                        value={form.cols}
                                        onChange={e => setForm({ ...form, cols: Number(e.target.value) })}
                                        disabled={creating}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="sm-modal-footer">
                            <button className="sm-btn sm-btn-secondary" onClick={() => {
                                setModal({ ...modal, open: false });
                                setEditingNode(null);
                            }} disabled={creating}>Cancel</button>
                            <button className="sm-btn sm-btn-primary" onClick={editingNode ? handleUpdate : handleCreate} disabled={creating}>
                                {creating ? <Loader2 className="animate-spin" size={18} /> : (editingNode ? "Update Location" : "Build Location")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationTreeSection;