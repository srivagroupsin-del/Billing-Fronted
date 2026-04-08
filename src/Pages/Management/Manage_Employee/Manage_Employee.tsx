// ManageEmployee.tsx
import React, { useState } from "react";
import { Edit, Trash2, X } from "lucide-react";
import "./Manage_Employee.css";

const ManageEmployee: React.FC = () => {
    const [employees, setEmployees] = useState([
        { empId: "emp001", name: "John Doe", department: "HR", role: "Manager", access: ["Admin"] },
        { empId: "emp002", name: "Jane Smith", department: "IT", role: "Developer", access: ["User"] },
        { empId: "emp003", name: "Mark Wilson", department: "Finance", role: "Analyst", access: ["Read", "Write"] },
    ]);

    const [accessOptions, setAccessOptions] = useState(["Read", "Write", "Admin"]);

    const [formData, setFormData] = useState<{
        empId: string;
        name: string;
        department: string;
        role: string;
        access: string[];
    }>({
        empId: "",
        name: "",
        department: "",
        role: "",
        access: [],
    });

    const [isAccessDropdownOpen, setIsAccessDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsAccessDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchedEmployee, setSearchedEmployee] = useState<any>(null);

    const [isAddAccessModalOpen, setIsAddAccessModalOpen] = useState(false);
    const [newAccessValue, setNewAccessValue] = useState("");

    const [tableSearch, setTableSearch] = useState("");
    const [showCount, setShowCount] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const handleSearch = () => {
        const found = employees.find((emp) => emp.empId.toLowerCase() === searchQuery.toLowerCase());
        setSearchedEmployee(found || null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.access.length === 0) {
            alert("Please select at least one access level.");
            return;
        }
        const exists = employees.find(emp => emp.empId === formData.empId);
        if (exists) {
            setEmployees(employees.map(emp => emp.empId === formData.empId ? { ...emp, ...formData } : emp));
            alert("Employee Updated Successfully!");
        } else {
            setEmployees([...employees, { ...formData, name: formData.name || "N/A" }]);
            alert("Employee Added Successfully!");
        }
    };

    const searchFilteredEmployees = employees.filter(emp =>
        emp.empId.toLowerCase().includes(tableSearch.toLowerCase()) ||
        emp.role.toLowerCase().includes(tableSearch.toLowerCase()) ||
        emp.department.toLowerCase().includes(tableSearch.toLowerCase())
    );

    const totalEntries = searchFilteredEmployees.length;
    const totalPages = Math.ceil(totalEntries / showCount) || 1;
    const startIndex = (currentPage - 1) * showCount;
    const currentEmployees = searchFilteredEmployees.slice(startIndex, startIndex + showCount);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    const handlePageChange = (page: number | string) => {
        if (typeof page === 'number' && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="container">
                <h2>Manage Employee</h2>
                <form onSubmit={handleSubmit} className="form">
                    <div className="form-left">
                        {/* Employee ID */}
                        <button
                            type="button"
                            className={`emp-id-btn ${formData.empId ? 'btn-selected-green' : 'btn-unselected-red'}`}
                            onClick={() => setIsPopupOpen(true)}
                        >
                            {formData.empId ? formData.empId : "Select Employee ID"}
                        </button>

                        {formData.empId && (() => {
                            const selectedEmp = employees.find(e => e.empId === formData.empId);
                            return (
                                <div className="selected-employee-details green-card">
                                    <h4>Employee Details</h4>
                                    <div className="employee-details-data">
                                        <div className="employee-details-left">
                                            <p><strong>ID:</strong> {formData.empId}</p>
                                            <p><strong>Name:</strong> {formData.name || (selectedEmp ? selectedEmp.name : "N/A")}</p>
                                            <p><strong>Department:</strong> {formData.department}</p>
                                            <p><strong>Role:</strong> {formData.role}</p>
                                            <p><strong>Access:</strong> {formData.access.length > 0 ? formData.access.join(", ") : (selectedEmp ? selectedEmp.access.join(", ") : "N/A")}</p>
                                        </div>
                                        <div className="employee-details-right">
                                            <div className="employee-photo-box">
                                                <img src={(selectedEmp as any)?.photo || "https://via.placeholder.com/100"} alt="Employee Photo" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="form-right">
                        {/* Department Dropdown */}
                        <div className="input-group">
                            <label>Department</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="HR">HR</option>
                                <option value="IT">IT</option>
                                <option value="Finance">Finance</option>
                            </select>
                        </div>

                        {/* Role Dropdown */}
                        <div className="input-group">
                            <label>Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="Manager">Manager</option>
                                <option value="Developer">Developer</option>
                                <option value="Analyst">Analyst</option>
                            </select>
                        </div>

                        {/* Custom Multiple Access Dropdown */}
                        <div className="input-group">
                            <label>Access</label>
                            <div className="custom-multi-select" ref={dropdownRef} style={{ position: 'relative' }}>
                                <div 
                                    className="select-trigger" 
                                    onClick={() => setIsAccessDropdownOpen(!isAccessDropdownOpen)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        backgroundColor: '#ffffff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: '#374151'
                                    }}
                                >
                                    <span>Select Access Options</span>
                                    <span style={{ 
                                        transform: isAccessDropdownOpen ? 'rotate(180deg)' : 'none', 
                                        transition: 'transform 0.2s',
                                        fontSize: '0.8rem'
                                    }}>▼</span>
                                </div>

                                {isAccessDropdownOpen && (
                                    <div className="select-options-container" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        width: '100%',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        marginTop: '4px',
                                        zIndex: 50,
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                        maxHeight: '200px',
                                        overflowY: 'auto'
                                    }}>
                                        {accessOptions.map((opt, i) => {
                                            const isSelected = formData.access.includes(opt);
                                            return (
                                                <div 
                                                    key={i}
                                                    onClick={() => {
                                                        if (!isSelected) {
                                                            setFormData({ ...formData, access: [...formData.access, opt] });
                                                        } else {
                                                            setFormData({ ...formData, access: formData.access.filter(a => a !== opt) });
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '10px 14px',
                                                        cursor: 'pointer',
                                                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                                        color: isSelected ? '#1d4ed8' : '#374151',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        fontWeight: isSelected ? 600 : 400
                                                    }}
                                                    title={isSelected ? "Click to deselect" : "Click to select"}
                                                >
                                                    {opt}
                                                </div>
                                            );
                                        })}
                                        <div 
                                            onClick={() => {
                                                setIsAccessDropdownOpen(false);
                                                setIsAddAccessModalOpen(true);
                                            }}
                                            style={{
                                                padding: '10px 14px',
                                                cursor: 'pointer',
                                                color: '#4f46e5',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Access
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tags/Chips below dropdown */}
                            <div className="access-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                {formData.access.map(acc => (
                                    <div key={acc} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: '#e0e7ff',
                                        color: '#4338ca',
                                        padding: '5px 12px',
                                        borderRadius: '9999px',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        {acc}
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData({ ...formData, access: formData.access.filter(a => a !== acc) })}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                marginLeft: '6px',
                                                cursor: 'pointer',
                                                color: '#4338ca',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 2,
                                                borderRadius: '50%',
                                                transition: 'background-color 0.2s',
                                            }}
                                        >
                                            <X size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit">Update / Add Employee</button>
                    </div>
                </form>
            </div>

            {/* Employee Table */}
            <div className="container" style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>Employee List</h3>

                <div className="table-top-controls">
                    <div className="search-control">
                        <label>EMPLOYEE SEARCH</label>
                        <input
                            type="text"
                            placeholder="Type employee ID or role..."
                            value={tableSearch}
                            onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="show-control">
                        <label>SHOW</label>
                        <select
                            value={showCount}
                            onChange={(e) => { setShowCount(Number(e.target.value)); setCurrentPage(1); }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                        </select>
                    </div>
                </div>

                <div className="table-container" style={{ marginTop: '0' }}>
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Employee_ID</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Access</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEmployees.map((emp, index) => (
                                <tr key={emp.empId}>
                                    <td>{startIndex + index + 1}</td>
                                    <td>{emp.empId}</td>
                                    <td>{emp.department}</td>
                                    <td>{emp.role}</td>
                                    <td>{emp.access.join(", ")}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                type="button"
                                                className="action-btn edit-btn"
                                                onClick={() => setFormData(emp)}
                                                title="Edit Employee"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn delete-btn"
                                                onClick={() => setEmployees(employees.filter(e => e.empId !== emp.empId))}
                                                title="Delete Employee"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                                        No employees found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-container">
                    <div className="pagination-info">
                        Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + showCount, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="pagination-controls">
                        <div className="go-to-page">
                            Go to Page:
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={currentPage}
                                onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <button
                            className="page-btn prev-next"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            «
                        </button>
                        {getPageNumbers().map((page, index) => (
                            <button
                                key={index}
                                className={`page-btn ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                                onClick={() => handlePageChange(page)}
                                disabled={page === '...'}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className="page-btn prev-next"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>

            {/* Popup Modal */}
            {isPopupOpen && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h3>Search Employee</h3>
                            <button type="button" className="close-btn" onClick={() => setIsPopupOpen(false)}>✕</button>
                        </div>
                        <div className="popup-body">
                            <input
                                type="text"
                                placeholder="Enter Employee ID"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="button" onClick={handleSearch} className="search-btn">Search</button>

                            {searchedEmployee && (
                                <div className="employee-details-card">
                                    <div className="employee-details-data">
                                        <div className="employee-details-left">
                                            <p><strong>ID:</strong> {searchedEmployee.empId}</p>
                                            <p><strong>Name:</strong> {searchedEmployee.name || "N/A"}</p>
                                            <p><strong>Department:</strong> {searchedEmployee.department}</p>
                                            <p><strong>Role:</strong> {searchedEmployee.role}</p>
                                            <p><strong>Access:</strong> {searchedEmployee.access.join(", ")}</p>
                                        </div>
                                        <div className="employee-details-right">
                                            <div className="employee-photo-box">
                                                <img src={searchedEmployee.photo || "https://via.placeholder.com/100"} alt="Employee Photo" />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="select-btn"
                                        onClick={() => {
                                            setFormData({
                                                empId: searchedEmployee.empId,
                                                name: searchedEmployee.name || "",
                                                department: searchedEmployee.department,
                                                role: searchedEmployee.role,
                                                access: searchedEmployee.access
                                            });
                                            setIsPopupOpen(false);
                                        }}
                                    >
                                        Select Employee
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Access Modal */}
            {isAddAccessModalOpen && (
                <div className="popup-overlay">
                    <div className="popup-content" style={{ maxWidth: '400px' }}>
                        <div className="popup-header">
                            <h3>Add New Access</h3>
                            <button type="button" className="close-btn" onClick={() => {
                                setIsAddAccessModalOpen(false);
                                setNewAccessValue("");
                            }}>✕</button>
                        </div>
                        <div className="popup-body">
                            <input
                                type="text"
                                placeholder="Enter access name..."
                                value={newAccessValue}
                                onChange={(e) => setNewAccessValue(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '10px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #ccc',
                                    marginBottom: '20px'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddAccessModalOpen(false);
                                        setNewAccessValue("");
                                    }}
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '8px', 
                                        border: '1px solid #ccc', 
                                        background: 'red',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newAccessValue.trim()) {
                                            const trimmed = newAccessValue.trim();
                                            if (!accessOptions.includes(trimmed)) {
                                                setAccessOptions([...accessOptions, trimmed]);
                                            }
                                            if (!formData.access.includes(trimmed)) {
                                                setFormData({ ...formData, access: [...formData.access, trimmed] });
                                            }
                                        }
                                        setIsAddAccessModalOpen(false);
                                        setNewAccessValue("");
                                    }}
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '8px', 
                                        border: 'none', 
                                        background: 'var(--primary, #4f46e5)', 
                                        color: 'white', 
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Add Access
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageEmployee;
