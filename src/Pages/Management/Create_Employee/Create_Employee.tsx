import React, { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import "./Create_Employee.css";

const CreateEmployee: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        idProofType: "",
        idProofValue: "",
        department: "",
        role: "",
        photo: null as File | null,
    });

    const [employees, setEmployees] = useState([
        { empId: "emp001", department: "HR", role: "Manager", access: "Admin" },
        { empId: "emp002", department: "IT", role: "Developer", access: "User" },
        { empId: "emp003", department: "Finance", role: "Analyst", access: "Read" },
    ]);

    const [tableSearch, setTableSearch] = useState("");
    const [showCount, setShowCount] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({ ...formData, photo: e.target.files[0] });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Employee Data:", formData);
        alert("Employee Created Successfully!");

        // Mocking the add to list:
        const newEmpID = `emp00${employees.length + 1}`;
        setEmployees([...employees, {
            empId: newEmpID,
            department: formData.department || "N/A",
            role: formData.role || "N/A",
            access: "Read" // Dummy access since it's not collected in CreateEmployee form
        }]);
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
                <h2>Create Employee</h2>
                <form onSubmit={handleSubmit} className="form">
                    <div className="input-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Email ID</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email ID"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Select ID Proof</label>
                        <select
                            name="idProofType"
                            value={formData.idProofType}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select ID Proof</option>
                            <option value="Aadhar">Aadhar</option>
                            <option value="PAN">PAN</option>
                            <option value="Passport">Passport</option>
                        </select>
                    </div>

                    {formData.idProofType && (
                        <div className="input-group">
                            <label>{formData.idProofType} Number</label>
                            <input
                                type="text"
                                name="idProofValue"
                                placeholder={`Enter ${formData.idProofType} Number`}
                                value={formData.idProofValue}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

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
                            <option value="Marketing">Marketing</option>
                            <option value="Sales">Sales</option>
                            <option value="Operations">Operations</option>
                        </select>
                    </div>

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
                            <option value="Designer">Designer</option>
                            <option value="Admin">Admin</option>
                            <option value="Executive">Executive</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Upload Photo</label>
                        <input
                            type="file"
                            name="photo"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input"
                            title="Upload Employee Photo"
                        />
                    </div>

                    <button type="submit">Create Employee</button>
                </form>
            </div>

            { /* Employee Table */}
            <div className="container" style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '25px', textAlign: 'center', fontSize: '20px', color: '#1a202c' }}>Employee List</h3>

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

                <div className="table-container" style={{ marginTop: '20px' }}>
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th>S.NO</th>
                                <th>EMPLOYEE_ID</th>
                                <th>DEPARTMENT</th>
                                <th>ROLE</th>
                                <th>ACCESS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEmployees.map((emp, index) => (
                                <tr key={emp.empId}>
                                    <td>{startIndex + index + 1}</td>
                                    <td>{emp.empId}</td>
                                    <td>{emp.department}</td>
                                    <td>{emp.role}</td>
                                    <td>{emp.access}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                type="button"
                                                className="action-btn hollow-edit-btn"
                                                onClick={() => alert("Edit Functionality")}
                                                title="Edit Employee"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn hollow-delete-btn"
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
        </div>
    );
};

export default CreateEmployee;